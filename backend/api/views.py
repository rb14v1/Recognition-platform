from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count # Needed for search logic
from .models import Vote
from datetime import timedelta
from django.utils import timezone
from .serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserNominationListSerializer,
    NominationSerializer,
    CustomLoginSerializer,
    TeamMemberSerializer,
    AdminVoteResultSerializer,
    FinalistSerializer,
    NominationTimelineSerializer
)
from .models import Nomination, NominationTimeline
 
User = get_user_model()
 
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer
 
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomLoginSerializer
   
class PromoteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def post(self, request):
        target_id = request.data.get('user_id_to_promote')
        new_role = request.data.get('new_role')
 
        # 1. Get the target user first
        try:
            target_user = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
 
        # 2. Ask the Model if this is allowed (Passing the target_user object)
        is_allowed, message = request.user.can_promote(target_user, new_role)
 
        if not is_allowed:
            return Response({"error": message}, status=status.HTTP_403_FORBIDDEN)
 
        # 3. Execute
        target_user.role = new_role
        target_user.save()
 
        return Response({
            "message": f"Success! {target_user.username} is now a {new_role}."
        })
 
class PromotableUsersView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeamMemberSerializer # Reusing existing serializer
 
    def get_queryset(self):
        user = self.request.user
        my_level = user.get_role_level()
       
        # 1. Hierarchy Logic: Only show people with lower rank
        allowed_roles = [
            role for role, level in user.ROLE_HIERARCHY.items()
            if level < my_level
        ]
        queryset = User.objects.filter(role__in=allowed_roles).exclude(id=user.id)
       
        # 2. Search (Name OR ID)
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) | 
                Q(employee_id__icontains=search_query)
            )

        # 3. Filter: Department
        dept = self.request.query_params.get('dept')
        if dept:
            queryset = queryset.filter(employee_dept__iexact=dept)

        # 4. Filter: Job Role
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(employee_role__iexact=role)

        # 5. Filter: Location
        loc = self.request.query_params.get('location')
        if loc:
            queryset = queryset.filter(location__iexact=loc)
           
        return queryset        
       
class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer
 
    def get_object(self):
        # Returns the current user so they can PATCH their own data
        return self.request.user      
 
class NominationOptionsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserNominationListSerializer
 
    def get_queryset(self):
        # Start with all users except the one making the request
        user = self.request.user
        queryset = User.objects.exclude(id=user.id).exclude(role='ADMIN')

        # 1. Search by Name OR Employee ID (Unified Search)
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) | 
                Q(employee_id__icontains=search_query)
            )
 
        # 2. Filter by Employee Dept
        dept_filter = self.request.query_params.get('dept', None)
        if dept_filter:
            queryset = queryset.filter(employee_dept__iexact=dept_filter)
 
        # 3. Filter by Employee Role (Job Title)
        role_filter = self.request.query_params.get('role', None)
        if role_filter:
            queryset = queryset.filter(employee_role__iexact=role_filter)

        # 4. Filter by Location (NEW)
        loc_filter = self.request.query_params.get('location', None)
        if loc_filter:
            queryset = queryset.filter(location__iexact=loc_filter)
 
        return queryset
    
def check_timeline_validity(phase):
    """
    Checks if the current time falls within the allowed window for a specific phase.
    Phases: 'NOMINATION', 'COORDINATOR', 'COMMITTEE', 'VOTING', 'ADMIN_RESULTS'
    """
    now = timezone.now()
    timeline = NominationTimeline.objects.filter(is_active=True).first()

    if not timeline:
        return False, "No active nomination cycle found. Please contact Admin."

    if phase == 'NOMINATION':
        if not (timeline.nomination_start <= now <= timeline.nomination_end):
            return False, f"Nominations are closed. Open from {timeline.nomination_start.date()} to {timeline.nomination_end.date()}"

    elif phase == 'COORDINATOR':
        if now < timeline.coordinator_start:
            return False, "Coordinator review has not started yet. Please wait for the nomination period to end."
        if now > timeline.coordinator_end:
            return False, "Coordinator review window has closed."

    elif phase == 'COMMITTEE':
        if now < timeline.committee_start:
            return False, "Committee review has not started yet. Waiting for Coordinators to finish."
        if now > timeline.committee_end:
            return False, "Committee selection window has closed."

    elif phase == 'VOTING':
        if now < timeline.voting_start:
            return False, "Voting has not begun yet."
        if now > timeline.voting_end:
            return False, "Voting is closed."
            
    elif phase == 'ADMIN_RESULTS':
        # Admin can only declare winners AFTER voting ends
        if now <= timeline.voting_end:
            return False, "Cannot declare winners yet. Voting is still in progress."

    return True, "Allowed"    
 
# NEW: The Action to Submit Nomination
# 1. NOMINATING (Employees)
class CreateNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def post(self, request):
        # 🔥 TIME CHECK
        is_valid, msg = check_timeline_validity('NOMINATION')
        if not is_valid:
            return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

        # Existing Logic
        if Nomination.objects.filter(nominator=request.user).exists():
            return Response(
                {"error": "You have already nominated someone. You can only nominate 1 person."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        serializer = NominationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Nomination submitted successfully!"}, status=status.HTTP_201_CREATED)
       
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
     
class NominationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        user = request.user
       
        # 1. Check if I have nominated anyone
        my_nomination = Nomination.objects.filter(nominator=user).first()
       
        # 2. Check if I have received nominations (Count only, for anonymity)
        received_count = Nomination.objects.filter(nominee=user).count()
        nominee_data = None
        current_reason = None
        if my_nomination:
            nominee_data = UserNominationListSerializer(my_nomination.nominee).data
            current_reason = my_nomination.reason
 
        return Response({
            "has_nominated": my_nomination is not None,
            "nominee": nominee_data,
            "nominee_name": my_nomination.nominee.username if my_nomination else None,
            "reason": current_reason,
            "nominee_id": my_nomination.nominee.id if my_nomination else None,
            "nomination_date": my_nomination.submitted_at if my_nomination else None,
            "nominations_received_count": received_count
        })    
 
EDIT_WINDOW_DAYS = 2
 
class ManageNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get_my_nomination(self, user):
        return Nomination.objects.filter(nominator=user).first()
 
    # 1. SUBMIT (Create)
    def post(self, request):
        if Nomination.objects.filter(nominator=request.user).exists():
            return Response({"error": "You have already nominated someone."}, status=status.HTTP_400_BAD_REQUEST)
       
        serializer = NominationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Nomination submitted successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    # 2. UPDATE (Edit Reason or Nominee)
    def put(self, request):
        nomination = self.get_my_nomination(request.user)
        if not nomination:
            return Response({"error": "No nomination found to edit."}, status=status.HTTP_404_NOT_FOUND)
 
        # Time Check
        time_elapsed = timezone.now() - nomination.submitted_at
        if time_elapsed > timedelta(days=EDIT_WINDOW_DAYS):
            return Response({"error": "The editing window for this nomination has closed."}, status=status.HTTP_403_FORBIDDEN)
 
        # Update logic
        serializer = NominationSerializer(nomination, data=request.data, context={'request': request}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Nomination updated successfully!"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    # 3. DELETE (Withdraw)
    def delete(self, request):
        nomination = self.get_my_nomination(request.user)
        if not nomination:
            return Response({"error": "No nomination found."}, status=status.HTTP_404_NOT_FOUND)
 
        # Time Check
        time_elapsed = timezone.now() - nomination.submitted_at
        if time_elapsed > timedelta(days=EDIT_WINDOW_DAYS):
            return Response({"error": "Cannot delete. The time window has closed."}, status=status.HTTP_403_FORBIDDEN)
 
        nomination.delete()
        return Response({"message": "Nomination withdrawn successfully."})        
   
class CoordinatorTeamView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        # Base: Get direct reports
        queryset = request.user.team_members.all()
 
        # 1. Unified Search (Name OR ID)
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) | 
                Q(employee_id__icontains=search_query)
            )

        # 2. Filter: Department
        dept = request.query_params.get('dept')
        if dept:
            queryset = queryset.filter(employee_dept__iexact=dept)

        # 3. Filter: Job Role
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(employee_role__iexact=role)

        # 4. Filter: Location
        loc = request.query_params.get('location')
        if loc:
            queryset = queryset.filter(location__iexact=loc)
 
        serializer = TeamMemberSerializer(queryset, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        data = request.data
        try:
            # Create user and assign CURRENT user as manager
            User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                employee_id=data['employee_id'],
                role=User.EMPLOYEE,
                manager=request.user
            )
            return Response({"message": "Employee added to your team!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
 
# 2. UPDATE EMPLOYEE (Add Dept/Title or Promote)
class TeamMemberDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def put(self, request, pk):
        try:
            member = User.objects.get(id=pk, manager=request.user)
        except User.DoesNotExist:
            return Response({"error": "Member not found in your team"}, status=404)
 
        member.employee_dept = request.data.get('employee_dept', member.employee_dept)
        member.employee_role = request.data.get('employee_role', member.employee_role)
       
        member.save()
        return Response({"message": "Member updated successfully"})
 
# 2. UPDATED: Smart Nomination View for both Coordinators and Committee
# 1. NOMINATIONS (The Pipeline Logic)
# 2. APPROVALS (Coordinators & Committee)
class CoordinatorNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        # (GET logic remains the same as your previous code, no time check needed for VIEWING)
        filter_type = request.query_params.get('filter', 'pending')
        user_role = request.user.role
        query = Nomination.objects.select_related('nominee', 'nominator').order_by('-submitted_at')
 
        if user_role == 'COMMITTEE':
            if filter_type == 'history':
                nominations = query.filter(status__in=['COMMITTEE_APPROVED', 'REJECTED', 'AWARDED'])
            else:
                nominations = query.filter(status='APPROVED')
        else:
            # Coordinator
            if filter_type == 'history':
                nominations = query.filter(nominee__manager=request.user, status__in=['APPROVED', 'REJECTED', 'COMMITTEE_APPROVED', 'AWARDED'])
            else:
                nominations = query.filter(nominee__manager=request.user, status='SUBMITTED') 

        data = [{
            "id": n.id,
            "nominee_name": n.nominee.username,
            "nominee_role": n.nominee.employee_role or "Employee",
            "nominee_dept": n.nominee.employee_dept or "General",
            "nominator_name": n.nominator.username,
            "reason": n.reason,
            "submitted_at": n.submitted_at,
            "status": n.status
        } for n in nominations]
        return Response(data)
 
    def post(self, request):
        nom_id = request.data.get('nomination_id')
        action = request.data.get('action')
        user_role = request.user.role
 
        try:
            nom = Nomination.objects.get(id=nom_id)
 
            # --- COORDINATOR LOGIC ---
            if user_role == 'COORDINATOR':
                # 🔥 TIME CHECK
                is_valid, msg = check_timeline_validity('COORDINATOR')
                if not is_valid:
                    return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

                if nom.nominee.manager != request.user:
                    return Response({"error": "Not your team member"}, status=403)
                nom.status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
 
            # --- COMMITTEE LOGIC ---
            elif user_role == 'COMMITTEE':
                # 🔥 TIME CHECK
                is_valid, msg = check_timeline_validity('COMMITTEE')
                if not is_valid:
                    return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

                if nom.status != 'APPROVED':
                    return Response({"error": "Not ready for review"}, status=400)
 
                if action == 'APPROVE':
                    current_finalists = Nomination.objects.filter(status='COMMITTEE_APPROVED').count()
                    if current_finalists >= 15:
                        return Response({"error": "Finalist limit reached (Max 15)."}, status=400)
                    nom.status = 'COMMITTEE_APPROVED'
                else:
                    nom.status = 'REJECTED'
            
            # (Admin Logic removed from here, moved to specific endpoint or results view)
            
            nom.save()
            return Response({"message": f"Status updated to {nom.status}"})
 
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found"}, status=404)
                                               
class UnassignedEmployeesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        # Base Query: Find employees with NO manager
        queryset = User.objects.filter(
            manager__isnull=True,
            role='EMPLOYEE'
        ).exclude(id=request.user.id)
 
        # 1. Unified Search (Name OR Employee ID)
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) | 
                Q(employee_id__icontains=search_query)
            )

        # 2. Filter by Dept
        dept_filter = request.query_params.get('dept', None)
        if dept_filter:
            queryset = queryset.filter(employee_dept__iexact=dept_filter)

        # 3. Filter by Role (Job Title)
        role_filter = request.query_params.get('role', None)
        if role_filter:
            queryset = queryset.filter(employee_role__iexact=role_filter)

        # 4. Filter by Location
        loc_filter = request.query_params.get('location', None)
        if loc_filter:
            queryset = queryset.filter(location__iexact=loc_filter)
 
        # Use TeamMemberSerializer since it has the fields we need
        serializer = TeamMemberSerializer(queryset, many=True)
        return Response(serializer.data)
 
    def post(self, request):
        # CLAIM: Link selected users to the current Coordinator
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({"error": "No users selected"}, status=status.HTTP_400_BAD_REQUEST)
 
        # Security: Only claim users who actually have no manager
        users_to_update = User.objects.filter(id__in=user_ids, manager__isnull=True)
        updated_count = users_to_update.update(manager=request.user)
       
        return Response({"message": f"Successfully added {updated_count} employees to your team."})
       
class VotingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        # (GET remains same)
        has_voted = Vote.objects.filter(voter=request.user).exists()
        finalists = Nomination.objects.filter(status='COMMITTEE_APPROVED')
        serializer = FinalistSerializer(finalists, many=True)
        return Response({"has_voted": has_voted, "finalists": serializer.data})
 
    def post(self, request):
        # 🔥 TIME CHECK
        is_valid, msg = check_timeline_validity('VOTING')
        if not is_valid:
            return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role == 'ADMIN':
             return Response({"error": "Admins cannot vote."}, status=403)
 
        if Vote.objects.filter(voter=request.user).exists():
            return Response({"error": "You have already cast your vote."}, status=400)
 
        nomination_id = request.data.get('nomination_id')
        try:
            nom = Nomination.objects.get(id=nomination_id, status='COMMITTEE_APPROVED')
            Vote.objects.create(voter=request.user, nomination=nom)
            return Response({"message": "Vote cast successfully!"})
        except Nomination.DoesNotExist:
            return Response({"error": "Invalid finalist selected."}, status=404)
         
 
# 3. NEW: Admin Results View
class AdminResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
 
        results = Nomination.objects.filter(
            status__in=['COMMITTEE_APPROVED', 'AWARDED']
        ).annotate(vote_count=Count('votes')).order_by('-vote_count')
 
        serializer = AdminVoteResultSerializer(results, many=True)
        return Response(serializer.data)

    # 🔥 NEW: Endpoint to finalize winners
    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        # 🔥 TIME CHECK
        is_valid, msg = check_timeline_validity('ADMIN_RESULTS')
        if not is_valid:
            return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

        # Logic to mark winner
        winner_id = request.data.get('nomination_id')
        try:
            winner = Nomination.objects.get(id=winner_id)
            winner.status = 'AWARDED'
            winner.save()
            return Response({"message": "Winner declared!"})
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found"}, status=404)
        
class AdminTimelineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        
        # Get the active timeline, or the latest one
        timeline = NominationTimeline.objects.filter(is_active=True).first()
        if not timeline:
            return Response({"message": "No active timeline found.", "data": None})
        
        serializer = NominationTimelineSerializer(timeline)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        # Deactivate any existing active timelines first to keep it clean
        NominationTimeline.objects.filter(is_active=True).update(is_active=False)

        serializer = NominationTimelineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(is_active=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)        