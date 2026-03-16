"""
Hub Reassignment Execution Service
==================================
Handles the actual fulfillment logic of moving an order item from one hub to another.
Updates capacity, logs history, and sends notifications.
"""

import logging
from django.db import transaction
from django.utils import timezone
from apps.orders.models import OrderItem, OrderStatusHistory
from apps.hubs.models import Hub
from apps.notifications.models import Notification
from apps.users.models import AuditLog

logger = logging.getLogger(__name__)

def execute_reassignment(order_item_id, new_hub_id, actor=None, reason=None):
    """
    Update OrderItem.assigned_hub, recalculate load, and log the action.
    """
    with transaction.atomic():
        # 1. Fetch the item and new hub
        item = OrderItem.objects.select_related('order', 'assigned_hub').get(pk=order_item_id)
        new_hub = Hub.objects.get(pk=new_hub_id)
        old_hub = item.assigned_hub
        order = item.order

        if old_hub == new_hub:
            return item

        # 2. Update item assignment
        item.assigned_hub = new_hub
        item.assignment_status = 'ASSIGNED'
        item.save(update_fields=['assigned_hub', 'assignment_status', 'updated_at'])

        # NOTE: We avoid syncing order.hub directly here to maintain per-item assignment support
        # as requested. Backward compatibility is handled by the Order model definition itself.

        # 3. Recalculate Hub Load (Simplified: item.quantity as load units)
        if old_hub:
            old_hub.current_load = max(0, old_hub.current_load - item.quantity)
            old_hub.save(update_fields=['current_load', 'updated_at'])
            logger.info(f"Hub {old_hub.name} load decreased by {item.quantity}")

        new_hub.current_load += item.quantity
        new_hub.save(update_fields=['current_load', 'updated_at'])
        logger.info(f"Hub {new_hub.name} load increased by {item.quantity}")

        # 4. Update Order Status History
        msg = f"Item {item.sku} reassigned from {old_hub.name if old_hub else 'None'} to {new_hub.name}."
        if reason:
            msg += f" Reason: {reason}"
            
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=msg,
            changed_by=actor
        )

        # 4.5 Check if all items in the order are assigned, if so, update order status to ASSIGNED
        unassigned_items_count = order.items.filter(assignment_status='PENDING').count() + order.items.filter(assigned_hub__isnull=True).count()
        if unassigned_items_count == 0 and order.status == 'ORDERED':
            order.status = 'ASSIGNED'
            order.save(update_fields=['status', 'updated_at'])
            OrderStatusHistory.objects.create(
                order=order,
                status='ASSIGNED',
                notes="All items in the order have been assigned to hubs.",
                changed_by=actor
            )

        # 5. Create Audit Log
        AuditLog.objects.create(
            user=actor,
            action="ITEM_HUB_REASSIGNMENT",
            module="Orders",
            new_value=f"Item {item.id} -> Hub {new_hub.name}"
        )

        # 6. Trigger Notification for Hub Managers (or system alerts)
        Notification.objects.create(
            user=None,
            title="Hub Reassignment Alert",
            message=f"Order {order.order_id} Item {item.sku} has been moved to {new_hub.name}.",
            type='INFO',
            related_order_id=order.order_id
        )

        return item
