from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.orders.models import Order
from apps.users.models import User, AccessLog
from apps.hubs.models import Hub

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = {
            "total_orders": Order.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "operating_hubs": Hub.objects.filter(status='ACTIVE').count(),
            "security_alerts": AccessLog.objects.filter(login_status='FAILED').count(),
            # Add trend data (dummy for now but could be calculated)
            "trends": {
                "orders": "+12%",
                "users": "+5.2%",
                "hubs": "Stable",
                "alerts": "High Priority"
            }
        }
        return Response(stats)
