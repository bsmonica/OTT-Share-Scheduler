from collections import Counter
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMember
from app.models.subscription import Subscription
from app.models.booking import Booking
from app.schemas.user import UserResponse
from app.schemas.group import GroupResponse
from app.schemas.booking import BookingResponse
from app.schemas.admin import AdminReportsResponse, PlatformStat, PopularTimeStat
from app.utils.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()

@router.get("/groups", response_model=List[GroupResponse])
def get_all_groups(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    groups = db.query(Group).all()
    result = []
    for g in groups:
        m_count = db.query(GroupMember).filter(GroupMember.group_id == g.id).count()
        result.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "group_code": g.group_code,
            "created_by": g.created_by,
            "created_at": g.created_at,
            "member_count": m_count,
            "members": []
        })
    return result

@router.get("/bookings", response_model=List[BookingResponse])
def get_all_bookings(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.booking_date.desc(), Booking.start_time.desc()).all()
    result = []
    for b in bookings:
        result.append({
            "id": b.id,
            "group_id": b.group_id,
            "subscription_id": b.subscription_id,
            "user_id": b.user_id,
            "booking_date": b.booking_date,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "status": b.status,
            "created_at": b.created_at,
            "user_name": b.user.name if b.user else "Unknown",
            "platform_name": b.subscription.platform_name if b.subscription else "Unknown",
            "group_name": b.group.name if b.group else "Unknown"
        })
    return result

@router.get("/reports", response_model=AdminReportsResponse)
def get_admin_reports(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_groups = db.query(Group).count()
    total_subscriptions = db.query(Subscription).count()
    
    all_bookings = db.query(Booking).all()
    total_bookings = len(all_bookings)
    confirmed_bookings = sum(1 for b in all_bookings if b.status == "confirmed")
    cancelled_bookings = sum(1 for b in all_bookings if b.status == "cancelled")

    # Platform usage calculation
    platform_counter = Counter()
    for b in all_bookings:
        if b.subscription:
            platform_counter[b.subscription.platform_name] += 1
    
    most_used_platforms = [
        PlatformStat(platform_name=p, booking_count=c)
        for p, c in platform_counter.most_common()
    ]
    if not most_used_platforms:
        # Default platforms for display
        for p in ["Netflix", "Amazon Prime", "Disney+ Hotstar"]:
            most_used_platforms.append(PlatformStat(platform_name=p, booking_count=0))

    # Popular viewing times calculation
    time_counter = Counter()
    for b in all_bookings:
        hour_slot = f"{b.start_time.hour:02d}:00 - {b.end_time.hour:02d}:00"
        time_counter[hour_slot] += 1

    popular_viewing_times = [
        PopularTimeStat(hour_slot=h, booking_count=c)
        for h, c in time_counter.most_common(5)
    ]
    if not popular_viewing_times:
        popular_viewing_times = [
            PopularTimeStat(hour_slot="19:00 - 20:00", booking_count=0),
            PopularTimeStat(hour_slot="20:00 - 21:00", booking_count=0),
            PopularTimeStat(hour_slot="21:00 - 22:00", booking_count=0)
        ]

    return {
        "total_users": total_users,
        "total_groups": total_groups,
        "total_subscriptions": total_subscriptions,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "cancelled_bookings": cancelled_bookings,
        "most_used_platforms": most_used_platforms,
        "popular_viewing_times": popular_viewing_times
    }
