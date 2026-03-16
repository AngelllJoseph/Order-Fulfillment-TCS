from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Inventory
from .serializers import InventorySerializer, StockUpdateSerializer
from .services import update_stock
from .permissions import IsManufacturingLead, IsHubScoped
from apps.users.models import AuditLog


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsManufacturingLead, IsHubScoped]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role in ('ADMIN', 'PROGRAM_MANAGER'):
            return queryset
        return queryset.filter(hub_id=self.request.user.hub_id)

    @action(detail=False, methods=['post'], url_path='update')
    def update_inventory(self, request):
        serializer = StockUpdateSerializer(data=request.data)
        if serializer.is_valid():
            hub_id = serializer.validated_data['hub_id']
            product_id = serializer.validated_data['product_id']
            quantity_change = serializer.validated_data['quantity_change']

            # Check hub-scoped access for non-admins
            if request.user.role != 'ADMIN' and str(hub_id) != str(request.user.hub_id):
                return Response(
                    {"error": "You do not have permission to update inventory for this hub."},
                    status=status.HTTP_403_FORBIDDEN
                )

            with transaction.atomic():
                # Get old value for audit log
                try:
                    old_inv = Inventory.objects.get(hub_id=hub_id, product_id=product_id)
                    old_value = f"Available: {old_inv.quantity_available}"
                except Inventory.DoesNotExist:
                    old_value = "New Record"

                inventory = update_stock(hub_id, product_id, quantity_change)

                # Create AuditLog entry
                AuditLog.objects.create(
                    user=request.user,
                    action="UPDATE_STOCK",
                    module="INVENTORY",
                    old_value=old_value,
                    new_value=f"Available: {inventory.quantity_available} (Change: {quantity_change})",
                    timestamp=timezone.now(),
                    ip_address=request.META.get('REMOTE_ADDR')
                )

                return Response(InventorySerializer(inventory).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='hub/(?P<hub_id>[^/.]+)')
    def hub_inventory(self, request, hub_id=None):
        # Admins and Program Managers can view any hub's inventory
        if request.user.role not in ('ADMIN', 'PROGRAM_MANAGER') and str(hub_id) != str(request.user.hub_id):
            return Response(
                {"error": "You do not have permission to view inventory for this hub."},
                status=status.HTTP_403_FORBIDDEN
            )

        inventory_items = Inventory.objects.filter(hub_id=hub_id)
        serializer = InventorySerializer(inventory_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-hub')
    def my_hub_inventory(self, request):
        """Returns inventory for the user's hub, or all inventory for ADMIN/PROGRAM_MANAGER."""
        if request.user.role in ('ADMIN', 'PROGRAM_MANAGER'):
            inventory_items = Inventory.objects.all().select_related('hub', 'product')
        elif request.user.hub_id:
            inventory_items = Inventory.objects.filter(hub_id=request.user.hub_id).select_related('hub', 'product')
        else:
            return Response(
                {"error": "You do not have a hub assigned. Please contact an admin."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InventorySerializer(inventory_items, many=True)
        return Response(serializer.data)
