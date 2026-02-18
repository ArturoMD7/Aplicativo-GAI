from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BajaViewSet, DocumentoBajaViewSet, generar_oficio_conformidad

router = DefaultRouter()
router.register(r'bajas', BajaViewSet)
router.register(r'documentos-bajas', DocumentoBajaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('bajas/<int:baja_id>/generar-oficio/', generar_oficio_conformidad, name='generar-oficio'),
]
