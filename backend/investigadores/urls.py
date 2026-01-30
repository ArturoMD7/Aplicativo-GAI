from django.urls import path
from . import views

urlpatterns = [
    path('constancias/<str:filename>/', views.serve_constancia, name='serve_constancia'),
    path('check-constancia/<str:filename>/', views.check_constancia, name='check_constancia'),
]
