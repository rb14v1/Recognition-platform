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
        
        # Base query
        query = Nomination.objects.select_related("nominee", "nominator").order_by("-submitted_at")

        # ------------------------------------------------------
        # 1. COORDINATOR PAGE (Step 1: New Submissions)
        # ------------------------------------------------------
        if filter_type == "coordinator_pending":
            # Show only items waiting for Coordinator approval
            nominations = query.filter(status="SUBMITTED")

        # ------------------------------------------------------
        # 2. COMMITTEE PAGE (Step 2: Shortlisted/Approved)
        # ------------------------------------------------------
        elif filter_type == "committee_pending":
            # Show items that were APPROVED by Coordinator, waiting for Committee
            nominations = query.filter(status="APPROVED")

        # ------------------------------------------------------
        # 3. HISTORY (Completed items)
        # ------------------------------------------------------
        elif filter_type == "history":
            nominations = query.filter(status__in=["REJECTED", "COMMITTEE_APPROVED", "AWARDED"])
            
        # Fallback (Safety)
        else:
            nominations = query.filter(status="SUBMITTED")

        data = [
            {
                "id": n.id,
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

    # ... keep your existing post() method as is ...

    def get_next_stage_label(self, status):
        """Helper to tell frontend what the button should say"""
        if status == "SUBMITTED": return "Approve to Shortlist"
        if status == "APPROVED": return "Select as Finalist"
        if status == "COMMITTEE_APPROVED": return "Grant Award"
        return "Completed"

    # --------------------------------------------------------
    # POST → HANDLES ALL TRANSITIONS
    # --------------------------------------------------------
    def post(self, request):
        nom_id = request.data.get("nomination_id")
        action = request.data.get("action") # APPROVE, REJECT, UNDO

        if request.user.role != "COORDINATOR":
            return Response({"error": "Unauthorized. Only Coordinators can manage nominations."}, status=403)

        try:
            nom = Nomination.objects.get(id=nom_id)
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found"}, status=404)

        nominee = nom.nominee

        # ======================================================
        # 🔥 MASTER LOGIC (Coordinator does it all)
        # ======================================================

        if action == "REJECT":
            # Rejecting works at ANY stage
            nom.status = "REJECTED"
            nom.save()
            send_notification(nominee, "Your nomination has been rejected.")
            return Response({"message": "Nomination rejected"})

        elif action == "UNDO":
            # Logic to step back 1 level (optional, but good for UX)
            if nom.status == "AWARDED":
                nom.status = "COMMITTEE_APPROVED"
            elif nom.status == "COMMITTEE_APPROVED":
                nom.status = "APPROVED"
            elif nom.status == "APPROVED":
                nom.status = "SUBMITTED"
            else:
                return Response({"error": "Cannot undo from this stage"}, status=400)
            
            nom.save()
            return Response({"message": f"Undo successful. Reverted to {nom.status}"})

        elif action == "APPROVE":
            # 🚀 STAGE 1: SUBMITTED -> APPROVED (Manager/Coordinator Approval)
            if nom.status == "SUBMITTED":
                nom.status = "APPROVED"
                nom.save()
                return Response({"message": "Nomination Shortlisted (Stage 1 Complete)"})

            # 🚀 STAGE 2: APPROVED -> COMMITTEE_APPROVED (Finalist Selection)
            elif nom.status == "APPROVED":
                # Check the 15 limit rule
                finalist_count = Nomination.objects.filter(status="COMMITTEE_APPROVED").count()
                if finalist_count >= 15:
                    return Response({"error": "Finalist limit (15) reached. Cannot approve more."}, status=400)
                
                nom.status = "COMMITTEE_APPROVED"
                nom.save()
                send_notification(nominee, "🎉 You have been selected as a finalist!")
                return Response({"message": "Nomination marked as Finalist (Stage 2 Complete)"})

            # 🚀 STAGE 3: COMMITTEE_APPROVED -> AWARDED (Admin/Winner)
            elif nom.status == "COMMITTEE_APPROVED":
                nom.status = "AWARDED"
                nom.save()
                send_notification(nominee, "🎉 Congratulations! You have won the award.")
                return Response({"message": "Award Granted (Process Complete)"})

            else:
                return Response({"error": "Nomination is already completed or rejected"}, status=400)

        return Response({"error": "Invalid Action"}, status=400)
    
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
 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db.models import Count, F
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
from openpyxl import Workbook
from .models import Nomination, User  # Ensure User is imported
from .serializers import AdminVoteResultSerializer # Ensure this is imported
# from .utils import check_timeline_validity # Ensure this is imported if used

# ========================= ADMIN RESULTS VIEW =========================
class AdminResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 🔓 UPDATE: Allow COORDINATOR
        if request.user.role != 'ADMIN' and request.user.role != 'COORDINATOR':
            return Response({"error": "Unauthorized"}, status=403)

        results = Nomination.objects.filter(
            status__in=['COMMITTEE_APPROVED', 'AWARDED']
        ).annotate(
            vote_count=Count('votes')
        ).order_by('-vote_count')
        
        # 🔥 remove duplicates by nominee
        unique = {}
        for r in results:
            if r.nominee.id not in unique:
                unique[r.nominee.id] = r
    
        results = list(unique.values())
        serializer = AdminVoteResultSerializer(results, many=True)
        return Response(serializer.data)

    # 🔥 Endpoint to finalize winners
    def post(self, request):
        # 🔓 UPDATE: Allow COORDINATOR
        if request.user.role != 'ADMIN' and request.user.role != 'COORDINATOR':
            return Response({"error": "Unauthorized"}, status=403)

        # 🔥 TIME CHECK (Assuming 'ADMIN_RESULTS' refers to the final stage)
        # is_valid, msg = check_timeline_validity('ADMIN_RESULTS')
        # if not is_valid:
        #    return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)

        # Logic to mark winner
        winner_id = request.data.get('nomination_id')
        try:
            winner = Nomination.objects.get(id=winner_id)
            winner.status = 'AWARDED'
            winner.save()
            return Response({"message": "Winner declared!"})
        except Nomination.DoesNotExist:
            return Response({"error": "Nomination not found"}, status=404)


# ========================= WINNERS VIEW =========================
class WinnersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 🔓 UPDATE: Allow COORDINATOR (and Admin)
        # Note: If regular employees need to see winners, remove this check entirely.
        if request.user.role != 'ADMIN' and request.user.role != 'COORDINATOR':
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
            if not n: return None
            return {
                "username": n.nominee.username,
                "employee_id": getattr(n.nominee, 'employee_id', n.nominee.id),
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
        # 🔓 ALLOW COORDINATOR ACCESS
        if request.user.role != 'ADMIN' and request.user.role != 'COORDINATOR':
            return Response({"error": "Unauthorized"}, status=403)

        # ----------------------------------------------------
        # 1. SUMMARY METRICS
        # ----------------------------------------------------
        total_nominations = Nomination.objects.count()

        # ✅ FIXED: Coordinator Approved includes everything downstream
        # Note: If you do NOT want "REJECTED" to count as "Approved", remove it from this list.
        coordinator_approved = Nomination.objects.filter(
            status__in=[
                'APPROVED',
                'COMMITTEE_APPROVED',
                'AWARDED',
                'REJECTED' 
            ]
        ).count()

        total_rejections = Nomination.objects.filter(status='REJECTED').count()
        
        # Employee Engagement Stats
        total_employees = User.objects.filter(role='EMPLOYEE').count()
        employees_who_nominated = Nomination.objects.values('nominator').distinct().count()
        employees_not_nominated = total_employees - employees_who_nominated

        # 🔥 FIXED: Committee Finalists now includes Winners (AWARDED)
        # Logic: A winner is still a finalist. This prevents the count from dropping.
        committee_finalists = Nomination.objects.filter(
            status__in=['COMMITTEE_APPROVED', 'AWARDED']
        ).count()

        final_winner = (Nomination.objects.filter(status='AWARDED').values('nominee').distinct().count())

        # ----------------------------------------------------
        # 2. DEPARTMENT STATS
        # ----------------------------------------------------
        dept_stats = (
            Nomination.objects
            .values('nominee__employee_dept')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        department_stats = [
            {"department": d['nominee__employee_dept'] or "Unknown", "count": d['count']}
            for d in dept_stats
        ]

        # ----------------------------------------------------
        # 3. DAILY TREND (Line Chart)
        # ----------------------------------------------------
        daily_trend = (
            Nomination.objects
            .annotate(day=TruncDate("submitted_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        daily_trend_data = [{"date": d["day"], "count": d["count"]} for d in daily_trend]

        # ----------------------------------------------------
        # 4. MONTHLY TREND (Optional/Extra)
        # ----------------------------------------------------
        monthly_trend = (
            Nomination.objects
            .annotate(month=TruncMonth("submitted_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )

        trend_data = [{"month": m["month"].strftime("%Y-%m") if m["month"] else "Unknown", "count": m["count"]} for m in monthly_trend]

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------
        return Response({
            "summary": {
                "total_nominations": total_nominations,
                "coordinator_approved": coordinator_approved,
                "committee_finalists": committee_finalists, # ✅ Corrected count
                "final_winner": final_winner,
                "total_rejections": total_rejections,
                "employees_not_nominated": employees_not_nominated,
            },
            "department_stats": department_stats,
            "daily_trend": daily_trend_data,
            "trend_data": trend_data
        })

# ========================= REPORTS (MANAGEMENT / EXPORT) =========================
class AdminReportExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 🔓 UPDATE: Allow COORDINATOR
        if request.user.role != "ADMIN" and request.user.role != 'COORDINATOR':
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
        
        # Using string 'EMPLOYEE' for consistency with Analytics view
        total_employees = User.objects.filter(role='EMPLOYEE').count() 
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
            "nominee", "nominator"
            # Removed "nominee__manager" from select_related to prevent errors if relation doesn't exist
        )

        for n in nominations:
            ws3.append([
                n.nominee.username,
                n.nominee.employee_dept,
                "Initial Nomination",
                n.nominator.username if n.nominator else "System",
                n.submitted_at.strftime("%Y-%m-%d"),
            ])

            # Coordinator Approval Logic 
            # (Note: Since Coordinators approve anyone, 'manager' might not be the approver, 
            # but we record it if the relationship exists)
            if n.status in ["APPROVED", "COMMITTEE_APPROVED", "AWARDED"]:
                 # Just logging "Coordinator" generically since specific approver isn't stored on Nomination model in this snippet
                ws3.append([
                    n.nominee.username,
                    n.nominee.employee_dept,
                    "Coordinator Approval",
                    "Coordinator", 
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
                    "Coordinator/Admin",
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