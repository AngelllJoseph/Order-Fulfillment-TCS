import uuid
from django.db import models


class Inventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hub = models.ForeignKey(
        'hubs.Hub',
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='inventory_items'
    )
    quantity_available = models.IntegerField(default=0)
    quantity_reserved = models.IntegerField(default=0)
    reorder_threshold = models.IntegerField(default=10)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Inventory"
        verbose_name_plural = "Inventories"
        unique_together = ('hub', 'product')
        indexes = [
            models.Index(fields=['hub', 'product']),
        ]

    @property
    def free_stock(self):
        return self.quantity_available - self.quantity_reserved

    def __str__(self):
        return f"{self.product.name} at {self.hub.name} ({self.free_stock} free)"
