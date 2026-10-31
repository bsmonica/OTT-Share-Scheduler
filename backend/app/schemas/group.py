from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupMemberResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True

class GroupResponse(GroupBase):
    id: int
    group_code: str
    created_by: int
    created_at: datetime
    member_count: Optional[int] = 0
    members: Optional[List[GroupMemberResponse]] = []

    class Config:
        from_attributes = True

class GroupJoinRequest(BaseModel):
    group_code: str
