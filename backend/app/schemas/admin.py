from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.schemas.group import GroupResponse
from app.schemas.booking import BookingResponse

class PlatformStat(BaseModel):
    platform_name: str
    booking_count: int

class PopularTimeStat(BaseModel):
    hour_slot: str
    booking_count: int

class AdminReportsResponse(BaseModel):
    total_users: int
    total_groups: int
    total_subscriptions: int
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    most_used_platforms: List[PlatformStat]
    popular_viewing_times: List[PopularTimeStat]
