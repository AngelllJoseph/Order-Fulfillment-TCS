from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Inventory
from apps.notifications.models import Notification
from apps.ai_engine.models import AIDecision
from django.utils import timezone

@receiver(post_save, sender=Inventory)
def check_inventory_levels(sender, instance, **kwargs):
    """
    Automatically monitors inventory levels and creates a Notification and AIDecision
    if free stock falls below the reorder threshold.
    """
    if instance.free_stock < instance.reorder_threshold:
        # 1. Create Notification (avoiding duplicates for unread alerts)
        notification_title = "Low Stock Alert"
        if not Notification.objects.filter(
            title=notification_title,
            related_product_name=instance.product.name,
            is_read=False
        ).exists():
            Notification.objects.create(
                user=None,  # System-wide alert
                title=notification_title,
                message=f"{instance.product.name} at {instance.hub.name} is below reorder threshold. Current free stock: {instance.free_stock}",
                type='WARNING',
                related_product_name=instance.product.name
            )

        # 2. Create AIDecision
        # We always create an AI Decision to track the event in the AI Engine
        AIDecision.objects.create(
            decision_type='INVENTORY_ALERT',
            recommendation={
                'product_name': instance.product.name,
                'hub_name': instance.hub.name,
                'current_free_stock': instance.free_stock,
                'threshold': instance.reorder_threshold,
                'reasoning_text': f"Automated alert: Free stock ({instance.free_stock}) is below threshold ({instance.reorder_threshold})."
            },
            status='AUTO_EXECUTED',
            confidence_score=1.0,
            executed=True,
            executed_at=timezone.now()
        )
