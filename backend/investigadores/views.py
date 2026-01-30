from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
import os
from auditoria.models import ActivityLog

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_constancia(request, filename):
    """
    Sirve el archivo de constancia si el usuario está autenticado y registra la actividad.
    """
    file_path = os.path.join(settings.MEDIA_ROOT, 'constancias', filename)
    
    if not os.path.exists(file_path):
        raise Http404("Constancia no encontrada")
        
    # Registrar log de descarga/visualización
    try:
        ActivityLog.objects.create(
            user=request.user,
            action='DOWNLOAD',
            endpoint=request.path,
            method='GET',
            description=f"Visualización/Descarga de constancia: {filename}",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    except Exception as e:
        print(f"Error creating log: {e}")
        
    return FileResponse(open(file_path, 'rb'), content_type='application/pdf')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_constancia(request, filename):
    """
    Verifica si existe una constancia
    """
    file_path = os.path.join(settings.MEDIA_ROOT, 'constancias', filename)
    exists = os.path.exists(file_path)
    return Response({'exists': exists})
