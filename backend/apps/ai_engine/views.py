from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import AIDecision, AIApproval
from .serializers import AIDecisionSerializer, AIApprovalSerializer
from apps.ai_engine.services import hitl_service


class AIDecisionViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for AI Decisions.
    GET    /api/ai/decisions/              — list all decisions
    HITL endpoints:
    POST   /api/ai/decisions/recommend/      — trigger recommendation for one order
    POST   /api/ai/decisions/bulk-recommend/ — trigger for all unassigned orders
    POST   /api/ai/decisions/{id}/approve/   — approve a pending assignment
    POST   /api/ai/decisions/{id}/reject/    — reject a pending assignment
    """

    queryset = AIDecision.objects.select_related("related_order").all()
    serializer_class = AIDecisionSerializer
    permission_classes = [IsAuthenticated]

    # ----------------------------------------------------------------------
    # Recommend (Trigger AI Logic)
    # ----------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="recommend")
    def recommend(self, request):
        """
        Trigger the AI assignment logic for a specific order.
        Body: { "order_id": "<uuid>" }
        """
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"detail": "order_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from apps.ai_engine.services.assignment_service import recommend_hub_for_order
        try:
            recommendation = recommend_hub_for_order(order_id)
            return Response(recommendation, status=status.HTTP_200_OK)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({"detail": f"Internal Error: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ----------------------------------------------------------------------
    # Bulk Recommend
    # ----------------------------------------------------------------------
    @action(detail=False, methods=["post"], url_path="bulk-recommend")
    def bulk_recommend(self, request):
        """
        Trigger AI assignment logic for ALL unassigned orders that
        don't already have an active AI decision.
        """
        from apps.orders.models import Order
        from apps.ai_engine.services.assignment_service import recommend_hub_for_order

        unassigned_orders = Order.objects.filter(hub__isnull=True).exclude(
            ai_decisions__status__in=['WAITING_APPROVAL', 'PENDING']
        ).distinct()

        results = []
        for order in unassigned_orders:
            try:
                rec = recommend_hub_for_order(str(order.id))
                results.append({"order_id": order.order_id, "status": "success", "decision_id": rec.get('id')})
            except Exception as e:
                results.append({"order_id": order.order_id, "status": "failed", "error": str(e)})

        return Response({
            "processed_count": len(unassigned_orders),
            "results": results
        }, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Approve
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        Approve a WAITING_APPROVAL AI decision.

        Assigns the recommended hub to the order, updates order status to
        ASSIGNED, marks the decision APPROVED, and creates an AuditLog.

        Body (optional):
            { "reason": "Looks good." }
        """
        decision = self.get_object()

        if decision.status != "WAITING_APPROVAL":
            return Response(
                {
                    "detail": (
                        f"Cannot approve a decision with status '{decision.status}'. "
                        "Only WAITING_APPROVAL decisions can be approved."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            hitl_service.execute_assignment(decision, actor=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        decision.refresh_from_db()
        serializer = self.get_serializer(decision)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Reject
    # ------------------------------------------------------------------
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        """
        Reject a WAITING_APPROVAL AI decision.

        Marks the decision as REJECTED and creates an AuditLog. The order
        is left unassigned.

        Body (optional):
            { "reason": "Hub is overloaded this week." }
        """
        decision = self.get_object()

        if decision.status != "WAITING_APPROVAL":
            return Response(
                {
                    "detail": (
                        f"Cannot reject a decision with status '{decision.status}'. "
                        "Only WAITING_APPROVAL decisions can be rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        hitl_service.reject_decision(decision, actor=request.user, reason=reason)

        decision.refresh_from_db()
        serializer = self.get_serializer(decision)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PendingDecisionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        decisions = AIDecision.objects.filter(status='WAITING_APPROVAL').order_by('-created_at')
        serializer = AIDecisionSerializer(decisions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ApproveDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        decision = get_object_or_404(AIDecision, pk=pk)

        if decision.status != "WAITING_APPROVAL":
            return Response(
                {"detail": f"Cannot approve a decision with status '{decision.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get("comment", "")
        
        try:
            hitl_service.execute_assignment(decision, actor=request.user)
            # Create AIApproval record
            AIApproval.objects.create(
                decision=decision,
                actor=request.user,
                status_changed_to="APPROVED",
                comment=comment
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        decision.refresh_from_db()
        serializer = AIDecisionSerializer(decision)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        decision = get_object_or_404(AIDecision, pk=pk)

        if decision.status != "WAITING_APPROVAL":
            return Response(
                {"detail": f"Cannot reject a decision with status '{decision.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get("comment", "")
        
        try:
            hitl_service.reject_decision(decision, actor=request.user, reason=comment)
            # Create AIApproval record
            AIApproval.objects.create(
                decision=decision,
                actor=request.user,
                status_changed_to="REJECTED",
                comment=comment
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        decision.refresh_from_db()
        serializer = AIDecisionSerializer(decision)
        return Response(serializer.data, status=status.HTTP_200_OK)

