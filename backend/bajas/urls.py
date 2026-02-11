from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BajaViewSet

router = DefaultRouter()
router.register(r'bajas', BajaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
