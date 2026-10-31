from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class SubscriptionBase(BaseModel):
    group_id: int
    platform_name: str
    account_email: EmailStr
    plan_name: Optional[str] = "Standard"
    max_capacity: int = 2
    renewal_date: Optional[date] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    platform_name: Optional[str] = None
    account_email: Optional[EmailStr] = None
    plan_name: Optional[str] = None
    max_capacity: Optional[int] = None
    status: Optional[str] = None
    renewal_date: Optional[date] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    status: str
    created_at: datetime
    group_name: Optional[str] = None

    class Config:
        from_attributes = True
