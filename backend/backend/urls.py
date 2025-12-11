"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from login_register.views import RegisterView, UserListView, GroupListView, user_profile, change_password, user_detail
from django.conf import settings            
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', RegisterView.as_view(), name='register'),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', UserListView.as_view(), name='user_list'),
    path('api/groups/', GroupListView.as_view(), name='group-list'),
    path('api/user/<int:user_id>/', user_detail, name='user_detail'),
    path('api/user/profile/', user_profile, name='user_profile'),
    path('api/user/change-password/', change_password, name='change_password'),

    path('api/investigaciones/', include('investigaciones.urls')),
    path('api/auditoria/', include('auditoria.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)