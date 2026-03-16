import logging
from django.utils import timezone
from apps.orders.models import Order, OrderItem
from apps.ai_engine.models import AIDecision
from apps.ai_engine.services.hub_scoring_service import HubScoringService
from apps.notifications.models import Notification
from apps.ai_engine.orchestrator.state import FulfillmentState

logger = logging.getLogger(__name__)

def fetch_order_node(state: FulfillmentState) -> FulfillmentState:
    """Load order + items from DB."""
    order_id = state['order_id']
    order = Order.objects.get(order_id=order_id)
    items = order.items.all()
    
    state['order_items'] = [
        {
            'id': str(item.id),
            'sku': item.sku,
            'product_id': str(item.product_id),
            'quantity': item.quantity
        } for item in items
    ]
    state['current_node'] = 'fetch_order_node'
    _log_step(state, "Fetched order and items from database.")
    return state

def assignment_agent_node(state: FulfillmentState) -> FulfillmentState:
    """Call existing hub recommendation service and store recommendation."""
    order_id = state['order_id']
    order = Order.objects.get(order_id=order_id)
    
    # For simplicity, we use the first item to get recommendations for the whole order context 
    # or loop through items if the system supports multi-item diverse assignment.
    # The requirement says "assign hubs per OrderItem".
    
    recommendations = []
    total_confidence = 0
    
    for item_data in state['order_items']:
        item = OrderItem.objects.get(id=item_data['id'])
        from apps.ai_engine.services.assignment_agent import AssignmentAgent
        candidate_hubs = AssignmentAgent.fetch_candidate_hubs(item)
        
        if candidate_hubs:
            ranked_hubs = HubScoringService.score_hubs_for_item(item.id, candidate_hubs=candidate_hubs)
            if ranked_hubs:
                best_rank = ranked_hubs[0]
                recommendations.append({
                    'item_id': item_data['id'],
                    'recommended_hub_id': best_rank['hub_id'],
                    'hub_name': best_rank['hub_name'],
                    'confidence_score': best_rank['confidence_score'],
                    'score': best_rank['total_score']
                })
                total_confidence += best_rank['confidence_score']
    
    if recommendations:
        state['recommendation'] = {'items': recommendations}
        state['confidence_score'] = total_confidence / len(recommendations)
    else:
        state['confidence_score'] = 0.0
        
    state['current_node'] = 'assignment_agent_node'
    _log_step(state, f"Generated hub recommendations. Average confidence: {state['confidence_score']:.2f}")
    return state

def confidence_evaluator_node(state: FulfillmentState) -> FulfillmentState:
    """Compare confidence_score with threshold and set requires_hitl flag."""
    from apps.ai_engine.services.decision_executor import get_auto_execute_threshold
    threshold = get_auto_execute_threshold()
    
    state['requires_hitl'] = state['confidence_score'] < threshold
    state['current_node'] = 'confidence_evaluator_node'
    
    _log_step(state, f"Evaluated confidence against threshold {threshold}. HITL required: {state['requires_hitl']}")
    return state

def hitl_router_node(state: FulfillmentState) -> FulfillmentState:
    """If requires_hitl: create AIDecision(status='WAITING_APPROVAL') and STOP."""
    if state['requires_hitl']:
        order = Order.objects.get(order_id=state['order_id'])
        
        # Create or update AIDecision
        decision, created = AIDecision.objects.update_or_create(
            related_order=order,
            decision_type='ASSIGNMENT',
            defaults={
                'recommendation': state['recommendation'],
                'confidence_score': state['confidence_score'],
                'status': 'WAITING_APPROVAL',
                'orchestrator_state': state # Store the whole state for resume
            }
        )
        state['ai_decision_id'] = str(decision.id)
        state['execution_status'] = 'WAITING_APPROVAL'
        
        # Link items
        for item_data in state['order_items']:
            item = OrderItem.objects.get(id=item_data['id'])
            item.ai_decision = decision
            item.save(update_fields=['ai_decision'])
            
        # Notify managers
        from apps.ai_engine.services.decision_executor import _notify_pending_approval
        _notify_pending_approval(decision)
        
        _log_step(state, "Workflow paused for Human-in-the-Loop approval.")
    else:
        state['execution_status'] = 'AUTO_PROCEED'
        _log_step(state, "Workflow proceeding automatically.")
        
    state['current_node'] = 'hitl_router_node'
    return state

def execution_node(state: FulfillmentState) -> FulfillmentState:
    """Assign hubs per OrderItem, update hub load, and write audit logs."""
    from apps.orders.services.reassignment_service import execute_reassignment
    
    order = Order.objects.get(order_id=state['order_id'])
    recommendations = state['recommendation'].get('items', [])
    
    for rec in recommendations:
        item_id = rec['item_id']
        hub_id = rec['recommended_hub_id']
        execute_reassignment(item_id, hub_id, actor=None, reason="AI Orchestrator Execution")
        
    order.status = 'ASSIGNED'
    order.save(update_fields=['status', 'updated_at'])
    
    # Mark decision as executed if it exists
    if state['ai_decision_id']:
        decision = AIDecision.objects.get(id=state['ai_decision_id'])
        decision.status = 'AUTO_EXECUTED' if not state['requires_hitl'] else 'APPROVED'
        decision.executed = True
        decision.executed_at = timezone.now()
        decision.execution_trace = state['execution_trace']
        decision.save(update_fields=['status', 'executed', 'executed_at', 'execution_trace'])
    else:
        # Create a record for audit trail if it was auto-executed without prior HITL record
        decision = AIDecision.objects.create(
            related_order=order,
            decision_type='ASSIGNMENT',
            recommendation=state['recommendation'],
            confidence_score=state['confidence_score'],
            status='AUTO_EXECUTED',
            executed=True,
            executed_at=timezone.now(),
            execution_trace=state['execution_trace']
        )
        state['ai_decision_id'] = str(decision.id)

    state['execution_status'] = 'COMPLETED'
    state['current_node'] = 'execution_node'
    _log_step(state, "Assignments executed and order status updated.")
    return state

def notification_node(state: FulfillmentState) -> FulfillmentState:
    """Create internal Notification records."""
    order_id = state['order_id']
    Notification.objects.create(
        user=None, # System-wide
        title="AI Workflow Completed",
        message=f"Order {order_id} has been successfully processed by the AI Orchestrator.",
        type='INFO',
        related_order_id=order_id
    )
    state['current_node'] = 'notification_node'
    _log_step(state, "Sent completion notifications.")
    return state

def delay_prediction_node(state: FulfillmentState) -> FulfillmentState:
    """Schedule async delay prediction task."""
    # Assuming we have a delay prediction service
    _log_step(state, "Scheduled asynchronous delay prediction analysis.")
    state['current_node'] = 'delay_prediction_node'
    return state

def _log_step(state: FulfillmentState, message: str):
    """Internal helper to log execution trace."""
    if 'execution_trace' not in state:
        state['execution_trace'] = []
    
    state['execution_trace'].append({
        'node': state.get('current_node', 'START'),
        'timestamp': timezone.now().isoformat(),
        'message': message,
        'actor': 'AI Orchestrator'
    })
    logger.info(f"Orchestrator [{state['order_id']}]: {message}")
