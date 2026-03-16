from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, OrderStatusHistory
from apps.users.models import User, AccessLog
from apps.hubs.models import Hub

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Basic Stats
        total_orders = Order.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        operating_hubs = Hub.objects.filter(status='ACTIVE').count()
        security_alerts = AccessLog.objects.filter(login_status='FAILED').count()

        # 2. Daily Orders (Last 7 Days)
        today = timezone.now().date()
        date_7_days_ago = today - timedelta(days=6)
        
        daily_counts = (
            Order.objects.filter(created_at__date__gte=date_7_days_ago)
            .values('created_at__date')
            .annotate(count=Count('id'))
            .order_by('created_at__date')
        )
        
        # Fill in gaps with zero counts
        daily_data = []
        counts_dict = {item['created_at__date']: item['count'] for item in daily_counts}
        for i in range(7):
            date = date_7_days_ago + timedelta(days=i)
            daily_data.append({
                "date": date.strftime('%b %d'),
                "orders": counts_dict.get(date, 0)
            })

        # 3. Status Distribution
        status_counts = (
            Order.objects.values('status')
            .annotate(count=Count('id'))
        )
        # Format for Pie Chart: { name: 'Status', value: count }
        status_map = dict(Order.STATUS_CHOICES)
        status_data = [
            {"name": status_map.get(item['status'], item['status']), "value": item['count']}
            for item in status_counts
        ]

        # 4. Hub Workload
        hub_counts = (
            Order.objects.filter(hub__isnull=False)
            .values('hub__name')
            .annotate(count=Count('id'))
            .order_by('-count')[:5] # Top 5 hubs
        )
        hub_data = [
            {"name": item['hub__name'], "orders": item['count']}
            for item in hub_counts
        ]

        stats = {
            "total_orders": total_orders,
            "active_users": active_users,
            "operating_hubs": operating_hubs,
            "security_alerts": security_alerts,
            "trends": {
                "orders": "+12%",
                "users": "+5.2%",
                "hubs": "Stable",
                "alerts": "High Priority"
            },
            "daily_orders": daily_data,
            "status_distribution": status_data,
            "hub_workload": hub_data
        }
        return Response(stats)

class ProductionOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        
        # 1. KPIs
        kpis = {
            "totalOrders": Order.objects.exclude(status__in=['COMPLETED', 'CANCELLED']).count(),
            "inProduction": Order.objects.filter(status='MANUFACTURING').count(),
            "completedToday": Order.objects.filter(status='COMPLETED', updated_at__date=today).count(),
            "delayedOrders": Order.objects.filter(expected_delivery_date__lt=today).exclude(status='COMPLETED').count(),
            "activeHubs": Hub.objects.filter(status='ACTIVE').count()
        }

        # 2. Orders by Hub (Bar Chart)
        hub_counts = (
            Order.objects.filter(hub__isnull=False)
            .values('hub__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        ordersByHub = [
            {"hubId": item['hub__name'], "count": item['count']}
            for item in hub_counts
        ]

        # 3. Stage Distribution (Pie Chart)
        status_map = dict(Order.STATUS_CHOICES)
        stage_counts = (
            Order.objects.values('status')
            .annotate(count=Count('id'))
        )
        stageDistribution = [
            {"stage": status_map.get(item['status'], item['status']), "count": item['count']}
            for item in stage_counts
        ]

        # 4. Recent Production Activity (Last 5 updates)
        recent_history = (
            OrderStatusHistory.objects.select_related('order', 'order__hub')
            .order_by('-created_at')[:5]
        )
        recentUpdates = [
            {
                "orderId": item.order.order_id,
                "hubId": item.order.hub.name if item.order.hub else "Unassigned",
                "productionStage": status_map.get(item.status, item.status),
                "updatedAt": item.created_at.isoformat()
            }
            for item in recent_history
        ]

        return Response({
            "kpis": kpis,
            "ordersByHub": ordersByHub,
            "stageDistribution": stageDistribution,
            "recentUpdates": recentUpdates
        })
