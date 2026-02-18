from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
import os

class UppercaseMixin:
    def save(self, *args, **kwargs):
        for field in self._meta.fields:
            if isinstance(field, (models.CharField, models.EmailField)):
                value = getattr(self, field.name)
                if isinstance(value, str):
                    setattr(self, field.name, value.upper())
        super().save(*args, **kwargs)

class Baja(UppercaseMixin, models.Model):
    # Campos solicitados
    ficha = models.CharField(max_length=15)
    nombre = models.CharField(max_length=40)
    nivel = models.CharField(max_length=2)  # "NUM(2)" -> CharField or IntegerField. Using Char for broader compatibility if needed, or Int. User said NUM(2). Let's use CharField(2) to be safe with "01", "02".
    nuevo_nivel = models.CharField(max_length=2,null=True, blank=True)
    grado = models.CharField(max_length=5, null=True, blank=True)
    
    # Catalogos
    costo_plaza = models.CharField(max_length=100,null=True, blank=True) # CATALOGO
    costo_nueva_plaza = models.CharField(max_length=100,null=True, blank=True) # CATALOGO
    
    ahorro = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # DINERO
    # Renamed from dir to direccion and increased length
    direccion = models.CharField(max_length=100, null=True, blank=True)
    subdireccion = models.CharField(max_length=100, null=True, blank=True)
    fuente = models.CharField(max_length=50, null=True, blank=True)
    regional = models.CharField(max_length=100, null=True, blank=True)

    REGION_CHOICES = [
        ('NORTE', 'NORTE'),
        ('SUR', 'SUR'),
        ('SURESTE', 'SURESTE'),
        ('ALTIPLANO', 'ALTIPLANO'),
        ('GAI', 'GAI'),
    ]
    region = models.CharField(max_length=50, choices=REGION_CHOICES) 
    
    TRAMITE_CHOICES = [
        ('LIQUIDACIÓN', 'LIQUIDACIÓN'),
        ('DESCENSO', 'DESCENSO'),
        ('JUBILACIÓN', 'JUBILACIÓN'),
        ('RESCATADO(A)', 'RESCATADO(A)'),
    ]
    tramite = models.CharField(max_length=50, choices=TRAMITE_CHOICES) 
    
    liquidacion_neta = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # DINERO
    observaciones = models.CharField(max_length=100, null=True, blank=True)
    
    STATUS_CHOICES = [
        ('RECHAZÓ', 'RECHAZÓ'),
        ('ACEPTÓ', 'ACEPTÓ'),
        ('AUSENCIA', 'AUSENCIA'),
        ('PENDIENTE', 'PENDIENTE'),
        ('RESCATADO(A)', 'RESCATADO(A)'),
        ('SIN CONTRATO VIGENTE', 'SIN CONTRATO VIGENTE')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RECHAZÓ') 

    fecha_ejecucion = models.DateField(null=True, blank=True) # FECHA
    origen = models.CharField(max_length=50, null=True, blank=True)
    
    # SAP(CATALOGO'PENDIENTE' o 'APLICADO')
    SAP_CHOICES = [
        ('PENDIENTE', 'PENDIENTE'),
        ('APLICADO', 'APLICADO'),
    ]
    sap = models.CharField(max_length=20, choices=SAP_CHOICES, default='PENDIENTE', null=True, blank=True)
    
    posicion = models.CharField(max_length=150, null=True, blank=True)
    cambio_plaza = models.CharField(max_length=8, null=True, blank=True) 
    antiguedad = models.IntegerField(null=True, blank=True) 
    
    libre = models.BooleanField(default=False, null=True, blank=True) 
    confirmacion_descenso = models.BooleanField(default=False, null=True, blank=True) 
    
    observaciones_2 = models.CharField(max_length=100, null=True, blank=True)
    cancelada = models.BooleanField(default=False, null=True, blank=True) 
    comentarios = models.CharField(max_length=100, null=True, blank=True)
    fecha_registro = models.DateField(auto_now_add=True,null=True, blank=True) 
    
    #campos para el odicio de conformidad
    fecha_oficio = models.DateField(null=True, blank=True)
    representante_patronal = models.CharField(max_length=100, null=True, blank=True)
    fecha_ultimo_dia_laboral = models.DateField(null=True, blank=True)
    

    # Auditoría standards (reusing from other models)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='bajas_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Workflow Status
    ESTATUS_BAJA_CHOICES = [
        ('REGISTRO', 'REGISTRO'),
        ('SEGUIMIENTO', 'SEGUIMIENTO'),
        ('FINALIZACION', 'FINALIZACION'),
        ('CONCLUIDA', 'CONCLUIDA'),
    ]
    estatus_baja = models.CharField(max_length=20, choices=ESTATUS_BAJA_CHOICES, default='REGISTRO')

    def __str__(self):
        return f"{self.ficha} - {self.nombre}"

def generar_ruta_archivo(instance, filename):
    ext = filename.split('.')[-1]

    if instance.baja and instance.baja.ficha:
        reporte_safe = instance.baja.ficha.replace('/', '-')
    else:
        reporte_safe = "SIN_REPORTE"

    if instance.tipo == 'Solicitud':
        nuevo_nombre = f"{reporte_safe}_Solicitud.{ext}"
    else:
        cantidad = DocumentoBaja.objects.filter(
            baja=instance.baja,
            tipo=instance.tipo
        ).count() + 1
        
        tipo_safe = instance.tipo.replace(' ', '_')
        nuevo_nombre = f"{reporte_safe}_{tipo_safe}_{cantidad}.{ext}"
    
    return f"bajas/documentos/{reporte_safe}/{nuevo_nombre}"

class DocumentoBaja(models.Model):
    baja = models.ForeignKey(Baja, on_delete=models.CASCADE, related_name='documentos')
    
    TIPO_DOC_CHOICES = [
        ('Solicitud', 'Solicitud'),
        ('Formato de conformidad y/o Acta Constancia', 'Formato de conformidad y/o Acta Constancia'),
        ('INE', 'INE'),
        ('Estimación de cálculo de terminación', 'Estimación de cálculo de terminación'),
        ('Formato de adeudos', 'Formato de adeudos'),
        ('Comunicación a GIMP', 'Comunicación a GIMP'),
    ]
    tipo = models.CharField(max_length=50, choices=TIPO_DOC_CHOICES)
    
    archivo = models.FileField(upload_to=generar_ruta_archivo, max_length=255)
    
    descripcion = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.baja.ficha}"

    def delete(self, *args, **kwargs):
        if self.archivo:
            if os.path.isfile(self.archivo.path):
                os.remove(self.archivo.path)
        super().delete(*args, **kwargs)