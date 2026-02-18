from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Baja
from .serializers import BajaSerializer
import datetime
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from docxtpl import DocxTemplate
import io
from datetime import timedelta

import locale

locale.setlocale(locale.LC_TIME, 'Spanish_Spain')

class BajaViewSet(viewsets.ModelViewSet):
    queryset = Baja.objects.all().order_by('-created_at')
    serializer_class = BajaSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['ficha', 'nombre', 'nivel', 'region'] 
    filterset_fields = ['status', 'region', 'tramite']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("\n!!! BAJA CREATION VALIDATION ERRORS !!!")
            print(serializer.errors)
            print("Request Data:", request.data)
            return Response(serializer.errors, status=400)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

from .models import DocumentoBaja
from .serializers import DocumentoBajaSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class DocumentoBajaViewSet(viewsets.ModelViewSet):
    queryset = DocumentoBaja.objects.all().order_by('-uploaded_at') # Order by most recent
    serializer_class = DocumentoBajaSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] # Enable file uploads

    def get_queryset(self):
        """
        Optionally restricts the returned documents to a given baja,
        by filtering against a `baja_id` query parameter in the URL.
        """
        queryset = super().get_queryset()
        baja_id = self.request.query_params.get('baja_id')
        if baja_id:
            queryset = queryset.filter(baja_id=baja_id)
        return queryset

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        from django.http import FileResponse
        documento = self.get_object()
        if documento.archivo:
            return FileResponse(documento.archivo.open(), as_attachment=True, filename=documento.archivo.name.split('/')[-1])
        return Response(status=404)


@api_view(['GET'])
def generar_oficio_conformidad(request, baja_id):
    baja = get_object_or_404(Baja, id=baja_id)
    
    template_path = "./bajas/Plantilla/plantilla.docx"
    doc = DocxTemplate(template_path)
   
    context = {
        'FECHA_OFICIO': baja.fecha_oficio.strftime('%d de %B del %Y') if baja.fecha_oficio else "__________",
        'FICHA': baja.ficha,
        'NOMBRES': baja.nombre.upper(),
        'FECHA_ULT_DIA': baja.fecha_ultimo_dia_laboral.strftime('%d de %B del %Y'),
        #agrear 1 dia a la fecha efecto
        'FECHA_EFECTO': (baja.fecha_ultimo_dia_laboral + timedelta(days=1)).strftime('%d de %B del %Y'),
        'REPRESENTANTE_PATRONAL': baja.representante_patronal.upper() if baja.representante_patronal else "__________",
    }
    
    # 4. Renderizar el documento
    doc.render(context)
    
    # 5. Guardar en un buffer de memoria para enviarlo por HTTP
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    
    filename = f"Conformidad_{baja.ficha}.docx"
    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    response['Content-Disposition'] = f'attachment; filename={filename}'
    
    return response