from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from login_register.views import RegisterView, UserListView, GroupListView, user_profile, change_password, user_detail, admin_reset_password
from django.conf import settings            
from django.conf.urls.static import static

from django.views.static import serve
from django.views.decorators.clickjacking import xframe_options_exempt
from login_register.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/register/', RegisterView.as_view(), name='register'),

    path("api/token/", CustomTokenObtainPairView.as_view(), name="token"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', UserListView.as_view(), name='user_list'),
    path('api/groups/', GroupListView.as_view(), name='group-list'),
    path('api/user/<int:user_id>/', user_detail, name='user_detail'),
    path('api/user/profile/', user_profile, name='user_profile'),
    path('api/user/change-password/', change_password, name='change_password'),
    path('api/users/<int:user_id>/reset-password/', admin_reset_password),

    path('api/investigaciones/', include('investigaciones.urls')),
    path('api/auditoria/', include('auditoria.urls')),
    path('api/investigadores/', include('investigadores.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', xframe_options_exempt(serve), {
            'document_root': settings.MEDIA_ROOT,
        }),
    ]