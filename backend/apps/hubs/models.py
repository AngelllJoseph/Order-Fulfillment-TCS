import uuid
from django.db import models

class Hub(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('MAINTENANCE', 'Maintenance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hub_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    
    # Contact Info
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Capacity
    max_daily_capacity = models.IntegerField(default=500)
    max_concurrent_orders = models.IntegerField(default=100)
    current_load = models.IntegerField(default=0)
    supported_skus = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated SKUs supported by this hub")

    
    # Operational
    production_lead_time = models.CharField(max_length=100, help_text="e.g., 24-48 hours", blank=True, null=True)
    operating_hours = models.CharField(max_length=255, help_text="e.g., 9 AM - 6 PM, Mon-Sat", blank=True, null=True)
    
    # Settings
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    auto_assignment_enabled = models.BooleanField(default=True)
    priority_level = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_capacity_utilization(self):
        if self.max_daily_capacity == 0:
            return 0
        return (self.current_load / self.max_daily_capacity) * 100

    def __str__(self):
        return f"{self.name} ({self.hub_code})"

    class Meta:
        verbose_name = "Manufacturing Hub"
        verbose_name_plural = "Manufacturing Hubs"
        ordering = ['-created_at']

class HubSKUMapping(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hub = models.ForeignKey(Hub, on_delete=models.CASCADE, related_name='sku_mappings')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='hub_mappings', null=True, blank=True)
    
    # Production Metrics
    max_daily_production = models.IntegerField(default=0, help_text="Units per day", null=True, blank=True)
    lead_time_hours = models.IntegerField(default=24, help_text="Production time in hours", null=True, blank=True)
    priority = models.IntegerField(default=1, help_text="AI order assignment priority (1-10)", null=True, blank=True)
    
    is_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('hub', 'product')
        verbose_name = "Hub SKU Mapping"
        verbose_name_plural = "Hub SKU Mappings"

    def __str__(self):
        return f"{self.hub.name} -> {self.product.name if self.product else 'None'}"
