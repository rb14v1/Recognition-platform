from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer

User = get_user_model()

# Registration remains the same (Always creates Employee)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class PromoteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Payload: { "user_id_to_promote": 123, "new_role": "COORDINATOR" }
        """
        requestor = request.user
        target_id = request.data.get('user_id_to_promote')
        new_role = request.data.get('new_role')

        # Define Levels locally for comparison
        ROLE_LEVELS = {
            'ADMIN': 4,
            'COMMITTEE': 3,
            'COORDINATOR': 2,
            'EMPLOYEE': 1
        }

        # 1. Validate the new role exists
        if new_role not in ROLE_LEVELS:
            return Response({"error": "Invalid role specified."}, status=status.HTTP_400_BAD_REQUEST)

        requestor_level = ROLE_LEVELS.get(requestor.role, 1)
        new_role_level = ROLE_LEVELS.get(new_role, 1)

        # 2. SECURITY CHECK: The Hierarchy Logic
        # A user cannot promote someone to a rank higher than themselves.
        # Example: Coordinator (2) cannot make someone Committee (3).
        if new_role_level > requestor_level:
            return Response({
                "error": "You cannot promote a user to a rank higher than your own."
            }, status=status.HTTP_403_FORBIDDEN)

        # 3. Find the user to promote
        try:
            user_to_promote = User.objects.get(id=target_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # 4. Update Role
        user_to_promote.role = new_role
        user_to_promote.save()

        return Response({
            "message": f"Success! {user_to_promote.username} is now a {new_role}."
        })