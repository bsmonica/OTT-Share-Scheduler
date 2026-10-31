from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.groups import router as groups_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.bookings import router as bookings_router
from app.routers.scheduler import router as scheduler_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "users_router",
    "groups_router",
    "subscriptions_router",
    "bookings_router",
    "scheduler_router",
    "notifications_router",
    "admin_router"
]
