from rest_framework import serializers
from .models import AIDecision, AIApproval


class AIDecisionSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='related_order.order_id', read_only=True)
    product_name = serializers.CharField(source='related_order.product.name', read_only=True)

    class Meta:
        model = AIDecision
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'order_id', 'product_name')


class AIApprovalSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.first_name', read_only=True)

    class Meta:
        model = AIApproval
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'actor_name')

