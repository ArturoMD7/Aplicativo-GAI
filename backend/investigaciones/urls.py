from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.InvestigacionViewSet, basename='investigacion')

urlpatterns = [
    path('', include(router.urls)),
    
    # Endpoints adicionales para opciones y búsquedas
    path('opciones/', views.InvestigacionViewSet.as_view({'get': 'opciones'}), name='investigacion-opciones'),
    path('buscar-empleado/', views.InvestigacionViewSet.as_view({'get': 'buscar_empleado'}), name='buscar-empleado'),
    path('centros-trabajo/', views.InvestigacionViewSet.as_view({'get': 'centros_trabajo'}), name='centros-trabajo'),
    path('centros-coduni/', views.InvestigacionViewSet.as_view({'get': 'centros_coduni'}), name='centros-coduni'),
    path('areas-por-centro/', views.InvestigacionViewSet.as_view({'get': 'areas_por_centro'}), name='areas-por-centro'),
    path('estadisticas/', views.InvestigacionViewSet.as_view({'get': 'estadisticas'}), name='estadisticas'),
]