"""
AI Decision Executor Service
============================
Handles the automatic and manual execution of AI Engine decisions.
Supported decision types:
- ASSIGNMENT: Reassigns hub to order.
- DELAY_PREDICTION: Creates warnings and updates order status.
- INVENTORY_ALERT: Creates low-stock alerts.
"""

import logging
from django.utils import timezone
from apps.ai_engine.models import AIDecision
from apps.notifications.models import Notification
from apps.users.models import AuditLog, User
from apps.common.models import SystemSetting

logger = logging.getLogger(__name__)

def get_auto_execute_threshold():
    """Retrieve the confidence threshold from SystemSetting or default to 0.8."""
    try:
        setting = SystemSetting.objects.get(key='ai_auto_execute_threshold')
        return float(setting.value)
    except (SystemSetting.DoesNotExist, ValueError):
        return 0.8

def process_decision(decision: AIDecision):
    """
    Route a decision to either auto-execution or manual approval 
    based on the system threshold.
    """
    threshold = get_auto_execute_threshold()
    
    if decision.confidence_score >= threshold:
        logger.info(f"Auto-executing decision {decision.id} (Confidence: {decision.confidence_score})")
        execute_decision(decision)
    else:
        logger.info(f"Routing decision {decision.id} to manual approval (Confidence: {decision.confidence_score})")
        decision.status = 'WAITING_APPROVAL'
        decision.save(update_fields=['status'])
        _notify_pending_approval(decision)

def execute_decision(decision: AIDecision, actor: User = None):
    """
    Execute the logic for a given AI decision.
    """
    if decision.decision_type == 'ASSIGNMENT':
        _execute_assignment(decision, actor)
    elif decision.decision_type == 'DELAY_PREDICTION':
        _execute_delay_prediction(decision, actor)
    elif decision.decision_type == 'INVENTORY_ALERT':
        _execute_inventory_alert(decision, actor)
    
    decision.status = 'APPROVED' if actor else 'AUTO_EXECUTED'
    decision.executed = True
    decision.executed_at = timezone.now()
    decision.save(update_fields=['status', 'executed', 'executed_at'])

def _execute_assignment(decision: AIDecision, actor: User = None):
    """Reuse existing assignment logic from hitl_service."""
    from apps.ai_engine.services import hitl_service
    hitl_service.execute_assignment(decision, actor)

def _execute_delay_prediction(decision: AIDecision, actor: User = None):
    """Handle delay prediction execution."""
    order = decision.related_order
    if not order:
        return

    # Update order status to DELAYED if it makes sense
    if order.status not in ['COMPLETED', 'CANCELLED']:
        order.status = 'DELAYED'
        order.delay_reason = decision.recommendation.get('reasoning_text', 'AI Predicted Delay')
        order.save(update_fields=['status', 'delay_reason', 'updated_at'])

    # Create Notification
    Notification.objects.create(
        user=None,  # System-wide or specific? Defaulting to system for now
        title="AI Delay Prediction Alert",
        message=f"Order {order.order_id} is predicted to be delayed. {decision.recommendation.get('reasoning_text', '')}",
        type='WARNING',
        related_order_id=order.order_id
    )

    # Audit Log
    AuditLog.objects.create(
        user=actor,
        action="AI DELAY PREDICTION EXECUTED",
        module="AI Engine",
        new_value=f"Order {order.order_id} marked as DELAYED by AI."
    )

def _execute_inventory_alert(decision: AIDecision, actor: User = None):
    """Handle inventory alert execution."""
    recommendation = decision.recommendation or {}
    product_name = recommendation.get('product_name', 'Unknown Product')
    
    # Create Notification
    Notification.objects.create(
        user=None,
        title="AI Inventory Alert",
        message=f"Urgent: {product_name} is projected to run low on stock. {recommendation.get('reasoning_text', '')}",
        type='ERROR'
    )

    # Audit Log
    AuditLog.objects.create(
        user=actor,
        action="AI INVENTORY ALERT GENERATED",
        module="AI Engine",
        new_value=f"Inventory alert for {product_name}."
    )

def _notify_pending_approval(decision: AIDecision):
    """Notify managers about a decision awaiting approval."""
    managers = User.objects.filter(role='PROGRAM_MANAGER', is_active=True)
    order_ref = decision.related_order.order_id if decision.related_order else 'System'
    
    notifications = [
        Notification(
            user=manager,
            title="AI Decision Awaiting Approval",
            message=f"A new {decision.decision_type} for {order_ref} requires review. Confidence: {decision.confidence_score:.2f}",
            type='INFO',
            related_order_id=order_ref if decision.related_order else None
        )
        for manager in managers
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)
