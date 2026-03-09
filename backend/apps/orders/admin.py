from django.contrib import admin
from .models import Order, OrderStatusHistory

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'product', 'customer_name', 'customer_email', 'status', 'created_at')
    search_fields = ('order_id', 'customer_name', 'customer_email', 'sku', 'customer_phone')
    list_filter = ('status', 'priority', 'hub')

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('order', 'status', 'changed_by', 'created_at')
