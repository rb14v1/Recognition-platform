from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count # Needed for search logic
from .models import Vote,Notification
from datetime import timedelta
from django.db.models import Count, F, Value
from openpyxl import Workbook
from django.db.models.functions import TruncMonth, TruncDate,Concat
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
from .models import Nomination, NominationTimeline, NOMINATION_CRITERIA
from .serializers import NotificationSerializer

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
    return True, "Allowed"
   
def send_notification(user, message):
    from .models import Notification
    Notification.objects.create(user=user, message=message)

# NEW: The Action to Submit Nomination
# 1. NOMINATING (Employees)
class CreateNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def post(self, request):
        # 🔥 TIME CHECK
        is_valid, msg = check_timeline_validity('NOMINATION')
        if not is_valid:
            return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)
 
        # Check Exists
        if Nomination.objects.filter(nominator=request.user).exists():
            return Response(
                {"error": "You have already nominated someone. You can only nominate 1 person."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        # Pass request context for validation
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
 
class NominationOptionsDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        # Sends the structure { "Category": ["Metric1", "Metric2"], ... }
        return Response(NOMINATION_CRITERIA) 
class ManageNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def is_locked(self, nomination):
        return nomination.status != 'SUBMITTED'
 
    def get_my_nomination(self, user):
        return Nomination.objects.filter(nominator=user).order_by('-submitted_at').first()
 
    # ✅ CREATE NOMINATION
    def post(self, request):
        # Prevent multiple nominations
        if Nomination.objects.filter(nominator=request.user).exists():
            return Response(
                {"error": "You have already nominated someone."},
                status=status.HTTP_400_BAD_REQUEST
            )
 
        serializer = NominationSerializer(
            data=request.data,
            context={'request': request}
        )
 
        if serializer.is_valid():
            # 🔥 FIX: Explicitly pass the nominator here to prevent IntegrityError
            nomination = serializer.save(nominator=request.user)
 
            # 🔔 SEND NOTIFICATION
            send_notification(
                nomination.nominee,
                f"🎉 You have been nominated by {request.user.username}!"
            )
 
            return Response(
                {"message": "Nomination submitted successfully!"},
                status=status.HTTP_201_CREATED
            )
 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    # UPDATE
    def put(self, request):
        nomination = self.get_my_nomination(request.user)
        if not nomination:
            return Response({"error": "No nomination found to edit."}, status=404)
 
        # 🚫 Lock after authority review
        if self.is_locked(nomination):
            return Response(
                {"error": "This nomination has already been reviewed by an authority and cannot be edited."},
                status=403
            )
 
        serializer = NominationSerializer(
            nomination,
            data=request.data,
            context={'request': request},
            partial=True
        )
 
        if serializer.is_valid():
            serializer.save() # No need to pass nominator on update
            return Response({"message": "Nomination updated successfully!"})
 
        return Response(serializer.errors, status=400)
 
    # DELETE
    def delete(self, request):
        nomination = self.get_my_nomination(request.user)
        if not nomination:
            return Response({"error": "No nomination found."}, status=404)
 
        # 🚫 Lock after authority review
        if self.is_locked(nomination):
            return Response(
                {"error": "Cannot withdraw. This nomination has already been reviewed by an authority."},
                status=403
            )
 
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
 

# -----------------------------------------
# UPDATED VIEW
# -----------------------------------------
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from .models import Nomination
from .utils import send_notification   # <-- make sure you created this function!


class CoordinatorNominationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get("filter", "pending")
        user_role = request.user.role

        query = Nomination.objects.select_related("nominee", "nominator").order_by("-submitted_at")

        # COMMITTEE VIEW
        if user_role == "COMMITTEE":
            if filter_type == "history":
                nominations = query.filter(status__in=["COMMITTEE_APPROVED", "REJECTED", "AWARDED"])
            else:
                nominations = query.filter(status="APPROVED")

        # COORDINATOR VIEW
        else:
            if filter_type == "history":
                nominations = query.filter(
                    nominee__manager=request.user,
                    status__in=["APPROVED", "REJECTED", "COMMITTEE_APPROVED", "AWARDED"]
                )
            else:
                nominations = query.filter(nominee__manager=request.user, status="SUBMITTED")

        data = [
            {
                "id": n.id,
                "nominee_id": n.nominee.id,
                "nominee_name": n.nominee.username,
                "nominee_role": n.nominee.employee_role or "Employee",
                "nominee_dept": n.nominee.employee_dept or "General",
                "nominator_name": n.nominator.username,
                "reason": n.reason,
                "submitted_at": n.submitted_at,
                "status": n.status,
            }
            for n in nominations
        ]

        return Response(data)

    # --------------------------------------------------------
    # POST → APPROVE / REJECT / UNDO + Notification
    # --------------------------------------------------------
    def post(self, request):
        nom_id = request.data.get("nomination_id")
        action = request.data.get("action")
        user_role = request.user.role

        if action not in ("APPROVE", "REJECT", "UNDO"):
            return Response({"error": "Invalid action"}, status=400)

        try:
            nom = Nomination.objects.select_related("nominee").get(id=nom_id)
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found"}, status=404)

        nominee = nom.nominee  # who receives notifications

        # ======================================================
        # 🔥 ADMIN LOGIC
        # ======================================================
        if user_role == "ADMIN":
            if action == "APPROVE":
                updated = Nomination.objects.filter(nominee=nominee).update(status="AWARDED")
                send_notification(nominee, "🎉 Congratulations! You have won the award.")
                return Response({"message": f"{updated} row(s) marked AWARDED"})

            elif action == "REJECT":
                updated = Nomination.objects.filter(nominee=nominee).update(status="REJECTED")
                send_notification(nominee, "Your nomination was rejected by the admin.")
                return Response({"message": f"{updated} row(s) rejected"})

            elif action == "UNDO":
                updated = Nomination.objects.filter(nominee=nominee, status="AWARDED") \
                                            .update(status="COMMITTEE_APPROVED")
                send_notification(nominee, "Your award result was reverted back to finalist stage.")
                return Response({"message": "Reverted back to finalist stage"})

        # ======================================================
        # 🔥 COORDINATOR LOGIC
        # ======================================================
        if user_role == "COORDINATOR":
            if nominee.manager != request.user:
                return Response({"error": "Not your team member"}, status=403)

            if action == "APPROVE":
                updated = Nomination.objects.filter(nominee=nominee, status="SUBMITTED") \
                                            .update(status="APPROVED")
                if updated:
                    send_notification(nominee, "Your nomination was approved by your coordinator.")
                return Response({"message": f"{updated} nomination(s) approved"})

            elif action == "REJECT":
                updated = Nomination.objects.filter(nominee=nominee, status="SUBMITTED") \
                                            .update(status="REJECTED")
                if updated:
                    send_notification(nominee, "Your nomination was rejected by your coordinator.")
                return Response({"message": f"{updated} nomination(s) rejected"})

        # ======================================================
        # 🔥 COMMITTEE LOGIC
        # ======================================================
        if user_role == "COMMITTEE":

            approved_count = Nomination.objects.filter(nominee=nominee, status="APPROVED").count()
            if approved_count == 0:
                return Response({"error": "No coordinator-approved nominations found"}, status=400)

            if action == "APPROVE":
                finalist_count = (
                    Nomination.objects.filter(status="COMMITTEE_APPROVED")
                    .values("nominee")
                    .distinct()
                    .count()
                )
                if finalist_count >= 15:
                    return Response({"error": "Finalist limit reached"}, status=400)

                updated = Nomination.objects.filter(nominee=nominee, status="APPROVED") \
                                            .update(status="COMMITTEE_APPROVED")

                send_notification(nominee, "🎉 You have been selected as a finalist!")
                return Response({"message": f"{updated} nomination(s) marked as FINALIST"})

            elif action == "REJECT":
                updated = Nomination.objects.filter(nominee=nominee, status="APPROVED") \
                                            .update(status="REJECTED")

                send_notification(nominee, "Your nomination was rejected by the committee.")
                return Response({"message": f"{updated} nomination(s) rejected"})

        return Response({"error": "Unauthorized"}, status=403)


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = request.user.notifications.all()
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, user=request.user)
            notif.is_read = True
            notif.save()
            return Response({"message": "Notification marked as read"})
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found"}, status=404)


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
        has_voted = Vote.objects.filter(voter=request.user).exists()
 
        # Fetch all approved nominations
        finalists = Nomination.objects.filter(status="COMMITTEE_APPROVED")
 
        # --------------------------------------------------------
        # 🔥 REMOVE DUPLICATES — only unique nominee.id remains
        # --------------------------------------------------------
        unique = {}
        for r in finalists:
            nominee_id = r.nominee.id
            if nominee_id not in unique:
                unique[nominee_id] = r
 
        finalists = list(unique.values())
        # --------------------------------------------------------
 
        return Response({
            "has_voted": has_voted,
            "finalists": FinalistSerializer(finalists, many=True).data
        })
 
    def post(self, request):
 
        if request.user.role == "ADMIN":
            return Response({"error": "Admins cannot vote."}, status=403)
 
        if Vote.objects.filter(voter=request.user).exists():
            return Response({"error": "You already voted."}, status=400)
 
        nom_id = request.data.get("nomination_id")
 
        try:
            nom = Nomination.objects.get(id=nom_id, status="COMMITTEE_APPROVED")
            Vote.objects.create(voter=request.user, nomination=nom)
            return Response({"message": "Vote submitted!"})
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
        ).annotate(
            vote_count=Count('votes')
        ).order_by('-vote_count')  
        # 🔥 NEW: remove duplicates by nominee
        unique = {}
        for r in results:
            if r.nominee.id not in unique:
                unique[r.nominee.id] = r
    
        results = list(unique.values())
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
    

 
class WinnersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
 
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)  
        coordinator_winners = Nomination.objects.filter(
            status__in=['APPROVED', 'COMMITTEE_APPROVED', 'AWARDED']
        )    
        committee_winners = Nomination.objects.filter(
            status__in=['COMMITTEE_APPROVED', 'AWARDED']
        )  
        final_winner = Nomination.objects.filter(status='AWARDED').first()  
        # 🔥 REMOVE DUPLICATES — GROUP BY NOMINEE
        def dedupe(queryset):
            unique = {}
            for n in queryset:
                if n.nominee.id not in unique:
                    unique[n.nominee.id] = n
            return list(unique.values())  
        coordinator_winners = dedupe(coordinator_winners)
        committee_winners = dedupe(committee_winners)  
        def serialize_nom(n):
            return {
                "username": n.nominee.username,
                "employee_id": n.nominee.employee_id,
                "employee_role": n.nominee.employee_role,
                "employee_dept": n.nominee.employee_dept,
            }  
        return Response({
            "final_winner": serialize_nom(final_winner) if final_winner else None,
            "committee_winners": [serialize_nom(n) for n in committee_winners],
            "coordinator_winners": [serialize_nom(n) for n in coordinator_winners],
        })

# ========================= ANALYTICS (DASHBOARD) =========================
class AdminAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)

        total_nominations = Nomination.objects.count()
        coordinator_approved = Nomination.objects.filter(
            status__in=[
                'APPROVED',
                'COMMITTEE_APPROVED',
                'AWARDED',
                'REJECTED'
            ]
        ).count()
        total_rejections = Nomination.objects.filter(status='REJECTED').count()
        total_employees = User.objects.filter(role='EMPLOYEE').count()
        employees_who_nominated = Nomination.objects.values('nominator').distinct().count()
        employees_not_nominated = total_employees - employees_who_nominated
 

        committee_finalists = Nomination.objects.filter(status='COMMITTEE_APPROVED').count()
        final_winner = (Nomination.objects.filter(status='AWARDED').values('nominee').distinct().count())


        dept_stats = (
            Nomination.objects
            .values('nominee__employee_dept')
            .annotate(count=Count('id'))
        )

        department_stats = [
            {"department": d['nominee__employee_dept'] or "Unknown", "count": d['count']}
            for d in dept_stats
        ]

        daily_trend = (
            Nomination.objects
            .annotate(day=TruncDate("submitted_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        daily_trend_data = [{"date": d["day"], "count": d["count"]} for d in daily_trend]

        monthly_trend = (
            Nomination.objects
            .annotate(month=TruncMonth("submitted_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        trend_data = [{"month": m["month"].strftime("%Y-%m"), "count": m["count"]} for m in monthly_trend]

        return Response({
            "summary": {
                "total_nominations": total_nominations,
                "coordinator_approved": coordinator_approved,
                "committee_finalists": committee_finalists,
                "final_winner": final_winner,
                "total_rejections": total_rejections,
                "employees_not_nominated": employees_not_nominated,
 
            },
            "department_stats": department_stats,
            "daily_trend": daily_trend_data,
            "trend_data": trend_data
        })


# ========================= REPORTS (MANAGEMENT / EXPORT) =========================
from django.http import HttpResponse

class AdminReportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != "ADMIN":
            return Response({"error": "Unauthorized"}, status=403)

        wb = Workbook()

        # ===================== SHEET 1: SUMMARY =====================
        ws = wb.active
        ws.title = "Summary"

        ws.append(["Metric", "Value"])
        ws.append(["Total Nominations", Nomination.objects.count()])
        ws.append([
            "Coordinator Approved",
            Nomination.objects.filter(
                status__in=["APPROVED", "COMMITTEE_APPROVED", "AWARDED", "REJECTED"]
            ).count()
        ])
        ws.append([
            "Committee Finalists",
            Nomination.objects.filter(status="COMMITTEE_APPROVED").count()
        ])
        ws.append([
            "Final Winners",
            Nomination.objects.filter(status="AWARDED")
            .values("nominee")
            .distinct()
            .count()
        ])
        ws.append([
            "Total Rejections",
            Nomination.objects.filter(status="REJECTED").count()
        ])
        total_employees = User.objects.filter(role=User.EMPLOYEE).count()
        employees_who_nominated = Nomination.objects.values("nominator").distinct().count()
        employees_not_nominated = total_employees - employees_who_nominated

        ws.append(["Employees Not Nominated", employees_not_nominated])



        # ===================== SHEET 2: DEPARTMENT ANALYTICS =====================
        ws2 = wb.create_sheet(title="Department Analytics")
        ws2.append(["Department", "Nomination Count"])

        department_analytics = (
            Nomination.objects
            .values(department=F("nominee__employee_dept"))
            .annotate(count=Count("id"))
        )

        for d in department_analytics:
            ws2.append([d["department"], d["count"]])

        # ===================== SHEET 3: APPROVAL LOGS =====================
        ws3 = wb.create_sheet(title="Approval Logs")
        ws3.append(["Employee", "Department", "Stage", "Action By", "Date"])

        nominations = Nomination.objects.select_related(
            "nominee", "nominator", "nominee__manager"
        )

        for n in nominations:
            ws3.append([
                n.nominee.username,
                n.nominee.employee_dept,
                "Initial Nomination",
                n.nominator.username if n.nominator else "System",
                n.submitted_at.strftime("%Y-%m-%d"),
            ])

            if n.status in ["APPROVED", "COMMITTEE_APPROVED", "AWARDED"] and n.nominee.manager:
                ws3.append([
                    n.nominee.username,
                    n.nominee.employee_dept,
                    "Coordinator Approval",
                    n.nominee.manager.username,
                    n.submitted_at.strftime("%Y-%m-%d"),
                ])

            if n.status in ["COMMITTEE_APPROVED", "AWARDED"]:
                ws3.append([
                    n.nominee.username,
                    n.nominee.employee_dept,
                    "Committee Approval",
                    "Committee",
                    n.submitted_at.strftime("%Y-%m-%d"),
                ])

            if n.status == "AWARDED":
                ws3.append([
                    n.nominee.username,
                    n.nominee.employee_dept,
                    "Final Winner",
                    "Admin",
                    n.submitted_at.strftime("%Y-%m-%d"),
                ])

        # ===================== SHEET 4: FINAL WINNERS =====================
        ws4 = wb.create_sheet(title="Final Winners")
        ws4.append(["Employee Name", "Role", "Department", "Award Level"])

        for n in Nomination.objects.filter(status="AWARDED"):
            ws4.append([
                n.nominee.username,
                n.nominee.employee_role,
                n.nominee.employee_dept,
                "Annual Winner",
            ])

        # ===================== RESPONSE =====================
        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="admin_report.xlsx"'

        wb.save(response)
        return response
