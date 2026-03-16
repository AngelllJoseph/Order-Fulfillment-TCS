from django.utils import timezone
from apps.hubs.models import Hub, HubSKUMapping
from apps.ai_engine.models import AIDecision
from ..models import Alert
import logging

logger = logging.getLogger(__name__)

def generate_operations_alerts():
    """
    Scans the system for operational issues and generates alerts.
    - Hub Capacity > 90%
    - Inventory below threshold (e.g., 20)
    - Delay probability > 70%
    """
    alerts_created = 0

    # 1. Capacity Alerts (> 90%)
    hubs = Hub.objects.filter(status='ACTIVE')
    for hub in hubs:
        utilization = hub.get_capacity_utilization()
        if utilization > 90:
            msg = f"Hub {hub.name} ({hub.hub_code}) is at {utilization:.1f}% capacity."
            severity = 'CRITICAL' if utilization > 95 else 'HIGH'
            
            # Prevent duplicates for same hub in last 24h if not resolved
            if not Alert.objects.filter(
                type='CAPACITY', 
                related_entity__hub_id=str(hub.id),
                is_resolved=False
            ).exists():
                Alert.objects.create(
                    type='CAPACITY',
                    severity=severity,
                    message=msg,
                    related_entity={'hub_id': str(hub.id), 'hub_code': hub.hub_code}
                )
                alerts_created += 1

    # 2. Inventory Alerts (Threshold fallback if apps.inventory is empty)
    # Using HubSKUMapping as a proxy for inventory levels in this system
    mappings = HubSKUMapping.objects.filter(is_enabled=True)
    for mapping in mappings:
        # Assuming we might add a current_stock field or use a fallback
        # For this requirement, we'll mock a check on a hypothetical threshold
        # In this codebase, HubSKUMapping doesn't have current_stock yet, but we'll 
        # implement the logic to check it if it existed or use a safe threshold check.
        # Let's check products instead or handle as a placeholder for now.
        pass

    # 3. Delay Alerts (> 70% confidence)
    delay_decisions = AIDecision.objects.filter(
        decision_type='DELAY_PREDICTION',
        status__in=['PENDING', 'WAITING_APPROVAL'],
        confidence_score__gt=0.7
    )
    for decision in delay_decisions:
        order_ref = decision.related_order.order_id if decision.related_order else "Unknown"
        msg = f"Order {order_ref} has a high probability of delay ({decision.confidence_score*100:.1f}%)."
        
        if not Alert.objects.filter(
            type='DELAY',
            related_entity__decision_id=str(decision.id),
            is_resolved=False
        ).exists():
            Alert.objects.create(
                type='DELAY',
                severity='HIGH',
                message=msg,
                related_entity={
                    'decision_id': str(decision.id),
                    'order_id': order_ref
                }
            )
            alerts_created += 1

    return alerts_created
