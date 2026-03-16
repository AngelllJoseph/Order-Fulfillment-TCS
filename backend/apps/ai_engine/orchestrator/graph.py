from langgraph.graph import StateGraph, START, END
from apps.ai_engine.orchestrator.state import FulfillmentState
from apps.ai_engine.orchestrator.nodes import (
    fetch_order_node,
    assignment_agent_node,
    confidence_evaluator_node,
    hitl_router_node,
    execution_node,
    notification_node,
    delay_prediction_node
)

def create_fulfillment_graph():
    """
    Builds the LangGraph workflow for Order Fulfillment.
    """
    workflow = StateGraph(FulfillmentState)

    # Add Nodes
    workflow.add_node("fetch_order", fetch_order_node)
    workflow.add_node("assignment_agent", assignment_agent_node)
    workflow.add_node("confidence_evaluator", confidence_evaluator_node)
    workflow.add_node("hitl_router", hitl_router_node)
    workflow.add_node("execution", execution_node)
    workflow.add_node("notification", notification_node)
    workflow.add_node("delay_prediction", delay_prediction_node)

    # Define Edges
    workflow.add_edge(START, "fetch_order")
    workflow.add_edge("fetch_order", "assignment_agent")
    workflow.add_edge("assignment_agent", "confidence_evaluator")
    workflow.add_edge("confidence_evaluator", "hitl_router")

    # Conditional Routing
    def route_hitl(state: FulfillmentState):
        if state['requires_hitl']:
            return "end"
        return "execution"

    workflow.add_conditional_edges(
        "hitl_router",
        route_hitl,
        {
            "end": END,
            "execution": "execution"
        }
    )

    workflow.add_edge("execution", "notification")
    workflow.add_edge("notification", "delay_prediction")
    workflow.add_edge("delay_prediction", END)

    return workflow.compile()
