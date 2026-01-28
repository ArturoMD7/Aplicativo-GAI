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
from .models import Investigacion, Involucrado, InvestigacionHistorico, DocumentoInvestigacion, CatalogoInvestigador
from login_register.models import Profile
from .serializers import (
    InvestigacionSerializer, InvestigacionListSerializer, 
    EmpleadoBusquedaSerializer, OpcionesSerializer,
    EstadisticasSerializer,
    DocumentoInvestigacionSerializer
)
from auditoria.models import ActivityLog

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

    @action(detail=True, methods=['patch'])
    def concluir(self, request, pk=None):
        investigacion = self.get_object()
        
        # Actualizar datos
        investigacion.estatus = request.data.get('estatus', 'CONCLUIDA')
        investigacion.reconsideracion = request.data.get('reconsideracion', False)
        investigacion.ficha_reconsideracion = request.data.get('ficha_reconsideracion')
        investigacion.sancion = request.data.get('sancion')
        investigacion.conducta_definitiva = request.data.get('conducta_definitiva')
        
        dias = request.data.get('dias_suspension')
        if dias is not None and dias != '':
             investigacion.dias_suspension = dias

        investigacion.save()
        
        return Response({'status': 'investigacion concluida'})

    def generar_numero_reporte(self, gerencia_responsable):
        """Genera número de reporte automático basado en la gerencia"""
        hoy = timezone.now()
        año = hoy.year
        
        prefijos = {
            'NORTE': 'NTE',
            'SUR': 'SUR', 
            'SURESTE': 'SURE',
            'ALTIPLANO': 'ALT',
            'GAI': 'GAI',
        }
        
        prefijo = prefijos.get(gerencia_responsable)
 
        conteo = Investigacion.objects.filter(
            gerencia_responsable=gerencia_responsable,
            created_at__year=año
        ).count()
        
        numero = str(conteo + 1).zfill(3)
        
        return f"SCH-{numero}/{año}/{prefijo}"
    
    def get_queryset(self):
        return get_investigaciones_for_user(self.request.user, self.request.query_params)

def get_investigaciones_for_user(user, query_params=None):
    queryset = Investigacion.objects.all()
    
    if user.is_authenticated:
        # 1. Admin / Superuser
        if user.is_superuser or user.groups.filter(name__in=['Admin', 'AdminCentral']).exists():
            pass # Retornar todo

        else:
            groups = list(user.groups.values_list('name', flat=True))
            
            # Identificar roles
            is_supervisor = any(g.startswith('Supervisor') for g in groups)
            is_operador = any(g.startswith('Operador') for g in groups)

            if is_supervisor:
                # Si se solicita "personal", filtrar por creadas por él.
                # Si NO, ve toda su región (comportamiento normal).
                if query_params and query_params.get('personal') == 'true':
                     queryset = queryset.filter(created_by=user)
                else:
                    if 'SupervisorNTE' in groups:
                        queryset = queryset.filter(gerencia_responsable='NORTE')
                    elif 'SupervisorSUR' in groups:
                        queryset = queryset.filter(gerencia_responsable='SUR')
                    elif 'SupervisorSTE' in groups:
                        queryset = queryset.filter(gerencia_responsable='SURESTE')
                    elif 'SupervisorALT' in groups:
                        queryset = queryset.filter(gerencia_responsable='ALTIPLANO')
                    elif 'SupervisorGAI' in groups:
                        queryset = queryset.filter(gerencia_responsable='GAI')
            
            elif is_operador:
                # Operador: Solo ve donde es investigador asignado (siempre es "personal" implicitamente)
                if hasattr(user, 'profile') and user.profile.ficha:
                    queryset = queryset.filter(investigadores__ficha=user.profile.ficha)
                else:
                    queryset = queryset.none()
            
            else:
                 # Otros usuarios basícos: Solo creadas por ellos
                queryset = queryset.filter(created_by=user) 
            
    # Filtros adicionales 
   
    if query_params:
        gravedad = query_params.get('gravedad')
        direccion = query_params.get('direccion')
        gerencia = query_params.get('gerencia')
        estado = query_params.get('estado') 
        conductas = query_params.get('conductas')
        
        # Filtros para Admin que quiere ver info de otros usuarios
        target_user_id = query_params.get('target_user_id')
        target_ficha = query_params.get('target_ficha')

        if target_user_id and (user.is_superuser or user.groups.filter(name__in=['Admin', 'AdminCentral']).exists() or str(user.id) == str(target_user_id)):
            queryset = queryset.filter(created_by_id=target_user_id)
        
        if target_ficha and (user.is_superuser or user.groups.filter(name__in=['Admin', 'AdminCentral']).exists() or (hasattr(user, 'profile') and user.profile.ficha == target_ficha)):
            queryset = queryset.filter(investigadores__ficha=target_ficha)

        if gravedad:
            queryset = queryset.filter(gravedad=gravedad)

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
        if conductas:
            queryset = queryset.filter(conductas=conductas)
    
    return queryset.order_by('-created_at')

from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_view(request, user_id):
    """
    Obtiene información completa para el dashboard de un usuario específico:
    - Info personal (perfil, ficha, foto)
    - Info laboral (tablero, antecedentes)
    - Status como investigador (constancia)
    - Estadísticas de sus investigaciones (según sus permisos)
    """
    target_user = get_object_or_404(User, pk=user_id)
    
    # 1. Info Básica
    user_data = {
        'id': target_user.id,
        'username': target_user.username,
        'email': target_user.email,
        'first_name': target_user.first_name,
        'last_name': target_user.last_name,
        'groups': list(target_user.groups.values_list('name', flat=True)),
        'ficha': getattr(target_user.profile, 'ficha', None),
        'profile_picture': None
    }
    if hasattr(target_user, 'profile') and target_user.profile.profile_picture:
         user_data['profile_picture'] = request.build_absolute_uri(target_user.profile.profile_picture.url)

    # 2. Info Laboral (Si tiene ficha)
    empleado_data = None
    if user_data['ficha']:
        try:
             with connections['pemex'].cursor() as cursor:
                cursor.execute(
                    "SELECT ficha, nombres, nivel_plaza, catego, mc_stext, edad, antig, rfc + homoclave as rfc, curp, direccion_coduni, grupo, jorna, sec_sin FROM [00_tablero_dg] WHERE ficha = %s", 
                    [user_data['ficha']]
                )
                row = cursor.fetchone()
                if row:
                    empleado_data = {
                        'nombre': row[1],
                        'nivel': row[2],
                        'categoria': row[3],
                        'puesto': row[4],
                        'edad': row[5],
                        'antiguedad': row[6],
                        'direccion': row[9],
                        'regimen': row[10],
                        'sindicato': "STPRM" if row[12] else ""
                    }
        except Exception as e:
            print(f"Error fetching empleado info: {e}")

    # 3. Status Investigador
    investigador_data = {'es_investigador': False, 'no_constancia': None}
    if user_data['ficha']:
        try:
            inv = CatalogoInvestigador.objects.get(ficha=user_data['ficha'], activo=True)
            investigador_data = {
                'es_investigador': True,
                'no_constancia': inv.no_constancia
            }
        except CatalogoInvestigador.DoesNotExist:
            pass

    # 4. Estadísticas de Investigaciones (Simulando ser el usuario target)
    # IMPORTANTE: Pasamos personal='true' para que si es Supervisor, cuente solo las suyas (Productividad)
    # Si es Operador, ya filtra por asignación por defecto.
    inv_queryset = get_investigaciones_for_user(target_user, query_params={'personal': 'true'})
    
    total = inv_queryset.count()
    concluidas = inv_queryset.filter(estatus='CONCLUIDA').count()
    # En proceso: todas las que NO están concluidas
    en_proceso = inv_queryset.exclude(estatus='CONCLUIDA').count()

    stats = {
        'total': total,
        'en_proceso': en_proceso,
        'concluidas': concluidas,
    }

    return Response({
        'user': user_data,
        'empleado': empleado_data,
        'investigador': investigador_data,
        'stats': stats
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validar_investigador_view(request):
    """
    Valida si una ficha pertenece al catálogo de investigadores autorizados
    y devuelve su número de constancia.
    """
    ficha = request.query_params.get('ficha')
    
    if not ficha:
        return Response({'error': 'Ficha requerida'}, status=400)

    try:
        investigador = CatalogoInvestigador.objects.get(ficha=ficha, activo=True)
        
        # Obtener grupos del usuario asociado a la ficha
        groups = []
        try:
            profile = Profile.objects.get(ficha=ficha)
            groups = list(profile.user.groups.values_list('name', flat=True))
        except Profile.DoesNotExist:
            pass

        return Response({
            'es_investigador': True,
            'no_constancia': investigador.no_constancia,
            'groups': groups
        })
    except CatalogoInvestigador.DoesNotExist:
        return Response({
            'es_investigador': False,
            'error': 'Esta ficha no corresponde a un investigador autorizado o está inactivo.'
        }, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_investigadores_view(request):
    """
    Devuelve lista de investigadores activos {ficha, nombre}
    Filtrado por región si el usuario es Supervisor
    """
    user = request.user
    queryset = CatalogoInvestigador.objects.filter(activo=True)

    # Lógica de filtrado regional
    if not (user.is_superuser or user.groups.filter(name__in=['Admin', 'AdminCentral']).exists()):
        groups = list(user.groups.values_list('name', flat=True))
        
        supervisor_roles = [g for g in groups if g.startswith('Supervisor')]
        if supervisor_roles:
            role = supervisor_roles[0]
            region = role.replace('Supervisor', '')
          
            try:
                operador_group_name = f'Operador{region}'
                users_operadores = User.objects.filter(groups__name=operador_group_name)
                fichas_operadores = Profile.objects.filter(user__in=users_operadores).values_list('ficha', flat=True)
                
                queryset = queryset.filter(ficha__in=fichas_operadores)
            except Exception as e:
                # Si falla algo en la logica de grupos, retornamos vacio por seguridad
                print(f"Error filtrando investigadores por region: {e}")
                queryset = queryset.none()

    data = queryset.values('ficha', 'nombre').order_by('nombre')
    return Response(list(data))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def opciones_view(request):
    """Obtener todas las opciones para listas desplegables"""
    opciones = {
        'direcciones': [],
        'procedencias': [choice[0] for choice in Investigacion.PROCEDENCIA_CHOICES],
        'regimenes': [],
        'sindicatos': [choice[0] for choice in Investigacion.SINDICATO_CHOICES],
        'gravedades': [choice[0] for choice in Investigacion.GRAVEDAD_CHOICES],
        'gerencias': [choice[0] for choice in Investigacion.GERENCIA_CHOICES],
        'conductas': [choice[0] for choice in Investigacion.CONDUCTAS_CHOICES],
        'sancion': [choice[0] for choice in Investigacion.SANCION_CHOICES],
    }
    serializer = OpcionesSerializer(opciones)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_empleado_view(request):
    serializer = EmpleadoBusquedaSerializer(data=request.query_params)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    ficha_buscada = serializer.validated_data['ficha']

    # --- LOGGING START ---
    try:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        computer_name = "Desconocido"
        try:
             import socket
             computer_name = socket.gethostbyaddr(ip)[0] 
             pass
        except:
             pass

        ActivityLog.objects.create(
            user=request.user,
            action='SEARCH',
            endpoint='/api/investigaciones/buscar-empleado/',
            method=request.method,
            description=f"Búsqueda de empleado ficha: {ficha_buscada}",
            ip_address=ip,
            computer_name=computer_name, 
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
    except Exception as e:
        print(f"Error creating activity log: {e}")


    try:
        empleado_data = None

        with connections['pemex'].cursor() as cursor:

            cursor.execute("""
                SELECT ficha, nombres, nivel_plaza, catego, mc_stext, edad, antig,
                       rfc + homoclave as rfc, curp, direccion_coduni,
                       grupo, jorna, sec_sin, termino, cve_desc_centro
                FROM [00_tablero_dg]
                WHERE ficha = %s
            """, [ficha_buscada])

            row = cursor.fetchone()

            if row:
                termino_raw = str(row[13])
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
                    'direccion': row[9],
                    'regimen': row[10],
                    'jornada': row[11],
                    'seccion_sindical': row[12],
                    'termino_raw': termino_raw,
                    'termino': f"{termino_raw[6:8]}/{termino_raw[4:6]}/{termino_raw[:4]}",  
                    'sindicato': "STPRM" if row[12] else "",
                    'centro_trabajo': row[14],
                    'fuente': 'Activos'
                }

            if not empleado_data:
                cursor.execute("""
                    SELECT ficha, nombres, nivel_plaza, catego, edad, 
                           rfc + homoclave as rfc, curp,
                           grupo, jorna, fec_term, cve_desc_centro
                    FROM [ultimo_contrato_activo]
                    WHERE ficha = %s
                """, [ficha_buscada])

                row = cursor.fetchone()

                if row:
                    termino_raw = str(row[9])
                    empleado_data = {
                        'ficha': row[0],
                        'nombre': row[1],
                        'nivel': row[2],
                        'categoria': row[3],
                        'puesto': "No disponible",
                        'edad': row[4],
                        'antiguedad': "0",
                        'rfc': row[5],
                        'curp': row[6],
                        'direccion': "No disponible",
                        'regimen': row[7],
                        'jornada': row[8],
                        'termino_raw': termino_raw,
                        'termino': f"{termino_raw[6:8]}/{termino_raw[4:6]}/{termino_raw[:4]}",
                        'seccion_sindical': "No",
                        'sindicato': "No",
                        'centro_trabajo': row[10],
                        'fuente': 'Ultimo contrato'
                    }

        if not empleado_data:
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

        # Buscar email en cuentas de usuario
        try:
            profile = Profile.objects.get(ficha=ficha_buscada)
            if profile.user.email:
                empleado_data['email'] = profile.user.email
        except Profile.DoesNotExist:
            pass

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
def buscar_gerente_responsable_view(request):
    """Busca el gerente nivel 44 basado en la gerencia seleccionada"""
    gerencia_nombre = request.query_params.get('gerencia', '')
    
    if not gerencia_nombre:
        return Response({'error': 'Gerencia requerida'}, status=400)

    try:
        if gerencia_nombre == 'GAI':
            query_gerencia = f'GERENCIA DE ASUNTOS INTERNOS'
        else:
            query_gerencia = f'GERENCIA REGIONAL DE RELACIONES LABORALES {gerencia_nombre}'
        
        with connections['pemex'].cursor() as cursor:
            cursor.execute("""
                SELECT FICHA, NOMBRES, CATEGO, MC_STEXT, GERENCIA_CODUNI, NIVEL_PLAZA 
                FROM [00_tablero_dg]
                WHERE nivel_plaza = 44  
                AND gerencia_coduni LIKE %s
            """, [f'%{query_gerencia}%'])
            
            row = cursor.fetchone()
            
            if row:
                return Response({
                    'ficha': row[0],
                    'nombre': row[1],
                    'categoria': row[2],
                    'puesto': row[3],
                })
            return Response({'error': 'No se encontró gerente nivel 44'}, status=404)
            
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

    por_conductas = {}
    for sancion in [
        'INCUMPLIMIENTO DE NORMAS Y PROCEDIMIENTOS',
        'FALTAS INJUSTIFICADAS',
        'NEGLIGENCIA EN EL DESEMPEÑO DE FUNCIONES',
        'ACOSO LABORAL (MOBBING)',
        'DESOBEDIENCIA',
        'ALTERACIÓN DEL ORDEN Y DISCIPLINA',
        'SUSTRACCIÓN, PÉRDIDA O ROBO DE BIENES',
        'USO INDEBIDO DE BIENES, HERRAMIENTAS O RECURSOS',
        'PRESENTACIÓN DE DOCUMENTACIÓN ALTERADA Y/O APÓCRIFA',
        'HOSTIGAMIENTO O ACOSO SEXUAL',
        'ENCONTRARSE EN ESTADO INCONVENIENTE',
        'DIVULGACIÓN O USO INDEBIDO DE INFORMACIÓN',
        'OCASIONAR DAÑOS O PERJUICIOS',
        'SUSPENSIÓN Y/O ABANDONO DE LABORES',
        'DISCRIMINACIÓN',
        'COBRO/PAGO(S) EN DEMASÍA INDEBIDOS',
        'OTRAS CONDUCTAS',
    ]:
        por_conductas[sancion] = queryset.filter(conductas=sancion).count()
  
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

        'por_gerencia': por_gerencia,
    }
    
    serializer = EstadisticasSerializer(estadisticas)
    return Response(serializer.data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_list_view(request, user_id):
    """
    Lista las investigaciones que aparecen en el reporte de productividad del usuario.
    Reutiliza la misma logica de permisos que el dashboard (personal='true').
    """
    target_user = get_object_or_404(User, pk=user_id)
    
    # Validar permisos: Solo el propio usuario o Admins pueden ver esto
    is_admin = request.user.is_superuser or request.user.groups.filter(name__in=['Admin', 'AdminCentral']).exists()
    if request.user.id != target_user.id and not is_admin:
         return Response({'error': 'No tiene permiso para ver detalles de este usuario'}, status=403)

    # Reutilizar lógica de filtrado del dashboard
    inv_queryset = get_investigaciones_for_user(target_user, query_params={'personal': 'true'})
    
    serializer = InvestigacionListSerializer(inv_queryset, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def buscar_personal_view(request):
    """
    Búsqueda general de personal por nombre o ficha.
    Retorna una lista de coincidencias básicas.
    """
    query = request.query_params.get('query', '').strip()
    
    if not query:
        return Response({'error': 'Debe proporcionar un término de búsqueda (ficha o nombre)'}, status=400)

    resultados = []
    
    # Determinar si es búsqueda por ficha (numérica) o nombre (texto)
    es_busqueda_ficha = query.isdigit()
    
    try:
        with connections['pemex'].cursor() as cursor:
            # 1. Búsqueda en Tablero (Activos)
            if es_busqueda_ficha:
                sql_activos = """
                    SELECT ficha, nombres, nivel_plaza, catego, mc_stext, 'Activo' as estado
                    FROM [00_tablero_dg]
                    WHERE ficha = %s
                """
                params_activos = [query]
            else:
                # Búsqueda por nombre (fuzzy)
                sql_activos = """
                    SELECT ficha, nombres, nivel_plaza, catego, mc_stext, 'Activo' as estado
                    FROM [00_tablero_dg]
                    WHERE nombres LIKE %s
                """
                params_activos = [f'%{query}%']
            
            cursor.execute(sql_activos, params_activos)
            rows = cursor.fetchall()
            
            for row in rows:
                resultados.append({
                    'ficha': row[0],
                    'nombre': row[1],
                    'nivel': row[2],
                    'categoria': row[3],
                    'puesto': row[4],
                    'estado': row[5],
                    'origen': 'Activos'
                })

            # 2. Búsqueda en Último Contrato (Inactivos/Transitorios)
            # Solo si buscamos por ficha o si queremos buscar también en históricos por nombre
            
            if es_busqueda_ficha:
                sql_inactivos = """
                    SELECT ficha, nombres, nivel_plaza, catego, 'Inactivo/Baja' as estado
                    FROM [ultimo_contrato_activo]
                    WHERE ficha = %s
                """
                params_inactivos = [query]
            else:
                 sql_inactivos = """
                    SELECT ficha, nombres, nivel_plaza, catego, 'Inactivo/Baja' as estado
                    FROM [ultimo_contrato_activo]
                    WHERE nombres LIKE %s
                """
                 params_inactivos = [f'%{query}%']

            cursor.execute(sql_inactivos, params_inactivos)
            rows = cursor.fetchall()
            
            for row in rows:
                # Evitar duplicados si ya apareció en activos (aunque raro con misma ficha, posible validación)
                if not any(r['ficha'] == row[0] for r in resultados):
                     resultados.append({
                        'ficha': row[0],
                        'nombre': row[1],
                        'nivel': row[2],
                        'categoria': row[3],
                        'puesto': 'No disponible', # ultimo_contrato no suele tener puesto detallado
                        'estado': row[4],
                        'origen': 'Último Contrato'
                    })
        
        return Response(resultados)

    except Exception as e:
        print(f"Error en buscar_personal_view: {e}")
        return Response({'error': str(e)}, status=500)
