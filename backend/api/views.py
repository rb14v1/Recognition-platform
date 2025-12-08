from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q # Needed for search logic
from datetime import timedelta
from django.utils import timezone
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    UserNominationListSerializer, 
    NominationSerializer,
    CustomLoginSerializer,
    TeamMemberSerializer
)
from .models import Nomination

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
        
        # Logic: Get everyone whose role level is LESS than mine
        # We need to manually filter because role_level isn't a DB field, it's a method
        # But we can map roles to the query.
        
        # Get list of roles strictly lower than mine
        allowed_roles = [
            role for role, level in user.ROLE_HIERARCHY.items() 
            if level < my_level
        ]
        
        queryset = User.objects.filter(role__in=allowed_roles).exclude(id=user.id)
        
        # Search filter
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(username__icontains=search_query)
            
        return queryset        
        
class UserProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        # Simply return the user who is currently logged in
        return self.request.user        

class NominationOptionsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserNominationListSerializer

    def get_queryset(self):
        # Start with all users except the one making the request (can't nominate yourself!)
        user = self.request.user
        queryset = User.objects.exclude(id=user.id).exclude(role='ADMIN')
        # 1. Search by Name (Username)
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(username__icontains=search_query)

        # 2. Filter by Employee Dept
        dept_filter = self.request.query_params.get('dept', None)
        if dept_filter:
            queryset = queryset.filter(employee_dept__iexact=dept_filter)

        # 3. Filter by Employee Role (Job Title)
        role_filter = self.request.query_params.get('role', None)
        if role_filter:
            queryset = queryset.filter(employee_role__iexact=role_filter)

        return queryset

# NEW: The Action to Submit Nomination
class CreateNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # 1. Check if user already nominated someone
        if Nomination.objects.filter(nominator=request.user).exists():
            return Response(
                {"error": "You have already nominated someone. You can only nominate 1 person."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Serialize and Save
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
        team = request.user.team_members.all()
        serializer = TeamMemberSerializer(team, many=True)
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
        
        # Promotion Logic: Coordinator can promote Employee -> Coordinator
        if request.data.get('promote_to_coordinator'):
            member.role = User.COORDINATOR
        
        member.save()
        return Response({"message": "Member updated successfully"})

# 3. NOMINATION REVIEW (List & Action)
# views.py

class CoordinatorNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Check if frontend wants history or pending
        filter_type = request.query_params.get('filter', 'pending') # default to pending

        base_query = Nomination.objects.filter(nominee__manager=request.user).select_related('nominee', 'nominator')

        if filter_type == 'history':
            # Show what I have already acted upon
            nominations = base_query.filter(status__in=['APPROVED', 'REJECTED']).order_by('-submitted_at')
        else:
            # Show what is waiting for me
            nominations = base_query.filter(status='SUBMITTED').order_by('-submitted_at')

        data = [{
            "id": n.id,
            "nominee_name": n.nominee.username,
            "nominator_name": n.nominator.username,
            "reason": n.reason,
            "submitted_at": n.submitted_at,
            "status": n.status, # Added status so frontend knows if it was approved/rejected
            "nominee_role": n.nominee.employee_role or "Employee",
        } for n in nominations]
        
        return Response(data)

    def post(self, request):
        nom_id = request.data.get('nomination_id')
        action = request.data.get('action') # 'APPROVE' or 'REJECT'

        try:
            # Strict Team Check: I can only approve my own team's nominations
            nom = Nomination.objects.get(id=nom_id, nominee__manager=request.user)
            
            nom.status = 'APPROVED' if action == 'APPROVE' else 'REJECTED'
            nom.save()
            return Response({"message": f"Nomination {action}D"})
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found or not in your team"}, status=404)
                
class UnassignedEmployeesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # SEARCH: Find employees with NO manager
        search_query = request.query_params.get('search', '').strip()
        search_type = request.query_params.get('type', 'name') # 'name' or 'id'
        
        queryset = User.objects.filter(
            manager__isnull=True, 
            role='EMPLOYEE'
        ).exclude(id=request.user.id)

        if search_query:
            if search_type == 'id':
                queryset = queryset.filter(employee_id__icontains=search_query)
            else:
                queryset = queryset.filter(username__icontains=search_query)

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
        