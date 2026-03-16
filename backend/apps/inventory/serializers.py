from rest_framework import serializers
from .models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    hub_name = serializers.CharField(source='hub.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'hub', 'hub_name', 'product', 'product_name', 'sku',
            'quantity_available', 'quantity_reserved', 'free_stock', 'last_updated'
        ]


class StockUpdateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    hub_id = serializers.UUIDField()
    quantity_change = serializers.IntegerField()

    def validate_quantity_change(self, value):
        if value == 0:
            raise serializers.ValidationError("quantity_change cannot be zero.")
        return value
