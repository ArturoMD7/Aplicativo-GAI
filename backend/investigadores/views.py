from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
import os
from auditoria.models import ActivityLog
from rest_framework import viewsets
from investigaciones.models import CatalogoInvestigador
from .serializers import InvestigadorSerializer

class InvestigadorViewSet(viewsets.ModelViewSet):
    queryset = CatalogoInvestigador.objects.all()
    serializer_class = InvestigadorSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'ficha' # Allows /api/investigadores/management/<ficha>/

    def get_queryset(self):
        queryset = CatalogoInvestigador.objects.all()
        # Filter logic if needed
        return queryset

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_constancia(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, 'constancias', filename)
    if not os.path.exists(file_path):
        raise Http404("Constancia no encontrada")
    
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
    except Exception:
        pass
        
    return FileResponse(open(file_path, 'rb'), content_type='application/pdf')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_constancia(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, 'constancias', filename)
    exists = os.path.exists(file_path)
    return Response({'exists': exists})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_responsiva(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, 'responsiva', filename)
    if not os.path.exists(file_path):
        raise Http404("Documento no encontrado")
    
    try:
        ActivityLog.objects.create(
            user=request.user,
            action='DOWNLOAD',
            endpoint=request.path,
            method='GET',
            description=f"Descarga de Responsiva: {filename}",
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    except Exception:
        pass
        
    return FileResponse(open(file_path, 'rb'), content_type='application/pdf')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_responsiva(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, 'responsiva', filename)
    exists = os.path.exists(file_path)
    return Response({'exists': exists})
