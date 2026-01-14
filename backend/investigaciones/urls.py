from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'investigaciones', views.InvestigacionViewSet, basename='investigacion')
router.register(r'documentos', views.DocumentoInvestigacionViewSet, basename='documentos')

urlpatterns = [
    path('', include(router.urls)),
    
    path('opciones/', views.opciones_view, name='investigacion-opciones'),
    path('buscar-empleado/', views.buscar_empleado_view, name='buscar-empleado'),
    path('centros-trabajo/', views.centros_trabajo_view, name='centros-trabajo'),
    path('centros-coduni/', views.centros_coduni_view, name='centros-coduni'),
    path('areas-por-centro/', views.areas_por_centro_view, name='areas-por-centro'),
    path('estadisticas/', views.estadisticas_view, name='estadisticas'),
    path('buscar-gerente-responsable/', views.buscar_gerente_responsable_view, name='buscar-gerente-responsable'),
    path('validar-investigador/', views.validar_investigador_view, name='validar_investigador'),
]