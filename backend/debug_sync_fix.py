
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fulfillment_system.settings')
django.setup()

from apps.orders.models import Order, OrderItem
from apps.hubs.models import Hub
from apps.orders.services.reassignment_service import execute_reassignment

def debug_sync():
    # 1. Get a test order and its hub
    item = OrderItem.objects.first()
    if not item:
        print("No items found.")
        return
        
    order = item.order
    old_hub = order.hub
    print(f"Initial State: Order {order.order_id}, Order.hub: {old_hub}, Item.assigned_hub: {item.assigned_hub}")
    
    # 2. Pick a new hub
    new_hub = Hub.objects.exclude(id=old_hub.id if old_hub else None).first()
    if not new_hub:
        print("No other hub found for reassignment.")
        return
    
    print(f"Reassigning to {new_hub.name}...")
    
    # 3. Execute reassignment
    execute_reassignment(item.id, new_hub.id, reason="Debug Sync Fix")
    
    # 4. Reload and verify
    item.refresh_from_db()
    order.refresh_from_db()
    
    print(f"Post-reassignment: Order.hub: {order.hub}, Item.assigned_hub: {item.assigned_hub}")
    
    if order.hub == new_hub and item.assigned_hub == new_hub:
        print("SUCCESS: Order and Item hubs are synchronized!")
    else:
        print("FAILURE: Sync mismatch detected.")

if __name__ == "__main__":
    debug_sync()
