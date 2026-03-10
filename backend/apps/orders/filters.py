from django_filters import rest_framework as filters
from .models import Order

class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    pass

class OrderFilter(filters.FilterSet):
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr='lte')
    sku = filters.CharFilter(field_name="sku", lookup_expr='icontains')
    unassigned = filters.BooleanFilter(field_name='hub', lookup_expr='isnull')
    status__in = CharInFilter(field_name='status', lookup_expr='in')
    
    class Meta:
        model = Order
        fields = ['status', 'hub', 'priority', 'product', 'unassigned']
