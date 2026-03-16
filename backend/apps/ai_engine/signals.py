from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AIDecision
from .services.decision_executor import process_decision

@receiver(post_save, sender=AIDecision)
def trigger_ai_execution(sender, instance, created, **kwargs):
    """
    Trigger the automatic execution logic whenever a new AIDecision is created.
    """
    if created and instance.status == 'PENDING':
        process_decision(instance)
