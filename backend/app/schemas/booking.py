from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator

class BookingBase(BaseModel):
    group_id: int
    subscription_id: int
    booking_date: date
    start_time: time
    end_time: time

class BookingCreate(BookingBase):
    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v, values):
        # We also validate in router logic
        return v

class BookingUpdate(BaseModel):
    status: Optional[str] = None  # 'confirmed' or 'cancelled'

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    platform_name: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

class SlotAvailability(BaseModel):
    start_time: str
    end_time: str
    occupied_count: int
    max_capacity: int
    status: str  # 'Available', 'Partially Occupied', 'Full'
    current_users: List[str] = []

class AvailabilityResponse(BaseModel):
    subscription_id: int
    platform_name: str
    date: date
    max_capacity: int
    slots: List[SlotAvailability]
