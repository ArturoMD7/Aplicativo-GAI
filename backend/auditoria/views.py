from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count
from .models import ActivityLog
from .serializers import ActivityLogSerializer, ActivityStatsSerializer

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar registros de actividad.
    Solo accesible para superusuarios y staff.
    """
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = ActivityLog.objects.all().select_related(
            'user', 'investigacion'
        ).order_by('-timestamp')
        
        # Filtros opcionales
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
            
        # Filtrar por días
        days = self.request.query_params.get('days')
        if days and days.isdigit():
            date_from = timezone.now() - timedelta(days=int(days))
            queryset = queryset.filter(timestamp__gte=date_from)
            
        return queryset

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def activity_stats(request):
    """Estadísticas de actividad para dashboard"""
    last_30_days = timezone.now() - timedelta(days=30)
    
    # Actividades por día (últimos 7 días)
    last_7_days = timezone.now() - timedelta(days=7)
    activities_by_day = ActivityLog.objects.filter(
        timestamp__gte=last_7_days
    ).extra(
        {'date': "DATE(timestamp)"}
    ).values('date').annotate(
        count=Count('id')
    ).order_by('date')
    
    stats = {
        'total_activities': ActivityLog.objects.count(),
        'last_30_days': ActivityLog.objects.filter(
            timestamp__gte=last_30_days
        ).count(),
        'top_users': list(ActivityLog.objects.filter(
            timestamp__gte=last_30_days
        ).values(
            'user__id', 'user__username', 'user__first_name', 'user__last_name', 'user__profile__ficha'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:10]),
        'actions_by_type': dict(ActivityLog.objects.filter(
            timestamp__gte=last_30_days
        ).values('action').annotate(
            total=Count('id')
        ).values_list('action', 'total')),
        'activities_by_day': list(activities_by_day),
    }
    
    serializer = ActivityStatsSerializer(stats)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_log(request):
    """
    Endpoint para crear logs manualmente desde el frontend.
    """
    action = request.data.get('action')
    description = request.data.get('description')
    investigacion_id = request.data.get('investigacion_id')
    
    if not action or not description:
        return Response({'error': 'Action and description are required'}, status=400)

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
        except:
             pass

        ActivityLog.objects.create(
            user=request.user,
            action=action,
            endpoint=request.data.get('endpoint', request.path),
            method=request.method, 
            description=description,
            investigacion_id=investigacion_id,
            ip_address=ip,
            computer_name=computer_name,
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        return Response({'status': 'ok'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)