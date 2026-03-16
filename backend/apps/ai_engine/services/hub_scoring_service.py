import uuid
from typing import List, Dict, Any
from django.db.models import Q
from apps.hubs.models import Hub, HubSKUMapping
from apps.inventory.models import Inventory
from apps.orders.models import OrderItem

class HubScoringService:
    """
    Service to score and rank hubs for a given OrderItem.
    """

    # Default Weights
    W_DISTANCE = 0.30
    W_CAPACITY = 0.25
    W_INVENTORY = 0.25
    W_SKU_SUPPORT = 0.20

    @classmethod
    def score_hubs_for_item(cls, order_item_id: uuid.UUID, candidate_hubs: List[Hub] = None) -> List[Dict[str, Any]]:
        """
        Calculates scores for candidate hubs and returns a ranked list.
        If candidate_hubs is not provided, it fetches all ACTIVE hubs.
        """
        try:
            item = OrderItem.objects.select_related('order', 'product').get(id=order_item_id)
        except OrderItem.DoesNotExist:
            raise ValueError(f"OrderItem with id {order_item_id} does not exist.")

        if candidate_hubs is None:
            candidate_hubs = Hub.objects.filter(status='ACTIVE')
            
        scored_hubs = []

        for hub in candidate_hubs:
            scores = cls._calculate_individual_scores(hub, item)
            
            # Weighted combined score
            total_score = (
                scores['distance_score'] * cls.W_DISTANCE +
                scores['capacity_score'] * cls.W_CAPACITY +
                scores['inventory_score'] * cls.W_INVENTORY +
                scores['sku_support_score'] * cls.W_SKU_SUPPORT
            )

            scored_hubs.append({
                'hub_id': str(hub.id),
                'hub_name': hub.name,
                'hub_code': hub.hub_code,
                'total_score': round(total_score, 4),
                'individual_scores': scores,
                'confidence_score': round(total_score, 4) # Simplified confidence mapping
            })

        # Rank by total score descending
        ranked_hubs = sorted(scored_hubs, key=lambda x: x['total_score'], reverse=True)
        return ranked_hubs

    @classmethod
    def _calculate_individual_scores(cls, hub: Hub, item: OrderItem) -> Dict[str, float]:
        """
        Calculates individual component scores (0.0 to 1.0).
        """
        return {
            'distance_score': cls._calculate_distance_score(hub, item),
            'capacity_score': cls._calculate_capacity_score(hub),
            'inventory_score': cls._calculate_inventory_score(hub, item),
            'sku_support_score': cls._calculate_sku_support_score(hub, item)
        }

    @staticmethod
    def _calculate_distance_score(hub: Hub, item: OrderItem) -> float:
        """
        Calculates distance score. 
        Current implementation: String matching on shipping address vs hub location.
        1.0 if match found, 0.5 if partial, 0.2 otherwise.
        """
        address = (item.order.shipping_address or "").lower()
        location = (hub.location or "").lower()
        
        if not location:
            return 0.2
            
        if location in address:
            return 1.0
        
        # Check if any words match (simple proximity heuristic)
        loc_words = set(location.replace(',', ' ').split())
        addr_words = set(address.replace(',', ' ').split())
        common = loc_words.intersection(addr_words)
        
        if common:
            return 0.6
            
        return 0.2

    @staticmethod
    def _calculate_capacity_score(hub: Hub) -> float:
        """
        Calculates capacity score: (1 - utilization).
        """
        if hub.max_daily_capacity <= 0:
            return 0.0
        
        utilization = hub.current_load / hub.max_daily_capacity
        return max(0.0, 1.0 - utilization)

    @staticmethod
    def _calculate_inventory_score(hub: Hub, item: OrderItem) -> float:
        """
        Calculates inventory score based on free stock.
        1.0 if free_stock >= quantity, 0.0 otherwise.
        """
        inventory = Inventory.objects.filter(hub=hub, product=item.product).first()
        if not inventory:
            return 0.0
            
        if inventory.free_stock >= item.quantity:
            return 1.0
        
        # Partial score if some stock is available
        if inventory.free_stock > 0:
            return (inventory.free_stock / item.quantity) * 0.5
            
        return 0.0

    @staticmethod
    def _calculate_sku_support_score(hub: Hub, item: OrderItem) -> float:
        """
        Calculates SKU support score based on HubSKUMapping.
        Uses priority if available.
        """
        mapping = HubSKUMapping.objects.filter(hub=hub, product=item.product, is_enabled=True).first()
        if mapping:
            # Priority is 1-10, normalize to 0.5-1.0
            priority = mapping.priority or 1
            return 0.5 + (priority / 10.0) * 0.5
            
        # Fallback to supported_skus legacy field
        sku_to_match = (item.sku or "").strip().lower()
        supported = [s.strip().lower() for s in (hub.supported_skus or "").split(",") if s.strip()]
        if sku_to_match in supported:
            return 0.5
            
        return 0.0
