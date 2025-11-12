from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.models import User
from .models import Investigacion, Contacto, Investigador, Involucrado, Testigo


# Serializers para modelos relacionados
class ContactoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contacto
        fields = [
            'id', 'ficha', 'nombre', 'categoria', 'puesto', 
            'extension', 'email', 'tipo'
        ]
        read_only_fields = ['id']

    def validate_ficha(self, value):
        if not value.strip():
            raise serializers.ValidationError("La ficha es requerida")
        return value

    def validate_nombre(self, value):
        if not value.strip():
            raise serializers.ValidationError("El nombre es requerido")
        return value

class InvestigadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investigador
        fields = [
            'id', 'ficha', 'nombre', 'categoria', 'puesto', 
            'extension', 'email'
        ]
        read_only_fields = ['id']

    def validate_ficha(self, value):
        if not value.strip():
            raise serializers.ValidationError("La ficha es requerida")
        return value

class InvolucradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Involucrado
        fields = [
            'id', 'ficha', 'nombre', 'nivel', 'categoria', 'puesto',
            'edad', 'antiguedad', 'rfc', 'curp', 'direccion'
        ]
        read_only_fields = ['id']

    def validate_ficha(self, value):
        if not value.strip():
            raise serializers.ValidationError("La ficha es requerida")
        return value

    def validate_edad(self, value):
        if value < 18 or value > 100:
            raise serializers.ValidationError("La edad debe estar entre 18 y 100 años")
        return value

    def validate_antiguedad(self, value):
        if value < 0:
            raise serializers.ValidationError("La antigüedad no puede ser negativa")
        return value

class TestigoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testigo
        fields = [
            'id', 'ficha', 'nombre', 'nivel', 'categoria', 'puesto',
            'direccion', 'subordinacion'
        ]
        read_only_fields = ['id']

    def validate_ficha(self, value):
        if not value.strip():
            raise serializers.ValidationError("La ficha es requerida")
        return value

# Serializer principal para Investigacion
class InvestigacionSerializer(serializers.ModelSerializer):
    # Campos relacionados
    contactos = ContactoSerializer(many=True, required=False)
    investigadores = InvestigadorSerializer(many=True, required=False)
    involucrados = InvolucradoSerializer(many=True, required=False)
    testigos = TestigoSerializer(many=True, required=False)
    
    # Campos de solo lectura para mostrar información relacionada
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    
    # Campos calculados para el frontend
    dias_restantes = serializers.SerializerMethodField()
    semaforo = serializers.SerializerMethodField()

    class Meta:
        model = Investigacion
        fields = [
            # Información básica
            'id', 'numero_reporte', 'nombre_corto', 'descripcion_general',
            
            # Sección 1: Registro de Investigación
            'direccion', 'procedencia', 'regimen', 'sindicato', 
            'centro', 'area_depto', 'gravedad',
            
            # Sección 2: Conocimiento de Hechos
            'fecha_reporte', 'fecha_conocimiento_hechos', 'fecha_prescripcion',
            'economica',
            
            # Sección 3: Gerencia Responsable
            'gerencia_responsable',
            
            # Sección 4: Evento
            'lugar', 'observaciones', 'fecha_evento', 'centro_trabajo',
            'antecedentes',
            
            # Relaciones
            'contactos', 'investigadores', 'involucrados', 'testigos',
            
            # Auditoría y campos calculados
            'created_by', 'created_by_name', 'created_by_email',
            'created_at', 'updated_at', 'dias_restantes', 'semaforo'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 
            'numero_reporte', 'fecha_prescripcion', 'dias_restantes', 'semaforo'
        ]

    def get_dias_restantes(self, obj):
        """Calcula días restantes hasta la fecha de prescripción"""
        from datetime import date
        if obj.fecha_prescripcion:
            hoy = date.today()
            dias = (obj.fecha_prescripcion - hoy).days
            return max(0, dias)  # No mostrar negativos
        return None

    def get_semaforo(self, obj):
        """Calcula el semáforo basado en días restantes"""
        dias_restantes = self.get_dias_restantes(obj)
        if dias_restantes is None:
            return 'gray'
        elif dias_restantes <= 7:
            return 'red'
        elif dias_restantes <= 15:
            return 'yellow'
        else:
            return 'green'

    def validate(self, data):
        """Validaciones generales"""
        errors = {}

        # Validar que si régimen es Sindicalizado o Ambos, debe tener sindicato
        regimen = data.get('regimen', getattr(self.instance, 'regimen', None))
        sindicato = data.get('sindicato', getattr(self.instance, 'sindicato', None))
        
        if regimen in ['Sindicalizado', 'Ambos'] and not sindicato:
            errors['sindicato'] = "Este campo es requerido cuando el régimen es Sindicalizado o Ambos"

        # Validar fechas
        fecha_conocimiento = data.get('fecha_conocimiento_hechos')
        fecha_reporte = data.get('fecha_reporte')
        fecha_evento = data.get('fecha_evento')

        if fecha_conocimiento and fecha_reporte:
            if fecha_conocimiento > fecha_reporte:
                errors['fecha_conocimiento_hechos'] = "La fecha de conocimiento no puede ser posterior a la fecha de reporte"

        if fecha_evento and fecha_reporte:
            if fecha_evento > fecha_reporte:
                errors['fecha_evento'] = "La fecha del evento no puede ser posterior a la fecha de reporte"

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def create(self, validated_data):
        # Extraer datos de relaciones
        contactos_data = validated_data.pop('contactos', [])
        investigadores_data = validated_data.pop('investigadores', [])
        involucrados_data = validated_data.pop('involucrados', [])
        testigos_data = validated_data.pop('testigos', [])
        
        # Generar número de reporte automáticamente
        gerencia_responsable = validated_data.get('gerencia_responsable')
        if gerencia_responsable:
            validated_data['numero_reporte'] = self.generar_numero_reporte(gerencia_responsable)
        
        # Crear investigación principal
        investigacion = Investigacion.objects.create(**validated_data)
        
        # Crear relaciones
        self._create_relations(investigacion, contactos_data, Contacto)
        self._create_relations(investigacion, investigadores_data, Investigador)
        self._create_relations(investigacion, involucrados_data, Involucrado)
        self._create_relations(investigacion, testigos_data, Testigo)
        
        return investigacion
    
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
            'Oficinas Centrales': 'GAI'
        }
        
        prefijo = prefijos.get(gerencia_responsable, 'GAI')
        
        # Contar investigaciones existentes este año para esta gerencia
        from .models import Investigacion
        conteo = Investigacion.objects.filter(
            gerencia_responsable=gerencia_responsable,
            created_at__year=año
        ).count()
        
        numero = str(conteo + 1).zfill(3)
        
        return f"{prefijo}/{numero}/{año}"

    def update(self, instance, validated_data):
        # Extraer datos de relaciones
        contactos_data = validated_data.pop('contactos', None)
        investigadores_data = validated_data.pop('investigadores', None)
        involucrados_data = validated_data.pop('involucrados', None)
        testigos_data = validated_data.pop('testigos', None)
        
        # Actualizar campos principales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar relaciones si se proporcionan
        if contactos_data is not None:
            instance.contactos.all().delete()
            self._create_relations(instance, contactos_data, Contacto)
        
        if investigadores_data is not None:
            instance.investigadores.all().delete()
            self._create_relations(instance, investigadores_data, Investigador)
        
        if involucrados_data is not None:
            instance.involucrados.all().delete()
            self._create_relations(instance, involucrados_data, Involucrado)
        
        if testigos_data is not None:
            instance.testigos.all().delete()
            self._create_relations(instance, testigos_data, Testigo)
        
        return instance

    def _create_relations(self, investigacion, relations_data, model_class):
        """Método helper para crear relaciones"""
        for relation_data in relations_data:
            model_class.objects.create(investigacion=investigacion, **relation_data)

# Serializer para listado (más ligero)
class InvestigacionListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    dias_restantes = serializers.SerializerMethodField()
    semaforo = serializers.SerializerMethodField()
    total_involucrados = serializers.SerializerMethodField()
    total_testigos = serializers.SerializerMethodField()

    class Meta:
        model = Investigacion
        fields = [
            'id', 'numero_reporte', 'nombre_corto', 'procedencia', 'descripcion_general',
            'direccion', 'gravedad', 'fecha_reporte', 'fecha_prescripcion',
            'gerencia_responsable', 'created_by_name', 'dias_restantes',
            'semaforo', 'total_involucrados', 'total_testigos', 'created_at'
        ]

    def get_dias_restantes(self, obj):
        from datetime import date
        if obj.fecha_prescripcion:
            hoy = date.today()
            dias = (obj.fecha_prescripcion - hoy).days
            return max(0, dias)
        return None

    def get_semaforo(self, obj):
        dias_restantes = self.get_dias_restantes(obj)
        if dias_restantes is None:
            return 'gray'
        elif dias_restantes <= 5:
            return 'red'
        elif dias_restantes <= 10:
            return 'orange'
        elif dias_restantes <= 20:
            return 'yellow'
        else:
            return 'green'

    def get_total_involucrados(self, obj):
        return obj.involucrados.count()

    def get_total_testigos(self, obj):
        return obj.testigos.count()

# Serializer para búsqueda de empleados
class EmpleadoBusquedaSerializer(serializers.Serializer):
    ficha = serializers.CharField(max_length=20, required=True)
    nombre = serializers.CharField(max_length=100, read_only=True)
    nivel = serializers.CharField(max_length=50, read_only=True)
    categoria = serializers.CharField(max_length=50, read_only=True)
    puesto = serializers.CharField(max_length=100, read_only=True)
    edad = serializers.IntegerField(read_only=True)
    antiguedad = serializers.IntegerField(read_only=True)
    rfc = serializers.CharField(max_length=20, read_only=True)
    curp = serializers.CharField(max_length=18, read_only=True)
    direccion = serializers.CharField(max_length=200, read_only=True)

# Serializer para opciones de listas desplegables
class OpcionesSerializer(serializers.Serializer):
    direcciones = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    procedencias = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    regimenes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    sindicatos = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    gravedades = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )
    gerencias = serializers.ListField(
        child=serializers.CharField(),
        read_only=True
    )

# Serializer para estadísticas
class EstadisticasSerializer(serializers.Serializer):
    total_investigaciones = serializers.IntegerField()
    investigaciones_activas = serializers.IntegerField()
    investigaciones_por_vencer = serializers.IntegerField()
    investigaciones_vencidas = serializers.IntegerField()
    por_gravedad = serializers.DictField(child=serializers.IntegerField())
    por_direccion = serializers.DictField(child=serializers.IntegerField())
    por_gerencia = serializers.DictField(child=serializers.IntegerField())