from rest_framework import serializers
from .models import Order, OrderStatusHistory
from apps.products.serializers import ProductSerializer
from apps.hubs.serializers import HubSerializer

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.ReadOnlyField(source='changed_by.get_full_name')

    class Meta:
        model = OrderStatusHistory
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    hub_details = HubSerializer(source='hub', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'

class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            'product', 'quantity', 'customer_name', 'customer_phone', 'customer_email',
            'shipping_address', 'priority', 'expected_delivery_date'
        ]

    def create(self, validated_data):
        # Additional logic can be added here if needed (e.g., auto-assignment)
        return super().create(validated_data)
