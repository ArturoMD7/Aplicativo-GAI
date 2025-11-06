from django.db import models
from django.contrib.auth.models import User

class Investigacion(models.Model):
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
    
    SINDICATO_CHOICES = [
        ('STPRM', 'STPRM'),
        ('UNTYPP', 'UNTYPP'),
        ('Petromex', 'Petromex'),
    ]
    sindicato = models.CharField(max_length=10, choices=SINDICATO_CHOICES, null=True, blank=True)
    
    centro = models.CharField(max_length=100)  # Se llenará desde CODUNI_l
    area_depto = models.CharField(max_length=100)  # Se llenará desde CODUNI_l
    
    GRAVEDAD_CHOICES = [
        ('Alta', 'Alta'),
        ('Media', 'Media'),
        ('Baja', 'Baja'),
    ]
    gravedad = models.CharField(max_length=10, choices=GRAVEDAD_CHOICES)
    
    # Sección 2: Conocimiento de Hechos
    numero_reporte = models.CharField(max_length=50, unique=True)
    fecha_reporte = models.DateField()
    fecha_conocimiento_hechos = models.DateField()
    fecha_prescripcion = models.DateField()
    economica = models.BooleanField(default=False)
    
    # Sección 3: Gerencia Responsable
    GERENCIA_CHOICES = [
        ('Norte', 'Norte'),
        ('Sur', 'Sur'),
        ('Sureste', 'Sureste'),
        ('Altiplano', 'Altiplano'),
        ('Oficinas Centrales', 'Oficinas Centrales'),
    ]
    gerencia_responsable = models.CharField(max_length=20, choices=GERENCIA_CHOICES)
    
    # Sección 4: Evento
    lugar = models.CharField(max_length=50)
    observaciones = models.CharField(max_length=140)
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

class Contacto(models.Model):
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

class Investigador(models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='investigadores')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    extension = models.CharField(max_length=10, blank=True)
    email = models.EmailField(blank=True)

class Involucrado(models.Model):
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

class Testigo(models.Model):
    investigacion = models.ForeignKey(Investigacion, on_delete=models.CASCADE, related_name='testigos')
    ficha = models.CharField(max_length=20)
    nombre = models.CharField(max_length=100)
    nivel = models.CharField(max_length=50)
    categoria = models.CharField(max_length=50)
    puesto = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200)
    subordinacion = models.BooleanField(default=False)