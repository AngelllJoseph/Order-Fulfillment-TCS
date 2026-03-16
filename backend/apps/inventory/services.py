from django.db import transaction
from django.db.models import F
from .models import Inventory
from apps.orders.models import OrderItem


def update_stock(hub_id, product_id, quantity_change):
    """
    Atomically update quantity_available for a given hub and product.
    If the inventory record doesn't exist, it creates one.
    """
    with transaction.atomic():
        inventory, created = Inventory.objects.get_or_create(
            hub_id=hub_id,
            product_id=product_id,
            defaults={'quantity_available': 0, 'quantity_reserved': 0}
        )
        
        # Use F() expression for atomic update
        Inventory.objects.filter(pk=inventory.pk).update(
            quantity_available=F('quantity_available') + quantity_change
        )
        
        # Refresh from DB to get the latest value if needed by caller
        inventory.refresh_from_db()
        return inventory


def get_free_stock(hub_id, product_id):
    """
    Return the free_stock (available - reserved) for a given hub and product.
    Returns 0 if no inventory record exists.
    """
    try:
        inventory = Inventory.objects.get(hub_id=hub_id, product_id=product_id)
        return inventory.free_stock
    except Inventory.DoesNotExist:
        return 0


def reserve_inventory(order_item_id, hub_id):
    """
    Reserve inventory for a specific order item at a given hub.
    - Check free_stock
    - Increase quantity_reserved
    - Prevent negative stock
    - Transaction atomic
    """
    with transaction.atomic():
        # Lock both order item and inventory to prevent race conditions
        try:
            order_item = OrderItem.objects.select_for_update().get(id=order_item_id)
        except OrderItem.DoesNotExist:
            raise ValueError(f"OrderItem with id {order_item_id} does not exist.")

        inventory, created = Inventory.objects.select_for_update().get_or_create(
            hub_id=hub_id,
            product_id=order_item.product_id,
            defaults={'quantity_available': 0, 'quantity_reserved': 0}
        )

        if inventory.free_stock < order_item.quantity:
            raise ValueError(
                f"Insufficient stock for product {order_item.product.name} at hub {hub_id}. "
                f"Required: {order_item.quantity}, Available: {inventory.free_stock}"
            )

        # Increment reserved quantity
        inventory.quantity_reserved = F('quantity_reserved') + order_item.quantity
        inventory.save()
        
        inventory.refresh_from_db()
        return inventory
