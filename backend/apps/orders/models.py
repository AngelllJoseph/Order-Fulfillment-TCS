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
        ('MANUFACTURING', 'Manufacturing'),
        ('QUALITY_TEST', 'Quality Test'),
        ('COMPLETED_MANUFACTURING', 'Completed Manufacturing'),
        ('DESPATCHED_TO_WAREHOUSE', 'Despatched to Warehouse'),
        ('DESPATCHED_TO_CUSTOMER', 'Despatched to Customer'),
        ('COMPLETED', 'Completed'),
        ('DELAYED', 'Delayed'),
        ('CANCELLED', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=50, unique=True, editable=False)
    
    # Legacy Product Info (Keeping for migration/backward compatibility, making nullable)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='legacy_orders')
    sku = models.CharField(max_length=100, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1, blank=True, null=True)
    
    # Customer Info
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    shipping_address = models.TextField()
    
    # Assignment & Status
    hub = models.ForeignKey('hubs.Hub', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='ORDERED')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='NORMAL')
    
    # Dates & Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expected_delivery_date = models.DateField()
    
    # Workflow Timestamps
    manufacturing_started_at = models.DateTimeField(null=True, blank=True)
    qa_started_at = models.DateTimeField(null=True, blank=True)
    completed_manufacturing_at = models.DateTimeField(null=True, blank=True)
    warehouse_despatched_at = models.DateTimeField(null=True, blank=True)
    customer_despatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Delay Tracking
    delay_reason = models.CharField(max_length=255, blank=True, null=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.order_id:
            # Generate a simple order ID like ORD-20231027-001
            today = timezone.now().strftime('%Y%m%d')
            count = Order.objects.filter(created_at__date=timezone.now().date()).count() + 1
            self.order_id = f"ORD-{today}-{count:03d}"
        
        # Legacy SKU handling
        if self.product and not self.sku:
            self.sku = self.product.sku
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.customer_name}"

    class Meta:
        ordering = ['-created_at']

class OrderItem(models.Model):
    ASSIGNMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('REJECTED', 'Rejected'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='order_items')
    sku = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    assigned_hub = models.ForeignKey('hubs.Hub', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_items')
    
    assignment_status = models.CharField(
        max_length=20, 
        choices=ASSIGNMENT_STATUS_CHOICES, 
        default='PENDING'
    )
    ai_decision = models.ForeignKey(
        'ai_engine.AIDecision', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='order_items'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.sku and self.product:
            self.sku = self.product.sku
        if not self.price_at_order and self.product:
            self.price_at_order = self.product.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order.order_id} - {self.product.name} (x{self.quantity})"

class OrderStatusHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50, choices=Order.STATUS_CHOICES)
    notes = models.TextField(blank=True, null=True)
    changed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Order Status Histories"
        ordering = ['created_at']

    def __str__(self):
        return f"{self.order.order_id} changed to {self.status} at {self.created_at}"
