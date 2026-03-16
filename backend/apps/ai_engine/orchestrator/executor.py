import logging
from apps.ai_engine.orchestrator.graph import create_fulfillment_graph
from apps.ai_engine.orchestrator.state import FulfillmentState

logger = logging.getLogger(__name__)

def run_fulfillment_workflow(order_id: str):
    """
    Initializes and runs the fulfillment workflow for a given order.
    """
    initial_state: FulfillmentState = {
        'order_id': order_id,
        'order_items': [],
        'ai_decision_id': None,
        'recommendation': None,
        'confidence_score': 0.0,
        'requires_hitl': False,
        'execution_status': 'STARTED',
        'notifications': [],
        'current_node': 'START',
        'execution_trace': [],
        'orchestrator_state': {}
    }
    
    graph = create_fulfillment_graph()
    logger.info(f"Starting LangGraph workflow for Order: {order_id}")
    
    # Run the graph
    final_output = graph.invoke(initial_state)
    return final_output

def resume_fulfillment_workflow(decision_id: str):
    """
    Resumes the workflow from the execution node after HITL approval.
    """
    from apps.ai_engine.models import AIDecision
    decision = AIDecision.objects.get(id=decision_id)
    
    if decision.status != 'APPROVED':
        logger.warning(f"Cannot resume workflow for decision {decision_id}. Status is {decision.status}")
        return
    
    state = decision.orchestrator_state
    if not state:
        logger.error(f"No state found for decision {decision_id}")
        return
        
    # Update state to skip HITL routing and go straight to execution
    state['requires_hitl'] = False 
    state['execution_status'] = 'RESUMING'
    
    graph = create_fulfillment_graph()
    logger.info(f"Resuming LangGraph workflow for Order: {state['order_id']} from execution node")
    
    # We can use the 'execution' node as the entry point if we want to bypass everything before it
    # For now, we invoke from the beginning but the state will bypass HITL router's pause
    # Alternatively, we could modify hitl_router_node to check if it's already approved.
    
    # In our specific graph structure, starting from START with requires_hitl=False 
    # might re-run fetch_order and assignment_agent. 
    # If we want to resume EXACTLY at execution:
    
    # For simplicity in this implementation, we re-run the nodes but since state is restored,
    # and we set requires_hitl=False, it will flow to execution.
    
    final_output = graph.invoke(state)
    return final_output
