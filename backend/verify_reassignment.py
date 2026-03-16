import os
import django
import sys

# Setup Django env
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.orders.models import Order, OrderItem, OrderStatusHistory
from apps.hubs.models import Hub
from apps.users.models import User, AuditLog
from apps.notifications.models import Notification
from apps.orders.services.reassignment_service import execute_reassignment

def verify():
    # Setup test data
    hubs = list(Hub.objects.filter(status='ACTIVE')[:2])
    if len(hubs) < 2:
        print("Need at least 2 active hubs to test.")
        return

    hub_a = hubs[0]
    hub_b = hubs[1]
    
    order = Order.objects.first()
    if not order:
        print("Need at least 1 order.")
        return
        
    if not order.items.exists():
        print("Order has no items to reassign.")
        return
        
    item = order.items.first()
    
    # Pre-condition: Assign to Hub A
    item.assigned_hub = hub_a
    item.quantity = 10
    item.save()
    
    hub_a.current_load = 50
    hub_a.save()
    
    hub_b.current_load = 30
    hub_b.save()

    print(f"Pre-reassignment: Item {item.id} -> Hub A ({hub_a.name})")
    print(f"Hub A load: {hub_a.current_load}, Hub B load: {hub_b.current_load}")

    actor = User.objects.first()

    # Execute reassignment
    execute_reassignment(item.id, hub_b.id, actor=actor, reason="Manual Verify")

    # Post-condition asserts
    item.refresh_from_db()
    hub_a.refresh_from_db()
    hub_b.refresh_from_db()

    print(f"\nPost-reassignment: Item assigned -> {item.assigned_hub.name}")
    print(f"Hub A load: {hub_a.current_load}, Hub B load: {hub_b.current_load}")

    assert item.assigned_hub == hub_b, "Item was not reassigned to Hub B"
    assert hub_a.current_load == 40, "Hub A load did not decrease correctly"
    assert hub_b.current_load == 40, "Hub B load did not increase correctly"

    # Verify logging
    history = OrderStatusHistory.objects.filter(order=order).last()
    assert history and "Manual Verify" in history.notes, "OrderStatusHistory not created correctly"

    audit = AuditLog.objects.filter(action="ITEM_HUB_REASSIGNMENT").last()
    assert audit and str(item.id) in audit.new_value, "AuditLog not created correctly"

    notif = Notification.objects.filter(title="Hub Reassignment Alert", related_order_id=order.order_id).last()
    assert notif and hub_b.name in notif.message, "Notification not created correctly"

    print("\n✅ Verification SUCCESS! Item assignment, capacity, and logs behave as expected.")

if __name__ == "__main__":
    verify()
