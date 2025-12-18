from django.core.mail import send_mail
from django.conf import settings
from .models import Notification


def send_notification(user, message, title=None, notif_type="INFO"):
    if not title:
        title = "Notification"

    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notif_type
    )

    try:
        send_mail(
            subject=title,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        print("Email sending failed:", e)
