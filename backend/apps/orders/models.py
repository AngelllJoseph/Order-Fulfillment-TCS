import uuid
from django.db import models
from django.utils import timezone

class Order(models.Model):
    PRIORITY_CHOICES = [
        ('NORMAL', 'Normal'),
        ('HIGH', 'High'),
    ]

    STATUS_CHOICES = [
        ('ORDERED', 'Ordered'),
        ('ASSIGNED', 'Assigned to Hub'),
        ('IN_PRODUCTION', 'In Production'),
        ('QUALITY_CHECK', 'Quality Check'),
        ('COMPLETED', 'Completed'),
        ('DELAYED', 'Delayed'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=50, unique=True, editable=False)
    
    # Product Info
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='orders')
    sku = models.CharField(max_length=100) # Denormalized for quick search/history
    quantity = models.PositiveIntegerField(default=1)
    
    # Customer Info
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    shipping_address = models.TextField()
    
    # Assignment & Status
    hub = models.ForeignKey('hubs.Hub', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ORDERED')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateField()
    completed_at = models.DateTimeField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_id:
            # Generate a simple order ID like ORD-20231027-001
            today = timezone.now().strftime('%Y%m%d')
            count = Order.objects.filter(created_at__date=timezone.now().date()).count() + 1
            self.order_id = f"ORD-{today}-{count:03d}"
        
        if self.product and not self.sku:
            self.sku = self.product.sku
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.product.name}"

    class Meta:
        ordering = ['-created_at']

class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Order Status Histories"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.order.order_id} changed to {self.status} at {self.created_at}"
