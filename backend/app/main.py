from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensure models are loaded

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for OTT Share Scheduler System. Developed by B.S. Monica & K. Sashwathi Sri."
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.groups import router as groups_router
from app.routers.subscriptions import router as subscriptions_router
from app.routers.bookings import router as bookings_router
from app.routers.scheduler import router as scheduler_router
from app.routers.notifications import router as notifications_router
from app.routers.admin import router as admin_router

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(groups_router)
app.include_router(subscriptions_router)
app.include_router(bookings_router)
app.include_router(scheduler_router)
app.include_router(notifications_router)
app.include_router(admin_router)

@app.get("/")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "team": settings.TEAM,
        "status": "online",
        "version": settings.VERSION
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "database": str(engine.url).split("@")[-1] if "@" in str(engine.url) else "connected"}
