import logging
from typing import List
from django.db import transaction
from apps.orders.models import OrderItem
from apps.hubs.models import Hub
from apps.ai_engine.models import AIDecision
from apps.ai_engine.services.hub_scoring_service import HubScoringService
# from apps.ai_engine.services import decision_executor # moved to local import

logger = logging.getLogger(__name__)

class AssignmentAgent:
    """
    AI Agent that orchestrates hub assignment for OrderItems.
    """

    @classmethod
    def run_assignment_cycle(cls):
        """
        Process all PENDING OrderItems and generate AI assignment decisions.
        """
        pending_items = OrderItem.objects.filter(assignment_status='PENDING')
        logger.info(f"AI Assignment Agent: Found {pending_items.count()} pending items.")

        for item in pending_items:
            try:
                cls.process_item(item)
            except Exception as e:
                logger.error(f"Error processing item {item.id}: {str(e)}")

    @classmethod
    def process_item(cls, item: OrderItem):
        """
        Handles the end-to-end assignment logic for a single OrderItem.
        """
        with transaction.atomic():
            # 1. Fetch Candidate Hubs
            candidate_hubs = cls.fetch_candidate_hubs(item)
            if not candidate_hubs:
                logger.warning(f"No active hubs found for item {item.id}")
                return

            # 2. Compute Scores & Select Best Hub
            ranked_hubs = HubScoringService.score_hubs_for_item(item.id, candidate_hubs=candidate_hubs)
            if not ranked_hubs:
                logger.warning(f"No suitable hub found for item {item.id}")
                return

            best_rank = ranked_hubs[0]
            confidence_score = best_rank['confidence_score']
            
            # 3. Create AIDecision record
            recommendation = {
                'recommended_hub_id': best_rank['hub_id'],
                'hub_name': best_rank['hub_name'],
                'hub_code': best_rank['hub_code'],
                'score': best_rank['total_score'],
                'all_candidates': ranked_hubs[:3], # Store top 3 for context
                'reasoning_text': f"Selected {best_rank['hub_name']} with confidence {confidence_score} based on distance, capacity, and inventory."
            }

            decision = AIDecision.objects.create(
                decision_type='ASSIGNMENT',
                related_order=item.order,
                related_item=item,
                recommendation=recommendation,
                confidence_score=confidence_score,
                status='PENDING'
            )

            # Link item to decision
            item.ai_decision = decision
            item.save(update_fields=['ai_decision'])

            # 4. Route to Decision Executor
            from apps.ai_engine.services import decision_executor
            decision_executor.process_decision(decision)

    @staticmethod
    def fetch_candidate_hubs(item: OrderItem) -> List[Hub]:
        """
        Fetch candidate hubs that are ACTIVE and support the product SKU.
        """
        from apps.hubs.models import HubSKUMapping
        
        # Get hubs that have an enabled mapping for this product
        hub_ids_with_mapping = HubSKUMapping.objects.filter(
            product=item.product,
            is_enabled=True
        ).values_list('hub_id', flat=True)
        
        # Filter active hubs that are in the mapping list
        return list(Hub.objects.filter(
            status='ACTIVE',
            id__in=hub_ids_with_mapping
        ).distinct())
