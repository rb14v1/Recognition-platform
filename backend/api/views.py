from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer

User = get_user_model()

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
        # 1. Extract Data
        target_id = request.data.get('user_id_to_promote')
        new_role = request.data.get('new_role')

        # 2. Validation: Check if role exists in our SSOT
        if new_role not in User.ROLE_HIERARCHY:
            return Response({"error": f"Invalid role. Choices: {list(User.ROLE_HIERARCHY.keys())}"}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Encapsulated Logic Check
        # The view doesn't care about numbers. It just asks the model.
        if not request.user.can_promote(new_role):
            return Response({
                "error": "You do not have permission to promote users to this level."
            }, status=status.HTTP_403_FORBIDDEN)

        # 4. Database Action
        try:
            user_to_promote = User.objects.get(id=target_id)
            user_to_promote.role = new_role
            user_to_promote.save()
            
            return Response({
                "message": f"Success! {user_to_promote.username} is now a {new_role}."
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)