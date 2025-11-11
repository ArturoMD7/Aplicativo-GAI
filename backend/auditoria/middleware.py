# auditoria/middleware.py
import json
import re
import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from .models import ActivityLog
from investigaciones.models import Investigacion

logger = logging.getLogger(__name__)

class ActivityLoggingMiddleware(MiddlewareMixin):
    
    def process_response(self, request, response):
        request_id = f"{request.method}:{request.path}:{request.user.id}:{time.time()}"
        
        if hasattr(request, '_activity_log_processed'):
            return response
        
        request._activity_log_processed = True
        
        if not (200 <= response.status_code < 300):
            return response
            
        if request.method == 'OPTIONS':
            return response
            
        if not isinstance(request.user, AnonymousUser) and request.user.is_authenticated:
            
            current_path = request.path
            
            if self._should_exclude_path(current_path):
                return response

            
            action_mapping = {
                'GET': 'READ',
                'POST': 'CREATE', 
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE',
            }
            
            action = action_mapping.get(request.method, 'READ')
            
            description = self._get_description(request, action, response)
            
            investigacion = self._get_investigacion_from_request(request, response)
            
            if self._is_duplicate_log(request, action):
                return response
            
            # Crear registro
            try:
                log_entry = ActivityLog.objects.create(
                    user=request.user,
                    action=action,
                    endpoint=current_path,
                    method=request.method,
                    description=description,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    investigacion=investigacion
                )
            except Exception as e:
                import traceback
                traceback.print_exc()
        else:
            print(f"[DEBUG-RESPONSE] Usuario no autenticado: {request.user}")
            
        return response

    def _is_duplicate_log(self, request, action):
        """
        Verifica si ya existe un log idéntico en los últimos 5 segundos
        para evitar duplicados
        """
        from django.utils import timezone
        from datetime import timedelta
        
        five_seconds_ago = timezone.now() - timedelta(seconds=5)
        
        existing_logs = ActivityLog.objects.filter(
            user=request.user,
            endpoint=request.path,
            method=request.method,
            action=action,
            timestamp__gte=five_seconds_ago
        )
        
        is_duplicate = existing_logs.exists()
        if is_duplicate:
            print(f"[DEBUG] Duplicado detectado: {request.user.username} - {action} - {request.path}")
        
        return is_duplicate

    def _should_exclude_path(self, path):
        """Determina si una ruta debe ser excluida del logging"""
        excluded_patterns = [
            '/api/investigaciones/centros-coduni/',
            '/api/investigaciones/centros-trabajo/', 
            '/api/investigaciones/areas-por-centro/',
            '/admin/jsi18n/',
            '/api/user/profile/',
            '/api/users/',
            '/api/register/',
            '/api/user/change-password/',
            '/api/token/refresh',
            '/api/token/verify',
            #'/api/token/',
            '/api/auditoria/activity-logs/',  
        ]
        
        for pattern in excluded_patterns:
            if path.startswith(pattern):
                return True
        return False

    def _get_description(self, request, action, response):
        """Genera descripción legible de la actividad"""
        path = request.path
        
        # 1. PRIMERO: Detalle específico de investigación (con ID numérico)
        investigacion_match = re.search(r'/investigaciones/investigaciones/(\d+)/$', path)
        if investigacion_match:
            investigacion_id = investigacion_match.group(1)
            if request.method == 'GET':
                return f'Consultó detalle de investigación #{investigacion_id}'
            elif request.method in ['PUT', 'PATCH']:
                return f'Actualizó investigación #{investigacion_id}'
            elif request.method == 'DELETE':
                return f'Eliminó investigación #{investigacion_id}'
        
        descriptions = {
            '/api/investigaciones/investigaciones/': {
                'GET': 'Consultó listado de investigaciones',
                'POST': 'Creó nueva investigación'
            },
            '/api/investigaciones/opciones/': {
                'GET': 'Consultó opciones del sistema'
            },
            '/api/estadisticas/': {
                'GET': 'Consultó estadísticas del sistema'
            },
            '/api/user/profile/': {
                'GET': 'Consultó perfil de usuario',
                'PUT': 'Actualizó perfil de usuario'
            },
            '/api/user/change-password/': {
                'POST': 'Cambió contraseña'
            },
        }
        
        for endpoint_pattern, methods in descriptions.items():
            if path == endpoint_pattern or path.startswith(endpoint_pattern + '/'):
                return methods.get(request.method, f'{action} en {endpoint_pattern}')
        
        if '/api/investigaciones/' in path:
            if request.method == 'GET':
                return 'Consultó datos del sistema de investigaciones'
            elif request.method == 'POST':
                return 'Realizó operación en sistema de investigaciones'
        
        return f"{action} en {path}"

    def _get_investigacion_from_request(self, request, response):
        """Extrae investigación de la URL o response"""
        match = re.search(r'/investigaciones/investigaciones/(\d+)/', request.path)
        if match:
            try:
                investigacion_id = int(match.group(1))
                investigacion = Investigacion.objects.get(id=investigacion_id)
                return investigacion
            except (Investigacion.DoesNotExist, ValueError) as e:
                return None
        try:
            if hasattr(response, 'data') and response.data:
                investigacion_id = response.data.get('id')
                if investigacion_id:
                    return Investigacion.objects.get(id=investigacion_id)
        except (Investigacion.DoesNotExist, ValueError, AttributeError) as e:
            print(f"[DEBUG] Error obteniendo investigación desde response: {e}")
        
        return None

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip