import logging
from celery import shared_task
from apps.ai_engine.orchestrator.executor import run_fulfillment_workflow, resume_fulfillment_workflow

logger = logging.getLogger(__name__)

@shared_task(queue='ai_assignment')
def run_langgraph_workflow_task(order_id: str):
    """
    Celery task to run the LangGraph orchestrator for an order.
    """
    try:
        logger.info(f"Starting Celery task run_langgraph_workflow_task for Order: {order_id}")
        run_fulfillment_workflow(order_id)
    except Exception as e:
        logger.error(f"Error in run_langgraph_workflow_task for Order {order_id}: {str(e)}", exc_info=True)
        # In a production environment, we might want to retry here
        raise

@shared_task(queue='ai_execution')
def resume_langgraph_workflow_task(decision_id: str):
    """
    Celery task to resume a paused LangGraph workflow.
    """
    try:
        logger.info(f"Starting Celery task resume_langgraph_workflow_task for Decision: {decision_id}")
        resume_fulfillment_workflow(decision_id)
    except Exception as e:
        logger.error(f"Error in resume_langgraph_workflow_task for Decision {decision_id}: {str(e)}", exc_info=True)
        raise
