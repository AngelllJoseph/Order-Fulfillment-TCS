from rest_framework import permissions


class IsManufacturingLead(permissions.BasePermission):
    """
    Allows access to users with MANUFACTURING_LEAD, PROGRAM_MANAGER, or ADMIN role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['MANUFACTURING_LEAD', 'ADMIN', 'PROGRAM_MANAGER']


class IsHubScoped(permissions.BasePermission):
    """
    Restricts access to inventory based on the user's assigned hub.
    Admins and Program Managers bypass this check (cross-hub read).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ('ADMIN', 'PROGRAM_MANAGER'):
            return True

        # Hub-scoped users must have a hub assigned
        return request.user.hub_id is not None

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('ADMIN', 'PROGRAM_MANAGER'):
            return True
        return obj.hub_id == request.user.hub_id
