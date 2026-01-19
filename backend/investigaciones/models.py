from django.db import models
from django.contrib.auth.models import User
from datetime import datetime
import os

class UppercaseMixin:
    def save(self, *args, **kwargs):
        for field in self._meta.fields:
            if isinstance(field, (models.CharField, models.EmailField)):
                value = getattr(self, field.name)
                if isinstance(value, str):
                    setattr(self, field.name, value.upper())
        super().save(*args, **kwargs)


class Investigacion(UppercaseMixin,models.Model):
    # Sección 1: Registro de Investigación
    nombre_corto = models.CharField(max_length=50)
    descripcion_general = models.CharField(max_length=140)
    
    DIRECCION_CHOICES = [
        ('DIRECCIÓN DE ADMINISTRACIÓN Y SERVICIOS', 'DIRECCIÓN DE ADMINISTRACIÓN Y SERVICIOS'),
        ('DIRECCIÓN DE COMERCIALIZACIÓN', 'DIRECCIÓN DE COMERCIALIZACIÓN'),
        ('DIRECCIÓN DE EXPLORACIÓN Y EXTRACCIÓN', 'DIRECCIÓN DE EXPLORACIÓN Y EXTRACCIÓN'),
        ('DIRECCIÓN DE FINANZAS', 'DIRECCIÓN DE FINANZAS'),
        ('DIRECCIÓN DE LOGÍSTICA', 'DIRECCIÓN DE LOGÍSTICA'),
        ('DIRECCIÓN DE PLANEACIÓN, COORDINACIÓN, DESEMPEÑO Y SOSTENIBILIDAD', 'DIRECCIÓN DE PLANEACIÓN, COORDINACIÓN, DESEMPEÑO Y SOSTENIBILIDAD'),
        ('DIRECCIÓN DE PROCESOS INDUSTRIALES', 'DIRECCIÓN DE PROCESOS INDUSTRIALES'),
        ('DIRECCIÓN DE TRANSFORMACIÓN ENERGÉTICA', 'DIRECCIÓN DE TRANSFORMACIÓN ENERGÉTICA'),
        ('DIRECCIÓN GENERAL', 'DIRECCIÓN GENERAL'),
        ('DIRECCIÓN JURÍDICA', 'DIRECCIÓN JURÍDICA'),
    ]
    direccion = models.CharField(max_length=100, choices=DIRECCION_CHOICES)
    
    PROCEDENCIA_CHOICES = [
        ('ANONIMO', 'ANONIMO'),
        ('LÍNEA DE NEGOCIO', 'LÍNEA DE NEGOCIO'),
        ('LÍNEA DE ÉTICA', 'LÍNEA DE ÉTICA'),
        ('ESCRITO LIBRE INTERNO', 'ESCRITO LIBRE INTERNO'),
        ('ESCRITO LIBRE EXTERNO', 'ESCRITO LIBRE EXTERNO'),
        ('CORREO ELECTRONICO', 'CORREO ELECTRONICO'),
    ]
    procedencia = models.CharField(max_length=30, choices=PROCEDENCIA_CHOICES)
    
    REGIMEN_CHOICES = [
        ('CONFIANZA', 'CONFIANZA'),
        ('SINDICALIZADO', 'SINDICALIZADO'),
        ('AMBOS', 'AMBOS'),
    ]
    regimen = models.CharField(max_length=15, choices=REGIMEN_CHOICES)

    CONDUCTAS_CHOICES = [
        ('INCUMPLIMIENTO DE NORMAS Y PROCEDIMIENTOS', 'INCUMPLIMIENTO DE NORMAS Y PROCEDIMIENTOS'),
        ('FALTAS INJUSTIFICADAS / ABANDONO DE LABORES', 'FALTAS INJUSTIFICADAS / ABANDONO DE LABORES'),
        ('NEGLIGENCIA EN EL DESEMPEÑO DE FUNCIONES', 'NEGLIGENCIA EN EL DESEMPEÑO DE FUNCIONES'),
        ('ACOSO LABORAL (MOBBING)', 'ACOSO LABORAL (MOBBING)'),
        ('ACTITUD INDEBIDA', 'ACTITUD INDEBIDA'),
        ('DESOBEDIENCIA', 'DESOBEDIENCIA'),
        ('ALTERACIÓN DEL ORDEN Y DISCIPLINA', 'ALTERACIÓN DEL ORDEN Y DISCIPLINA'),
        ('SUSTRACCIÓN O ROBO DE BIENES', 'SUSTRACCIÓN O ROBO DE BIENES'),
        ('USO INDEBIDO DE BIENES, HERRAMIENTAS O RECURSOS', 'USO INDEBIDO DE BIENES, HERRAMIENTAS O RECURSOS'),
        ('HOSTIGAMIENTO O ACOSO SEXUAL', 'HOSTIGAMIENTO O ACOSO SEXUAL'),
        ('CONCURRENCIA EN ESTADO INCONVENIENTE', 'CONCURRENCIA EN ESTADO INCONVENIENTE'),
        ('DIVULGACIÓN O USO INDEBIDO DE INFORMACIÓN', 'DIVULGACIÓN O USO INDEBIDO DE INFORMACIÓN'),
        ('OCASIONAR DAÑOS O PERJUICIOS', 'OCASIONAR DAÑOS O PERJUICIOS'),
        ('SUSPENSIÓN UNILATERAL DE LABORES', 'SUSPENSIÓN UNILATERAL DE LABORES'),
        ('DISCRIMINACIÓN', 'DISCRIMINACIÓN'),
        ('ACCIDENTE DE TRABAJO', 'ACCIDENTE DE TRABAJO'),
        ('OTRAS CONDUCTAS', 'OTRAS CONDUCTAS'),
        ('CLÁUSULA 253 CCT', 'CLÁUSULA 253 CCT'),
    ]
    conductas = models.CharField(max_length=65, choices=CONDUCTAS_CHOICES, default='OTRAS FALTAS')

    detalles_conducta = models.TextField(null=True, blank=True)

    subconducta = models.CharField(max_length=100, null=True, blank=True)
    
    SINDICATO_CHOICES = [
        ('STPRM', 'STPRM'),
        ('UNTYPP', 'UNTYPP'),
        ('PETROMEX', 'PETROMEX'),
    ]
    sindicato = models.CharField(max_length=10, choices=SINDICATO_CHOICES, null=True, blank=True)
    
    centro = models.CharField(max_length=100)  
    area_depto = models.CharField(max_length=100)  
    
    GRAVEDAD_CHOICES = [
        ('ALTA', 'ALTA'),
        ('MEDIA', 'MEDIA'),
        ('BAJA', 'BAJA'),
    ]
    gravedad = models.CharField(max_length=10, choices=GRAVEDAD_CHOICES)

    ESTATUS_CHOICES = [
        ('ABIERTA', 'ABIERTA'),
        ('SEGUIMIENTO', 'SEGUIMIENTO'),
        ('ENVIADA_A_CONCLUIR', 'ENVIADA_A_CONCLUIR'),
        ('CONCLUIDA', 'CONCLUIDA'),
    ]
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='ABIERTA')
    
    # Sección 2: Conocimiento de Hechos
    numero_reporte = models.CharField(max_length=50, unique=True)
    fecha_reporte = models.DateField()
    fecha_conocimiento_hechos = models.DateField()
    fecha_prescripcion = models.DateField()
    economica = models.BooleanField(default=False)
    montoeconomico = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    
    # Sección 3: Gerencia Responsable
    GERENCIA_CHOICES = [
        ('NORTE', 'NORTE'),
        ('SUR', 'SUR'),
        ('SURESTE', 'SURESTE'),
        ('ALTIPLANO', 'ALTIPLANO'),
        ('GAI', 'GAI'),
    ]
    gerencia_responsable = models.CharField(max_length=20, choices=GERENCIA_CHOICES)

    responsable_ficha = models.CharField(max_length=20, null=True, blank=True)
    responsable_nombre = models.CharField(max_length=100, null=True, blank=True)
    responsable_categoria = models.CharField(max_length=50, null=True, blank=True)
    responsable_puesto = models.CharField(max_length=100, null=True, blank=True)
    responsable_extension = models.CharField(max_length=10, null=True, blank=True)
    responsable_email = models.EmailField(null=True, blank=True)
    
    # Sección 4: Evento
    lugar = models.CharField(max_length=50)
    observaciones = models.CharField(max_length=300)
    fecha_evento = models.DateField()
    centro_trabajo = models.CharField(max_length=100)
    antecedentes = models.CharField(max_length=150)

    # Sección 5: Reconsideracion
    reconsideracion = models.BooleanField(default=False)
    ficha_reconsideracion = models.CharField(max_length=20, null=True, blank=True)
    sancion_definitiva = models.CharField(max_length=70, choices=CONDUCTAS_CHOICES, null=True, blank=True)
    
    # Auditoría
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investigaciones_creadas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.fecha_conocimiento_hechos and not self.fecha_prescripcion:
            from datetime import timedelta
            self.fecha_prescripcion = self.fecha_conocimiento_hechos + timedelta(days=30)
        
        if not self.numero_reporte:
            self.numero_reporte = self.generar_numero_reporte()
        
        super().save(*args, **kwargs)
    
    def generar_numero_reporte(self):
        return "GAI/001/2025"
    
    def __str__(self):
        return f"{self.nombre_corto} - {self.numero_reporte}"

class Contacto(UppercaseMixin,models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='contactos')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    extension = models.CharField(max_length=10, blank=True)
    email = models.EmailField(blank=True)
    TIPO_CHOICES = [
        ('CONTACTO', 'CONTACTO'),
        ('RESPONSABLE', 'RESPONSABLE'),
    ]
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES)

class Investigador(UppercaseMixin, models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='investigadores')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    extension = models.CharField(max_length=10, blank=True)
    email = models.EmailField(blank=True)
    no_constancia = models.CharField(max_length=50, blank=True)

class Reportante(UppercaseMixin, models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='reportantes')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    nivel = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    edad = models.IntegerField()
    antiguedad = models.IntegerField()
    direccion = models.CharField(max_length=200)


class Testigo(UppercaseMixin, models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='testigos')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    nivel = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200)
    subordinacion = models.BooleanField(default=False)


class InvestigacionHistorico(UppercaseMixin, models.Model):
    id_investigacion_historico = models.AutoField(db_column='IdInvestigacionHistorico', primary_key=True)
    fecha = models.DateField(db_column='Fecha')
    gerencia = models.CharField(db_column='Gerencia', max_length=50)
    nombre = models.CharField(db_column='Nombre', max_length=50)
    ficha = models.CharField(db_column='Ficha', max_length=15)
    regimen_contractual = models.CharField(db_column='RegimenContractual', max_length=2)
    centro_trabajo = models.CharField(db_column='CentroTrabajo', max_length=50)
    
    motivo_investigacion = models.CharField(db_column='MotivoInvestigacion', max_length=100, null=True)
    observaciones = models.CharField(db_column='Observaciones', max_length=300, null=True)
    sancion_aplicada = models.CharField(db_column='SancionAplicada', max_length=50, null=True)

    class Meta:
        managed = False  
        db_table = 'Investigacion_Historico'


class Involucrado(UppercaseMixin, models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='involucrados')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    nivel = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    edad = models.IntegerField()
    antiguedad = models.IntegerField()
    rfc = models.CharField(max_length=20)
    curp = models.CharField(max_length=18)
    direccion = models.CharField(max_length=200)
    tiene_antecedentes = models.BooleanField(default=False)

    regimen = models.CharField(null=True, max_length=10)
    jornada = models.CharField(null=True, max_length=10)
    sindicato = models.CharField(null=True, blank=True, max_length=50)
    seccion_sindical = models.CharField(null=True, blank=True, max_length=10)


class CatalogoInvestigador(UppercaseMixin, models.Model):
    ficha = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    no_constancia = models.CharField(max_length=50)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.ficha} - {self.nombre}"

def generar_ruta_archivo(instance, filename):
    ext = filename.split('.')[-1]

    if instance.investigacion and instance.investigacion.numero_reporte:
        reporte_safe = instance.investigacion.numero_reporte.replace('/', '-')
    else:
        reporte_safe = "SIN_REPORTE"

    # Lógica especial para NotificacionConclusion: Nombre exacto sin consecutivo
    if instance.tipo == 'NotificacionConclusion':
        nuevo_nombre = f"{reporte_safe}_NotificacionConclusion.{ext}"
    else:
        cantidad = DocumentoInvestigacion.objects.filter(
            investigacion=instance.investigacion,
            tipo=instance.tipo
        ).count() + 1
        nuevo_nombre = f"{reporte_safe}_{instance.tipo}_{cantidad}.{ext}"
    
    # hoy = datetime.now()
    # return f"investigaciones/documentos/{hoy.year}/{hoy.month}/{nuevo_nombre}"
    return f"investigaciones/documentos/{reporte_safe}/{nuevo_nombre}"


class DocumentoInvestigacion(models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='documentos')
    
    TIPO_DOC_CHOICES = [
        ('Reporte', 'Reporte para investigación'),
        ('Citatorio', 'Citatorio'),
        ('Acta', 'Acta'),
        ('Pruebas', 'Pruebas'),
        ('Dictamen', 'Dictamen'),
        ('Resultado', 'Resultado de la investigación'),
        ('Anexo', 'Anexo'),
        ('NotificacionConclusion', 'Notificación de Conclusión'),
    ]
    tipo = models.CharField(max_length=50, choices=TIPO_DOC_CHOICES)
    
    # 2. Actualiza el campo archivo usando la función
    archivo = models.FileField(upload_to=generar_ruta_archivo)
    
    descripcion = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.investigacion.numero_reporte}"

    def delete(self, *args, **kwargs):
        # Borrar archivo físico al borrar registro
        if self.archivo:
            if os.path.isfile(self.archivo.path):
                os.remove(self.archivo.path)
        super().delete(*args, **kwargs)