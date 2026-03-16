from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory
from apps.products.serializers import ProductSerializer
from apps.hubs.serializers import HubSerializer

class SimpleOrderSerializer(serializers.ModelSerializer):
    # Just the fields we need to resolve order context in the timeline Without recursion
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'status', 'customer_name', 'customer_email', 'product']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_sku = serializers.ReadOnlyField(source='product.sku')

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'quantity', 
            'price_at_order', 'assigned_hub', 'assignment_status', 'ai_decision'
        ]

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.ReadOnlyField(source='changed_by.get_full_name')
    # Use full nested simple serializer instead of just IDs so front-end has the data.
    order = SimpleOrderSerializer(read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    hub_details = HubSerializer(source='hub', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    ai_recommendation = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'

    def get_ai_recommendation(self, obj):
        if obj.hub:
            return None # Already assigned
        
        from apps.hubs.models import Hub, HubSKUMapping
        
        active_hubs = self.context.get('active_hubs')
        if active_hubs is None:
            active_hubs = Hub.objects.filter(status='ACTIVE', auto_assignment_enabled=True)
            if not active_hubs.exists():
                return None
            
        # Check if there are any SKU mappings defined overall
        has_mappings = HubSKUMapping.objects.filter(is_enabled=True).exists()
        
        eligible_hubs = []
        for hub in active_hubs:
            # Capacity check
            if hub.max_daily_capacity > 0 and hub.current_load + obj.quantity > hub.max_daily_capacity:
                continue
                
            # SKU Support Check
            supported_skus_str = hub.supported_skus or ""
            supported_skus_list = [s.strip().lower() for s in supported_skus_str.split(',') if s.strip()]
            
            order_sku = (obj.sku or "").strip().lower()
            
            # If the hub has specified supported SKUs, the order must match one.
            # If the hub has NO supported_skus specified, we assume it supports everything
            if supported_skus_list and order_sku not in supported_skus_list:
                # Also fallback to product_id if sku isn't a direct match
                if obj.product:
                    product_id = (obj.product.product_id or "").strip().lower()
                    if product_id not in supported_skus_list:
                        continue
                else:
                    continue
                    
            eligible_hubs.append(hub)
            
        if not eligible_hubs:
            return None
            
        best_hub = None
        highest_score = -1
        best_reason = ""
        best_confidence = 0
        
        shipping_text = (obj.shipping_address or "").lower()
        
        for hub in eligible_hubs:
            score = 0
            reason = []
            
            hub_loc = (hub.location or "").lower()
            if hub_loc and hub_loc in shipping_text:
                score += 50
                reason.append("closest to shipping address")
            
            if hub.max_daily_capacity > 0:
                available_pct = 100 - ((hub.current_load / hub.max_daily_capacity) * 100)
                score += available_pct * 0.4
                if available_pct > 50:
                    reason.append("high available capacity")
                else:
                    reason.append("sufficient capacity")
            else:
                score += 20
                reason.append("available capacity")

            score += (hub.priority_level * 2)
            
            if score > highest_score:
                highest_score = score
                best_hub = hub
                
                if "closest" in str(reason) and "capacity" in str(reason):
                    best_reason = "Lowest current load & closest to shipping address."
                elif reason:
                    best_reason = " and ".join(reason).capitalize() + "."
                else:
                    best_reason = "Best available hub based on system load."
                    
                best_confidence = min(99, max(50, int(score)))

        if best_hub:
             return {
                 "hub_id": best_hub.id,
                 "hub_name": best_hub.name,
                 "confidence": best_confidence,
                 "reason": best_reason
             }
        
        return None

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            'items', 'customer_name', 'customer_phone', 'customer_email',
            'shipping_address', 'priority', 'expected_delivery_date'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Pull first item info for legacy compatibility
        if items_data:
            first_item = items_data[0]
            validated_data['product'] = first_item['product']
            validated_data['quantity'] = first_item['quantity']
            validated_data['sku'] = first_item['product'].sku

        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            
        return order
