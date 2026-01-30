from rest_framework import serializers
from investigaciones.models import CatalogoInvestigador

class InvestigadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CatalogoInvestigador
        fields = ['id', 'ficha', 'nombre', 'no_constancia', 'archivo_constancia', 'archivo_responsiva', 'activo']
        read_only_fields = ['ficha', 'nombre']
