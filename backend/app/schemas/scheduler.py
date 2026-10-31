from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel

class RecommendRequest(BaseModel):
    group_id: int
    subscription_id: int
    booking_date: date
    start_time: time
    end_time: time

class AlternativeSlot(BaseModel):
    booking_date: date
    start_time: time
    end_time: time
    difference_minutes: int
    reason: str

class RecommendResponse(BaseModel):
    is_requested_available: bool
    status_message: str
    requested_slot: dict
    recommended_slot: Optional[AlternativeSlot] = None
    alternative_slots: List[AlternativeSlot] = []
    algorithm_info: str = "Proximity-based Capacity Constraint Satisfaction Algorithm"
