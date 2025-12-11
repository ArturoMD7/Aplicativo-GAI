from django.db import models
from django.contrib.auth.models import User

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
        ('Línea de Ética', 'Línea de Ética'),
        ('Línea de Negocio', 'Línea de Negocio'),
    ]
    procedencia = models.CharField(max_length=20, choices=PROCEDENCIA_CHOICES)
    
    REGIMEN_CHOICES = [
        ('Confianza', 'Confianza'),
        ('Sindicalizado', 'Sindicalizado'),
        ('Ambos', 'Ambos'),
    ]
    regimen = models.CharField(max_length=15, choices=REGIMEN_CHOICES)

    SANCIONES_CHOICES = [
        ('SUSPENSION DE LABORES', 'SUSPENSION DE LABORES'),
        ('SUSTRACCION DE EQUIPO MOBILIARIO', 'SUSTRACCION DE EQUIPO MOBILIARIO'),
        ('FALTA DE PROBIDAD Y HONRADEZ', 'FALTA DE PROBIDAD Y HONRADEZ'),
        ('ALTERACION DEL ORDEN', 'ALTERACION DEL ORDEN'),
        ('PRESENTACION DE DOCUMENTACION IRREGULAR', 'PRESENTACION DE DOCUMENTACION IRREGULAR'),
        ('ACTITUD INDEBIDA', 'ACTITUD INDEBIDA'),
        ('FALTAS INJUSTIFICADAS', 'FALTAS INJUSTIFICADAS'),
        ('NEGLIGENCIA EN EL DESARROLLO DE FUNCIONES', 'NEGLIGENCIA EN EL DESARROLLO DE FUNCIONES'),
        ('DISCRIMINACION', 'DISCRIMINACION'),
        ('ACOSO LABORAL O MOBBING', 'ACOSO LABORAL O MOBBING'),
        ('ACOSO Y/O HOSTIGAMIENTO SEXUAL', 'ACOSO Y/O HOSTIGAMIENTO SEXUAL'),
        ('CONCURRIR CON EFECTOS DE ESTUPEFACIENTES Y/O EDO DE EBRIEDAD', 'CONCURRIR CON EFECTOS DE ESTUPEFACIENTES Y/O EDO DE EBRIEDAD'),
        ('INCUMPLIMIENTO DE NORMAS DE TRABAJO Y/O PROCEDIMIENTOS DE TRABAJO', 'INCUMPLIMIENTO DE NORMAS DE TRABAJO Y/O PROCEDIMIENTOS DE TRABAJO'),
        ('USO INDEBIDO DE UTILES Y/O HERRAMIENTAS DE TRABAJO', 'USO INDEBIDO DE UTILES Y/O HERRAMIENTAS DE TRABAJO'),
        ('CLAUSULA 253 CCT', 'CLAUSULA 253 CCT'),
        ('ACTOS DE CORRUPCION', 'ACTOS DE CORRUPCION'),
        ('MERCADO ILICITO DE COMBUSTIBLES', 'MERCADO ILICITO DE COMBUSTIBLES'),
        ('OTRAS FALTAS', 'OTRAS FALTAS'),
    ]
    sanciones = models.CharField(max_length=65, choices=SANCIONES_CHOICES, default='OTRAS FALTAS')
    
    SINDICATO_CHOICES = [
        ('STPRM', 'STPRM'),
        ('UNTYPP', 'UNTYPP'),
        ('Petromex', 'Petromex'),
    ]
    sindicato = models.CharField(max_length=10, choices=SINDICATO_CHOICES, null=True, blank=True)
    
    centro = models.CharField(max_length=100)  
    area_depto = models.CharField(max_length=100)  
    
    GRAVEDAD_CHOICES = [
        ('Alta', 'Alta'),
        ('Media', 'Media'),
        ('Baja', 'Baja'),
    ]
    gravedad = models.CharField(max_length=10, choices=GRAVEDAD_CHOICES)

    ESTATUS_CHOICES = [
        ('Abierta', 'Abierta'),
        ('Seguimiento', 'Seguimiento'),
        ('Concluida', 'Concluida'),
    ]
    estatus = models.CharField(max_length=20, choices=ESTATUS_CHOICES, default='Abierta')
    
    # Sección 2: Conocimiento de Hechos
    numero_reporte = models.CharField(max_length=50, unique=True)
    fecha_reporte = models.DateField()
    fecha_conocimiento_hechos = models.DateField()
    fecha_prescripcion = models.DateField()
    economica = models.BooleanField(default=False)
    montoeconomico = models.DecimalField(max_digits=9, decimal_places=2, null=True, blank=True)
    
    # Sección 3: Gerencia Responsable
    GERENCIA_CHOICES = [
        ('Norte', 'Norte'),
        ('Sur', 'Sur'),
        ('Sureste', 'Sureste'),
        ('Altiplano', 'Altiplano'),
        ('Oficinas Centrales', 'Oficinas Centrales'),
        ('GAI', 'GAI'),
    ]
    gerencia_responsable = models.CharField(max_length=20, choices=GERENCIA_CHOICES)
    
    # Sección 4: Evento
    lugar = models.CharField(max_length=50)
    observaciones = models.CharField(max_length=300)
    fecha_evento = models.DateField()
    centro_trabajo = models.CharField(max_length=100)
    antecedentes = models.CharField(max_length=150)
    
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
        ('contacto', 'Contacto'),
        ('responsable', 'Responsable'),
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

class DocumentoInvestigacion(models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='documentos')
    
    TIPO_DOC_CHOICES = [
        ('Reporte', 'Reporte para investigación'),
        ('Citatorio', 'Citatorio'),
        ('Acta', 'Acta'),
        ('Dictamen', 'Dictamen'),
        ('Resultado', 'Resultado de la investigación'),
        ('Anexo', 'Anexo'),
    ]
    tipo = models.CharField(max_length=50, choices=TIPO_DOC_CHOICES)
    archivo = models.FileField(upload_to='investigaciones/documentos/%Y/%m/')
    descripcion = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.tipo} - {self.investigacion.numero_reporte}"

    def delete(self, *args, **kwargs):
        # Borrar archivo físico al borrar registro
        self.archivo.delete()
        super().delete(*args, **kwargs)