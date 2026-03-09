from rest_framework import serializers
from .models import Hub, HubSKUMapping

class HubSKUMappingSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    sku_code = serializers.ReadOnlyField(source='product.sku')

    class Meta:
        model = HubSKUMapping
        fields = '__all__'

class HubSerializer(serializers.ModelSerializer):
    sku_count = serializers.SerializerMethodField()
    capacity_utilization = serializers.ReadOnlyField(source='get_capacity_utilization')

    class Meta:
        model = Hub
        fields = '__all__'

    def get_sku_count(self, obj):
        return obj.sku_mappings.count()
