from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'management', views.InvestigadorViewSet, basename='investigador')
# The base URL will be /api/investigadores/management/

urlpatterns = [
    path('', include(router.urls)),
    path('constancias/<str:filename>/', views.serve_constancia, name='serve_constancia'),
    path('check-constancia/<str:filename>/', views.check_constancia, name='check_constancia'),
]
