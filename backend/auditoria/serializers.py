from rest_framework import serializers
from .models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    investigacion_numero = serializers.CharField(
        source='investigacion.numero_reporte', 
        read_only=True
    )
    investigacion_nombre = serializers.CharField(
        source='investigacion.nombre_corto', 
        read_only=True
    )
    user_profile_ficha = serializers.CharField(
        source='user.profile.ficha', 
        read_only=True
    )
    reportados_ficha = serializers.SerializerMethodField()
    reportados_nombre = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_name', 'username', 'action', 'action_display', 
            'endpoint', 'method', 'description', 'ip_address', 'computer_name', 'user_agent',
            'timestamp', 'investigacion', 'investigacion_numero', 'investigacion_nombre', 'user_profile_ficha', 'reportados_ficha', 'reportados_nombre'
        ]
        read_only_fields = fields

    def get_reportados_ficha(self, obj):
        if obj.investigacion and obj.investigacion.involucrados.exists():
            return ", ".join([inv.ficha for inv in obj.investigacion.involucrados.all()])
        return None

    def get_reportados_nombre(self, obj):
        if obj.investigacion and obj.investigacion.involucrados.exists():
            return ", ".join([inv.nombre for inv in obj.investigacion.involucrados.all()])
        return None

class ActivityStatsSerializer(serializers.Serializer):
    total_activities = serializers.IntegerField()
    last_30_days = serializers.IntegerField()
    top_users = serializers.ListField()
    actions_by_type = serializers.DictField()
    activities_by_day = serializers.ListField()