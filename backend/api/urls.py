from django.urls import path
from .views import (
    RegisterView, 
    CustomLoginView,
    PromoteUserView, 
    UserProfileView,
    NominationOptionsView,
    CreateNominationView,
    NominationStatusView,ManageNominationView, NominationStatusView, NominationOptionsView,UnassignedEmployeesView, PromotableUsersView, TeamMemberDetailView, CoordinatorTeamView, CoordinatorNominationView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('promote/', PromoteUserView.as_view(), name='promote_user'),
    path('coordinator/promote-list/', PromotableUsersView.as_view()),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('nominate/list/', NominationOptionsView.as_view(), name='nominate_list'), 
    path('nominate/submit/', CreateNominationView.as_view(), name='nominate_submit'),
    path('nominate/status/', NominationStatusView.as_view(), name='nominate_status'),
    path('nominate/action/', ManageNominationView.as_view(), name='nominate_action'),
    path('coordinator/nominations/', CoordinatorNominationView.as_view(), name='coordinator_nominations'),
    path('coordinator/team/add/', UnassignedEmployeesView.as_view(), name='coord_add_team'),
    path('coordinator/team/', CoordinatorTeamView.as_view(), name='coordinator_team'),
    path('coordinator/team/<int:pk>/', TeamMemberDetailView.as_view(), name='team_member_detail')
]