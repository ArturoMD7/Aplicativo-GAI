from django.db import models
from django.contrib.auth.models import User
from investigaciones.models import Investigacion

class ActivityLog(models.Model):
    ACTION_TYPES = [
        ('CREATE', 'Crear'),
        ('READ', 'Consultar'),
        ('UPDATE', 'Actualizar'),
        ('DELETE', 'Eliminar'),
        ('LOGIN', 'Iniciar sesión'),
        ('LOGOUT', 'Cerrar sesión'),
        ('DOWNLOAD', 'Descargar'),
        ('EXPORT', 'Exportar'),
        ('SEARCH', 'Búsqueda'),
    ]

    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=10, choices=ACTION_TYPES)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    computer_name = models.CharField(max_length=255, blank=True, null=True, help_text="Nombre de host resuelto por DNS")
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Para investigaciones específicas
    investigacion = models.ForeignKey(
        Investigacion, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='activity_logs'
    )

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-timestamp']
        verbose_name = 'Registro de Actividad'
        verbose_name_plural = 'Registros de Actividad'

    def __str__(self):
        return f"{self.user.username if self.user else 'Anon'} - {self.action} - {self.endpoint}"