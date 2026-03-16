from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from apps.ai_engine.models import AIDecision
from apps.orders.models import Order, OrderStatusHistory
from apps.hubs.models import Hub
from apps.ai_engine.services.decision_executor import execute_decision
from .models import Alert
from .serializers import AlertSerializer
from .services.alert_service import generate_operations_alerts

class DelayRisksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Fetch orders predicted to be at risk of delay by the AI engine.
        Returns a formatted list for the Delay Management module.
        """
        # Decisions with DELAY_PREDICTION that are PENDING or WAITING_APPROVAL
        risks = AIDecision.objects.filter(
            decision_type='DELAY_PREDICTION',
            status__in=['PENDING', 'WAITING_APPROVAL']
        ).select_related('related_order')

        data = []
        for risk in risks:
            order = risk.related_order
            if not order:
                continue
            
            data.append({
                "id": str(risk.id),
                "order_id": order.order_id,
                "predicted_delay_days": risk.recommendation.get("predicted_delay_days", 2),
                "risk_reason": risk.recommendation.get("reasoning_text", "Supply chain bottleneck"),
                "suggested_action": risk.recommendation.get("suggested_action", "Reassign to alternative hub"),
                "ai_confidence": risk.confidence_score,
                "current_hub": order.hub.name if order.hub else "Unassigned",
                "expected_delivery": order.expected_delivery_date
            })
        
        return Response(data)

class ReassignHubView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Reassign an order or order item to a different hub.
        Can process via an AI decision_id or direct order_item_id and new_hub_id.
        """
        from apps.orders.services.reassignment_service import execute_reassignment
        
        decision_id = request.data.get("decision_id")
        if decision_id:
            decision = get_object_or_404(AIDecision, id=decision_id)
            order = decision.related_order
            if not order:
                return Response({"error": "No order associated with this decision"}, status=status.HTTP_400_BAD_REQUEST)
                
            current_hub = order.hub
            new_hub = Hub.objects.filter(status='ACTIVE').exclude(id=current_hub.id if current_hub else None).first()
            
            if not new_hub:
                return Response({"error": "No alternative hubs available"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Reassign all items for simplicity in this workflow
            for item in order.items.all():
                execute_reassignment(item.id, new_hub.id, actor=request.user, reason="Delay avoidance strategy")
                
            order.status = 'ASSIGNED'
            order.save(update_fields=['status', 'updated_at'])
            
            decision.status = 'APPROVED'
            decision.save(update_fields=['status'])
            
            return Response({"status": f"Successfully reassigned to {new_hub.name}"})
            
        # Support for explicit manual item reassignment
        order_item_id = request.data.get("order_item_id")
        new_hub_id = request.data.get("new_hub_id")
        
        if order_item_id and new_hub_id:
            execute_reassignment(order_item_id, new_hub_id, actor=request.user)
            return Response({"status": "Item reassigned successfully"})
            
        return Response({"error": "Must provide either decision_id or order_item_id/new_hub_id"}, status=status.HTTP_400_BAD_REQUEST)

class ExtendETAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Adjust the expected delivery date for an order.
        Body: { "order_id": "ORD-...", "new_date": "YYYY-MM-DD" }
        """
        order_ref = request.data.get("order_id")
        new_date = request.data.get("new_date")
        
        order = get_object_or_404(Order, order_id=order_ref)
        order.expected_delivery_date = new_date
        order.save(update_fields=['expected_delivery_date', 'updated_at'])
        
        # Log status change history
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=f"ETA extended to {new_date} by {request.user.email}",
            changed_by=request.user
        )
        
        return Response({"status": "ETA updated successfully"})

class NotifyCustomerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Mock sending a delay notification to the customer.
        Body: { "order_id": "ORD-..." }
        """
        order_ref = request.data.get("order_id")
        order = get_object_or_404(Order, order_id=order_ref)
        
        # In a real app, this would trigger an email/SMS service
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=f"Delay notification sent to customer at {order.customer_email}",
            changed_by=request.user
        )
        
        return Response({"status": "Notification sent to customer"})

class OperationsAlertsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Fetch all active operations alerts.
        Triggers a fresh generation scan before returning.
        """
        # Trigger generation scan
        generate_operations_alerts()
        
        # Return alerts ordered by severity and date
        severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        alerts = Alert.objects.filter(is_resolved=False).order_by('-created_at')
        
        # In-memory sort by severity if needed, but simple date-based for now 
        # as severity is a string. We'll stick to -created_at as per model default.
        serializer = AlertSerializer(alerts, many=True)
        return Response(serializer.data)
