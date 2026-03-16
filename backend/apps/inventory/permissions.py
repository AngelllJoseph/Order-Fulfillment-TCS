from rest_framework import permissions


class IsManufacturingLead(permissions.BasePermission):
    """
    Allows access only to users with MANUFACTURING_LEAD or ADMIN role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['MANUFACTURING_LEAD', 'ADMIN']


class IsHubScoped(permissions.BasePermission):
    """
    Restricts access to inventory based on the user's assigned hub.
    Admins bypass this check.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.role == 'ADMIN':
            return True
            
        # Check if the user has a hub assigned
        return request.user.hub_id is not None

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        return obj.hub_id == request.user.hub_id
