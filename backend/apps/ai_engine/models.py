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
    related_item = models.ForeignKey(
        'orders.OrderItem',
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
    
    # Orchestration Data
    execution_trace = models.JSONField(default=list, blank=True)
    orchestrator_state = models.JSONField(default=dict, blank=True)

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


class AISettings(models.Model):
    """
    Singleton model for AI engine configuration.
    Do NOT create multiple rows — always use AISettings.get_settings().

    auto_execute_threshold:  Confidence % at or above which decisions are auto-executed.
    hitl_threshold:          Confidence % below which decisions always go to HITL review.
    """
    auto_execute_threshold = models.FloatField(
        default=85.0,
        help_text="Confidence % (0–100) at or above which the AI auto-executes without human review."
    )
    hitl_threshold = models.FloatField(
        default=60.0,
        help_text="Confidence % (0–100) below which the AI decision always requires HITL approval."
    )
    notes = models.TextField(
        blank=True, default='',
        help_text="Optional notes about the current threshold configuration."
    )
    last_updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ai_settings_updates'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'AI Settings'
        verbose_name_plural = 'AI Settings'

    @classmethod
    def get_settings(cls):
        """Return the singleton row, creating defaults if not yet present."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"AISettings (auto_exec≥{self.auto_execute_threshold}%, hitl<{self.hitl_threshold}%)"
