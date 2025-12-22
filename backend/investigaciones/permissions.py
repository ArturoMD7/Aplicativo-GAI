from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso personalizado para permitir a los Admin ver todos los registros
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.groups.filter(name='Admin').exists() or request.user.is_superuser:
            return True
        
        if view.action == 'list':
            return True
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        # El filtrado se hace en get_queryset, así que si llegan aquí es porque pueden verlo/editarlo
        return True