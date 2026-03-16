from django.contrib import admin
from .models import AIDecision, AIApproval


@admin.register(AIDecision)
class AIDecisionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'decision_type', 'related_order', 'confidence_score', 'status', 'executed', 'created_at',
    )
    list_filter = ('decision_type', 'status', 'executed')
    search_fields = ('id', 'related_order__order_id')
    readonly_fields = ('id', 'created_at', 'executed_at')


@admin.register(AIApproval)
class AIApprovalAdmin(admin.ModelAdmin):
    list_display = ('id', 'decision', 'actor', 'status_changed_to', 'created_at')
    list_filter = ('status_changed_to',)
    search_fields = ('id', 'decision__id')
    readonly_fields = ('id', 'created_at')

