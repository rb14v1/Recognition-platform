from django.urls import path
from .views import (
    RegisterView,
    CustomLoginView,
    UserProfileView,
    NominationOptionsView,
    CreateNominationView,
    NominationStatusView,
    ManageNominationView,
    CoordinatorNominationView,
    VotingView,
    AdminResultsView,
    WinnersView,
    NotificationListView,UserManagementView,NominationAIAnalysisView,StarAwardExportView,
    NotificationMarkReadView,AdminAnalyticsView, AdminReportExportView, NominationOptionsDataView, NominationFilterOptionsView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    
    # Auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User
    path('me/', UserProfileView.as_view(), name='user_profile'),
    
    # Nominations
    path('nominate/filter-options/', NominationFilterOptionsView.as_view(), name='nominate-filters'),
    path('nominate/list/', NominationOptionsView.as_view(), name='nominate_list'),
    path('nominate/submit/', CreateNominationView.as_view(), name='nominate_submit'),
    path('nominate/status/', NominationStatusView.as_view(), name='nominate_status'),
    path('nominate/action/', ManageNominationView.as_view(), name='nominate_action'),
    
    # Coordinator
    path('coordinator/nominations/', CoordinatorNominationView.as_view(), name='coordinator_nominations'),
    path('nominate/options-data/', NominationOptionsDataView.as_view(), name='nominate_action'),
 
    
    # Voting & Admin
    path('voting/finalists/', VotingView.as_view(), name='voting_list'),
    path('admin/results/', AdminResultsView.as_view(), name='admin_results'),
    path('admin/winners/', WinnersView.as_view(), name='all_winners'),
    path('admin/manage-users/', UserManagementView.as_view(), name='manage_users'),
    # Notifications 
    path('notifications/', NotificationListView.as_view()),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view()),

    # Analytics
    path("admin/analytics/", AdminAnalyticsView.as_view()),
    path("admin/report/", AdminReportExportView.as_view()),
    path('nominations/ai-analysis/', NominationAIAnalysisView.as_view(), name='ai-analysis'),
    path('nomination/export-star-awards/', StarAwardExportView.as_view(), name='export-star-awards'),

 
]
