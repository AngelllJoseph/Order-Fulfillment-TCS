import pandas as pd
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Order, OrderStatusHistory
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusHistorySerializer
from .filters import OrderFilter
from apps.products.models import Product

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('status_history', 'product', 'hub')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = OrderFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            order = serializer.save()
            # Create initial status history
            OrderStatusHistory.objects.create(
                order=order,
                status='ORDERED',
                notes="Order created manually.",
                changed_by=self.request.user if not self.request.user.is_anonymous else None
            )

    @action(detail=False, methods=['post'], url_path='upload-excel')
    def upload_excel(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response({"error": "Unsupported file format. Please upload Excel or CSV."}, status=status.HTTP_400_BAD_REQUEST)

            # Standardize columns (lowercase and strip)
            df.columns = [c.lower().strip().replace(' ', '_') for c in df.columns]

            # Required base logic: SKU and Quantity
            if 'sku' not in df.columns:
                return Response({"error": "Missing 'sku' column."}, status=status.HTTP_400_BAD_REQUEST)
            if 'quantity' not in df.columns:
                return Response({"error": "Missing 'quantity' column."}, status=status.HTTP_400_BAD_REQUEST)

            created_orders = []
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        sku = str(row['sku']).strip()
                        product = Product.objects.filter(sku=sku).first()
                        if not product:
                            product = Product.objects.filter(product_id=sku).first()
                        
                        if not product:
                            errors.append(f"Row {index + 2}: Product with SKU {sku} not found.")
                            continue

                        # Handle Customer Name (Flexible)
                        customer_name = ""
                        if 'customer_name' in df.columns:
                            customer_name = str(row['customer_name']).strip()
                        elif 'customer_first_name' in df.columns and 'customer_last_name' in df.columns:
                            customer_name = f"{str(row['customer_first_name']).strip()} {str(row['customer_last_name']).strip()}".strip()
                        elif 'customer_first_name' in df.columns:
                            customer_name = str(row['customer_first_name']).strip()

                        # Priority
                        priority = str(row.get('priority', 'NORMAL')).upper()
                        if priority not in ['NORMAL', 'HIGH']:
                            priority = 'NORMAL'

                        # Date Handling
                        exp_delivery = row.get('expected_delivery_date')
                        if pd.isna(exp_delivery):
                             # Default to 7 days from now if missing
                            from datetime import timedelta
                            from django.utils import timezone
                            exp_delivery = timezone.now().date() + timedelta(days=7)

                        order_data = {
                            'product': product,
                            'sku': sku,
                            'quantity': int(row['quantity']),
                            'customer_name': customer_name or "Unknown Customer",
                            'customer_phone': str(row.get('customer_phone', '')).strip(),
                            'shipping_address': str(row.get('shipping_address', 'No Address Provided')).strip(),
                            'priority': priority,
                            'expected_delivery_date': exp_delivery
                        }

                        order = Order.objects.create(**order_data)
                        
                        # Create initial status history
                        OrderStatusHistory.objects.create(
                            order=order,
                            status='ORDERED',
                            notes="Order created via Excel import.",
                            changed_by=request.user if not request.user.is_anonymous else None
                        )
                        created_orders.append(order.order_id)

                    except Exception as e:
                        errors.append(f"Row {index + 2}: {str(e)}")

            if errors and not created_orders:
                 return Response({"error": "Failed to import rows", "details": errors}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                "message": f"Successfully processed {len(df)} rows.",
                "created_count": len(created_orders),
                "order_ids": created_orders,
                "errors": errors
            }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)

        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            order.status = new_status
            if new_status == 'COMPLETED':
                from django.utils import timezone
                order.completed_at = timezone.now()
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status=new_status,
                notes=notes,
                changed_by=request.user if not request.user.is_anonymous else None
            )

        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        from django.db.models import Count
        from django.utils import timezone
        
        stats = Order.objects.values('status').annotate(count=Count('id'))
        total = Order.objects.count()
        unassigned = Order.objects.filter(hub__isnull=True).count()
        delayed = Order.objects.filter(expected_delivery_date__lt=timezone.now().date()).exclude(status='COMPLETED').count()
        
        return Response({
            "total_orders": total,
            "unassigned_orders": unassigned,
            "delayed_orders": delayed,
            "stats": {item['status']: item['count'] for item in stats}
        })

    @action(detail=True, methods=['post'], url_path='assign-hub')
    def assign_hub(self, request, pk=None):
        order = self.get_object()
        hub_id = request.data.get('hub_id')
        
        if not hub_id:
            return Response({"error": "hub_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.hubs.models import Hub
        hub = Hub.objects.filter(pk=hub_id).first()
        if not hub:
            return Response({"error": "Hub not found"}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            order.hub = hub
            order.status = 'ASSIGNED'
            order.save()

            OrderStatusHistory.objects.create(
                order=order,
                status='ASSIGNED',
                notes=f"Order assigned to {hub.name} by {request.user.email}",
                changed_by=request.user
            )
            
            # Simple audit log integration (assuming apps.users.models.AuditLog is available)
            try:
                from apps.users.models import AuditLog
                from django.utils import timezone
                AuditLog.objects.create(
                    user=request.user,
                    action=f"ASSIG_ORDER",
                    module="ORDERS",
                    new_value=f"Order {order.order_id} assigned to Hub {hub.name}",
                    timestamp=timezone.now()
                )
            except ImportError:
                pass

        return Response(OrderSerializer(order).data)
