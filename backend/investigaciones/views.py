from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.db import connections
from django.utils import timezone
from datetime import date
from .permissions import IsAdminOrReadOnly
from .models import Investigacion, Involucrado, InvestigacionHistorico, DocumentoInvestigacion
from .serializers import (
    InvestigacionSerializer, InvestigacionListSerializer, 
    EmpleadoBusquedaSerializer, OpcionesSerializer,
    EstadisticasSerializer,
    DocumentoInvestigacionSerializer
)

class DocumentoInvestigacionViewSet(viewsets.ModelViewSet):
    queryset = DocumentoInvestigacion.objects.all()
    serializer_class = DocumentoInvestigacionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) 

    def get_queryset(self):
        queryset = super().get_queryset()
        investigacion_id = self.request.query_params.get('investigacion_id')
        if investigacion_id:
            queryset = queryset.filter(investigacion_id=investigacion_id)
        return queryset

    def perform_create(self, serializer):
        # Asegurar que se guarde
        serializer.save()

class InvestigacionViewSet(viewsets.ModelViewSet):
    serializer_class = InvestigacionSerializer
    queryset = Investigacion.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]  
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvestigacionListSerializer
        return InvestigacionSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def generar_numero_reporte(self, gerencia_responsable):
        """Genera número de reporte automático basado en la gerencia"""
        hoy = timezone.now()
        año = hoy.year
        
        # Determinar prefijo basado en gerencia
        prefijos = {
            'Norte': 'GRRLRH-NTE',
            'Sur': 'GRRLRH-SUR', 
            'Sureste': 'GRRLRH-SURE',
            'Altiplano': 'GRRLRH-ALT',
            'Oficinas Centrales': 'OCC',
            'GAI': 'GAI',
        }
        
        prefijo = prefijos.get(gerencia_responsable, 'GAI')
        
        # Contar investigaciones existentes este año para esta gerencia
        conteo = Investigacion.objects.filter(
            gerencia_responsable=gerencia_responsable,
            created_at__year=año
        ).count()
        
        numero = str(conteo + 1).zfill(3)
        
        return f"{prefijo}/{numero}/{año}"
    
    def get_queryset(self):
        user = self.request.user
        queryset = Investigacion.objects.all()
        

        if user.is_authenticated:
            if not (user.groups.filter(name='Admin').exists() or user.is_superuser):
                queryset = queryset.filter(created_by=user)
        
        # Filtros adicionales
        gravedad = self.request.query_params.get('gravedad')
        direccion = self.request.query_params.get('direccion')
        gerencia = self.request.query_params.get('gerencia')
        estado = self.request.query_params.get('estado')  # activo, por_vencer, vencido
        
        if gravedad:
            queryset = queryset.filter(gravedad=gravedad)
        if direccion:
            queryset = queryset.filter(direccion=direccion)
        if gerencia:
            queryset = queryset.filter(gerencia_responsable=gerencia)
        if estado:
            hoy = date.today()
            if estado == 'por_vencer':
                queryset = queryset.filter(fecha_prescripcion__range=[hoy, hoy + timezone.timedelta(days=7)])
            elif estado == 'vencido':
                queryset = queryset.filter(fecha_prescripcion__lt=hoy)
            elif estado == 'activo':
                queryset = queryset.filter(fecha_prescripcion__gte=hoy)
        
        return queryset.order_by('-created_at')



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def opciones_view(request):
    """Obtener todas las opciones para listas desplegables"""
    opciones = {
        'direcciones': [choice[0] for choice in Investigacion.DIRECCION_CHOICES],
        'procedencias': [choice[0] for choice in Investigacion.PROCEDENCIA_CHOICES],
        'regimenes': [choice[0] for choice in Investigacion.REGIMEN_CHOICES],
        'sindicatos': [choice[0] for choice in Investigacion.SINDICATO_CHOICES],
        'gravedades': [choice[0] for choice in Investigacion.GRAVEDAD_CHOICES],
        'gerencias': [choice[0] for choice in Investigacion.GERENCIA_CHOICES],
        'sanciones': [choice[0] for choice in Investigacion.SANCIONES_CHOICES],
    }
    serializer = OpcionesSerializer(opciones)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_empleado_view(request):
    """Buscar empleado y sus antecedentes"""
    serializer = EmpleadoBusquedaSerializer(data=request.query_params)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    ficha_buscada = serializer.validated_data['ficha']
    
    try:
        empleado_data = {}
        
        with connections['pemex'].cursor() as cursor:
            cursor.execute(
                "SELECT ficha, nombres, nivel_plaza, catego, mc_stext, edad, antig, rfc + homoclave as rfc, curp, direccion_coduni FROM [00_tablero_dg] WHERE ficha = %s", 
                [ficha_buscada]
            )
            row = cursor.fetchone()
            
            if row:
                empleado_data = {
                    'ficha': row[0],
                    'nombre': row[1],
                    'nivel': row[2],
                    'categoria': row[3],
                    'puesto': row[4],
                    'edad': row[5],
                    'antiguedad': row[6],
                    'rfc': row[7],
                    'curp': row[8],
                    'direccion': row[9]
                }
            else:
                return Response({'error': 'Empleado no encontrado'}, status=404)
        
        lista_antecedentes = []
        
        historicos = InvestigacionHistorico.objects.filter(ficha=ficha_buscada)
        for h in historicos:
            desc = f"{h.motivo_investigacion or ''} - {h.observaciones or ''} (Sanción: {h.sancion_aplicada or 'N/A'})"
            lista_antecedentes.append({
                'origen': 'Histórico (Legacy)',
                'fecha': h.fecha,
                'descripcion': desc.strip(' -'),
                'referencia': 'N/A'
            })

        actuales = Involucrado.objects.filter(ficha=ficha_buscada).select_related('investigacion')
        for inv in actuales:
            lista_antecedentes.append({
                'origen': 'Sistema Actual',
                'fecha': inv.investigacion.fecha_reporte,
                'descripcion': inv.investigacion.antecedentes or inv.investigacion.observaciones,
                'referencia': inv.investigacion.numero_reporte
            })

        empleado_data['antecedentes'] = lista_antecedentes
        
        return Response(empleado_data)
                
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def centros_trabajo_view(request):
    """Obtener lista de centros de trabajo"""
    try:
        with connections['pemex'].cursor() as cursor:
            cursor.execute("SELECT DISTINCT cve_desc_centro FROM [00_tablero_dg] WHERE cve_desc_centro IS NOT NULL ORDER BY cve_desc_centro")
            centros = [row[0] for row in cursor.fetchall() if row[0]]
            return Response(centros)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def centros_coduni_view(request):
    """Obtener lista de centros desde CODUNI_l"""
    try:
        with connections['pemex'].cursor() as cursor:
            cursor.execute("SELECT DISTINCT DESC_CDET FROM CODUNI_l WHERE DESC_CDET IS NOT NULL ORDER BY DESC_CDET")
            centros = [row[0] for row in cursor.fetchall() if row[0]]
            return Response(centros)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def areas_por_centro_view(request):
    """Obtener áreas/departamentos por centro"""
    centro = request.query_params.get('centro', '')
    
    if not centro:
        return Response({'error': 'Se requiere el parámetro centro'}, status=400)
    
    try:
        with connections['pemex'].cursor() as cursor:
            cursor.execute(
                "SELECT DISTINCT Desc_Depto FROM CODUNI_l WHERE DESC_CDET = %s AND Desc_Depto IS NOT NULL ORDER BY Desc_Depto",
                [centro]
            )
            areas = [row[0] for row in cursor.fetchall() if row[0]]
            return Response(areas)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_view(request):
    """Obtener estadísticas de investigaciones"""
    user = request.user
    queryset = Investigacion.objects.all()
    
    # Filtrar por usuario si no es superusuario
    if user.is_authenticated:
        if not (user.groups.filter(name='Admin').exists() or user.is_superuser):
            queryset = queryset.filter(created_by=user)
    
    hoy = date.today()
    
    # Estadísticas básicas
    total_investigaciones = queryset.count()
    investigaciones_activas = queryset.filter(fecha_prescripcion__gte=hoy).count()
    investigaciones_por_vencer = queryset.filter(
        fecha_prescripcion__range=[hoy, hoy + timezone.timedelta(days=7)]
    ).count()
    investigaciones_vencidas = queryset.filter(fecha_prescripcion__lt=hoy).count()
    
    # Estadísticas por gravedad
    por_gravedad = {}
    for gravedad in ['Alta', 'Media', 'Baja']:
        por_gravedad[gravedad] = queryset.filter(gravedad=gravedad).count()
    
    # Estadísticas por dirección
    por_direccion = {}
    for direccion in [choice[0] for choice in Investigacion.DIRECCION_CHOICES]:
        count = queryset.filter(direccion=direccion).count()
        if count > 0:
            por_direccion[direccion] = count
    
    # Estadísticas por gerencia
    por_gerencia = {}
    for gerencia in [choice[0] for choice in Investigacion.GERENCIA_CHOICES]:
        count = queryset.filter(gerencia_responsable=gerencia).count()
        if count > 0:
            por_gerencia[gerencia] = count
    
    estadisticas = {
        'total_investigaciones': total_investigaciones,
        'investigaciones_activas': investigaciones_activas,
        'investigaciones_por_vencer': investigaciones_por_vencer,
        'investigaciones_vencidas': investigaciones_vencidas,
        'por_gravedad': por_gravedad,
        'por_direccion': por_direccion,
        'por_gerencia': por_gerencia,
    }
    
    serializer = EstadisticasSerializer(estadisticas)
    return Response(serializer.data)