from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Baja
from .serializers import BajaSerializer

class BajaViewSet(viewsets.ModelViewSet):
    queryset = Baja.objects.all().order_by('-created_at')
    serializer_class = BajaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ficha', 'nombre', 'nivel', 'region', 'numero_reporte'] 
    filterset_fields = ['status', 'region', 'tramite']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
