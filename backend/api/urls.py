from django.urls import path
from .views import (
    RegisterView, 
    PromoteUserView, 
    UserProfileView,
    NominationOptionsView,
    CreateNominationView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('promote/', PromoteUserView.as_view(), name='promote_user'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('nominate/list/', NominationOptionsView.as_view(), name='nominate_list'), 
    path('nominate/submit/', CreateNominationView.as_view(), name='nominate_submit'),
]