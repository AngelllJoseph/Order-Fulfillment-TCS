import uuid
from django.db import models
from django.conf import settings


class AIDecision(models.Model):
    DECISION_TYPE_CHOICES = [
        ('ASSIGNMENT', 'Assignment'),
        ('DELAY_PREDICTION', 'Delay Prediction'),
        ('INVENTORY_ALERT', 'Inventory Alert'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('AUTO_EXECUTED', 'Auto Executed'),
        ('WAITING_APPROVAL', 'Waiting Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    decision_type = models.CharField(max_length=50, choices=DECISION_TYPE_CHOICES)
    related_order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_decisions',
    )
    recommendation = models.JSONField(default=dict)
    confidence_score = models.FloatField(default=0.0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    executed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Decision'
        verbose_name_plural = 'AI Decisions'

    def __str__(self):
        order_ref = self.related_order.order_id if self.related_order else 'N/A'
        return f"[{self.decision_type}] Order: {order_ref} — {self.status}"


class AIApproval(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    decision = models.ForeignKey(AIDecision, on_delete=models.CASCADE, related_name='approvals')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status_changed_to = models.CharField(max_length=30)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'AI Approval'
        verbose_name_plural = 'AI Approvals'

    def __str__(self):
        actor_name = self.actor.email if self.actor and hasattr(self.actor, 'email') else 'System'
        return f"Approval for {str(self.decision.id)[:8]} by {actor_name} -> {self.status_changed_to}"

