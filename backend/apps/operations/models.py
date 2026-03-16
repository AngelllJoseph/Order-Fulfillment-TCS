from django.db import models

class Alert(models.Model):
    ALERT_TYPES = [
        ('CAPACITY', 'Capacity Alert'),
        ('INVENTORY', 'Inventory Alert'),
        ('DELAY', 'Delay Alert'),
    ]

    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    message = models.TextField()
    related_entity = models.JSONField(default=dict, help_text="Store IDs/Links to Hubs or Orders")
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.severity} - {self.message[:50]}..."
