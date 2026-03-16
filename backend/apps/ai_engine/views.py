from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count

from .models import AIDecision, AIApproval, AISettings
from .serializers import AIDecisionSerializer, AIApprovalSerializer
from apps.ai_engine.services import hitl_service


class AIDecisionViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for AI Decisions.
    GET    /api/ai/decisions/              — list all decisions
    HITL endpoints:
    POST   /api/ai/decisions/recommend/      — trigger recommendation for one order
    POST   /api/ai/decisions/bulk-recommend/ — trigger for all unassigned orders
    POST   /api/ai/decisions/{id}/approve/   — approve a pending assignment (resumes workflow)
    POST   /api/ai/decisions/{id}/reject/    — reject a pending assignment
    GET    /api/ai/decisions/workflow-status/{order_id}/ — get orchestration progress
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

        unassigned_orders = Order.objects.filter(hub__isnull=True).distinct()

        results = []
        for order in unassigned_orders:
            try:
                recs = recommend_hub_for_order(str(order.id))
                results.append({"order_id": order.order_id, "status": "success", "items_processed": len(recs)})
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
            # hitl_service.execute_assignment(decision, actor=request.user) # Old logic
            
            # New Orchestrator Resume Logic
            decision.status = "APPROVED"
            decision.save(update_fields=["status"])
            
            from apps.ai_engine.tasks import resume_langgraph_workflow_task
            resume_langgraph_workflow_task.delay(str(decision.id))
            
            # Create AIApproval record
            AIApproval.objects.create(
                decision=decision,
                actor=request.user,
                status_changed_to="APPROVED",
                comment=request.data.get("reason", "Approved via API")
            )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        decision.refresh_from_db()
        serializer = self.get_serializer(decision)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Workflow Status
    # ------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="workflow-status/(?P<order_id>[^/.]+)")
    def workflow_status(self, request, order_id=None):
        """
        Expose the current status of the LangGraph orchestrator for an order.
        """
        decision = AIDecision.objects.filter(
            related_order__order_id=order_id, 
            decision_type='ASSIGNMENT'
        ).first()
        
        if not decision:
            return Response({"detail": "No AI decision found for this order."}, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            "order_id": order_id,
            "current_node": decision.orchestrator_state.get("current_node", "UNKNOWN"),
            "waiting_for_hitl": decision.status == 'WAITING_APPROVAL',
            "confidence_score": decision.confidence_score,
            "execution_progress": decision.execution_trace,
            "status": decision.status
        }, status=status.HTTP_200_OK)

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


class AIAccuracyStatsView(APIView):
    """
    Returns real-time computed AI automation accuracy for the HITL dashboard header.
    Accuracy = auto-executed decisions / total non-pending decisions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = AIDecision.objects.exclude(status='PENDING').count()
        auto_executed = AIDecision.objects.filter(status='AUTO_EXECUTED').count()
        approved = AIDecision.objects.filter(status='APPROVED').count()
        rejected = AIDecision.objects.filter(status='REJECTED').count()
        pending = AIDecision.objects.filter(status='WAITING_APPROVAL').count()
        avg_conf = AIDecision.objects.aggregate(avg=Avg('confidence_score'))['avg'] or 0

        accuracy = round((auto_executed / total) * 100, 1) if total > 0 else 0
        return Response({
            'automated_accuracy': accuracy,
            'total_decisions': total,
            'auto_executed': auto_executed,
            'approved': approved,
            'rejected': rejected,
            'pending': pending,
            'avg_confidence': round(avg_conf * 100, 1),
        })


class AIApprovalHistoryView(APIView):
    """
    Returns paginated list of all AIApproval records for HITL History page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        approvals = AIApproval.objects.select_related(
            'decision', 'decision__related_order', 'actor'
        ).order_by('-created_at')[:100]

        data = []
        for ap in approvals:
            decision = ap.decision
            order = decision.related_order
            actor = ap.actor
            data.append({
                'id': str(ap.id),
                'timestamp': ap.created_at.isoformat(),
                'actor_name': f"{actor.first_name} {actor.last_name}".strip() if actor else 'System',
                'actor_email': actor.email if actor else '',
                'decision_id': str(decision.id)[:8],
                'decision_type': decision.decision_type,
                'order_id': order.order_id if order else 'N/A',
                'action': ap.status_changed_to,
                'comment': ap.comment or '',
                'confidence_score': round(decision.confidence_score * 100, 1),
            })

        return Response(data)


class ConfidenceThresholdView(APIView):
    """
    GET  /api/ai/settings/confidence-threshold/
        Returns the current auto_execute_threshold and hitl_threshold values.

    POST /api/ai/settings/confidence-threshold/
        Updates thresholds. Restricted to PROGRAM_MANAGER and ADMIN roles.
        Body: { auto_execute_threshold: float, hitl_threshold: float }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        s = AISettings.get_settings()
        return Response({
            'auto_execute_threshold': s.auto_execute_threshold,
            'hitl_threshold': s.hitl_threshold,
            'notes': s.notes,
            'updated_at': s.updated_at.isoformat() if s.updated_at else None,
            'last_updated_by': (
                f"{s.last_updated_by.first_name} {s.last_updated_by.last_name}".strip()
                or s.last_updated_by.email
                if s.last_updated_by else None
            ),
        })

    def post(self, request):
        # Only Program Managers and Admins may modify thresholds
        allowed_roles = ('PROGRAM_MANAGER', 'ADMIN')
        if not (request.user.is_staff or getattr(request.user, 'role', None) in allowed_roles):
            return Response(
                {'detail': 'Only Program Managers and Admins can change confidence thresholds.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        auto_exec = request.data.get('auto_execute_threshold')
        hitl = request.data.get('hitl_threshold')
        notes = request.data.get('notes', None)

        # Validate
        errors = {}
        try:
            auto_exec = float(auto_exec)
            if not (0 <= auto_exec <= 100):
                errors['auto_execute_threshold'] = 'Must be between 0 and 100.'
        except (TypeError, ValueError):
            errors['auto_execute_threshold'] = 'Must be a valid number.'

        try:
            hitl = float(hitl)
            if not (0 <= hitl <= 100):
                errors['hitl_threshold'] = 'Must be between 0 and 100.'
        except (TypeError, ValueError):
            errors['hitl_threshold'] = 'Must be a valid number.'

        if not errors and hitl >= auto_exec:
            errors['hitl_threshold'] = (
                f'HITL threshold ({hitl}%) must be strictly less than the '
                f'auto-execute threshold ({auto_exec}%).'
            )

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Persist
        s = AISettings.get_settings()
        s.auto_execute_threshold = auto_exec
        s.hitl_threshold = hitl
        if notes is not None:
            s.notes = notes
        s.last_updated_by = request.user
        s.save()

        return Response({
            'auto_execute_threshold': s.auto_execute_threshold,
            'hitl_threshold': s.hitl_threshold,
            'notes': s.notes,
            'updated_at': s.updated_at.isoformat(),
            'last_updated_by': (
                f"{s.last_updated_by.first_name} {s.last_updated_by.last_name}".strip()
                or s.last_updated_by.email
            ),
        })
