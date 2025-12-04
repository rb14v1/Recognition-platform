from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q # Needed for search logic
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    UserNominationListSerializer, 
    NominationSerializer
)
from .models import Nomination

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

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