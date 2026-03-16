from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AIDecision
from apps.orders.models import Order
from .services.decision_executor import process_decision
from .tasks import run_langgraph_workflow_task

@receiver(post_save, sender=AIDecision)
def trigger_ai_execution(sender, instance, created, **kwargs):
    """
    Trigger the automatic execution logic whenever a new AIDecision is created.
    """
    if created and instance.status == 'PENDING':
        process_decision(instance)

@receiver(post_save, sender=Order)
def trigger_ai_orchestrator(sender, instance, created, **kwargs):
    """
    Trigger the LangGraph orchestrator automatically when a new Order is created.
    """
    if created:
        try:
            run_langgraph_workflow_task.delay(str(instance.order_id))
        except Exception as e:
            import logging
            logging.error(f"Failed to trigger AI workflow for order {instance.order_id}: {e}")
