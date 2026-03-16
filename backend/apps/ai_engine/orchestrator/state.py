from typing import TypedDict, List, Optional, Any

class FulfillmentState(TypedDict):
    """
    Represents the state of the Order Fulfillment LangGraph workflow.
    """
    order_id: str
    order_items: List[dict]  # List of serialized OrderItems
    ai_decision_id: Optional[str]
    recommendation: Optional[dict]
    confidence_score: float
    requires_hitl: bool
    execution_status: str
    notifications: List[str]
    current_node: str
    execution_trace: List[dict]
    orchestrator_state: dict  # To store LangGraph's own state if needed for resume
