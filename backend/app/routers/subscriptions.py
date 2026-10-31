from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Subscription
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    sub_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Group).filter(Group.id == sub_data.group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    # Check if user is member of this group
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not in group"
            )

    new_sub = Subscription(
        group_id=sub_data.group_id,
        platform_name=sub_data.platform_name.strip(),
        account_email=sub_data.account_email.strip().lower(),
        plan_name=sub_data.plan_name.strip() if sub_data.plan_name else "Standard",
        max_capacity=max(1, sub_data.max_capacity),
        renewal_date=sub_data.renewal_date,
        status="active"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return {
        "id": new_sub.id,
        "group_id": new_sub.group_id,
        "platform_name": new_sub.platform_name,
        "account_email": new_sub.account_email,
        "plan_name": new_sub.plan_name,
        "max_capacity": new_sub.max_capacity,
        "renewal_date": new_sub.renewal_date,
        "status": new_sub.status,
        "created_at": new_sub.created_at,
        "group_name": group.name
    }

@router.get("", response_model=List[SubscriptionResponse])
def get_subscriptions(
    group_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Subscription).join(Group)
    if group_id:
        query = query.filter(Subscription.group_id == group_id)

    if current_user.role != "admin":
        user_group_ids = [
            m.group_id for m in db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
        ]
        query = query.filter(Subscription.group_id.in_(user_group_ids))

    subs = query.all()
    result = []
    for s in subs:
        g = db.query(Group).filter(Group.id == s.group_id).first()
        result.append({
            "id": s.id,
            "group_id": s.group_id,
            "platform_name": s.platform_name,
            "account_email": s.account_email,
            "plan_name": s.plan_name,
            "max_capacity": s.max_capacity,
            "renewal_date": s.renewal_date,
            "status": s.status,
            "created_at": s.created_at,
            "group_name": g.name if g else ""
        })
    return result

@router.get("/{sub_id}", response_model=SubscriptionResponse)
def get_subscription_details(
    sub_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == sub.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    g = db.query(Group).filter(Group.id == sub.group_id).first()
    return {
        "id": sub.id,
        "group_id": sub.group_id,
        "platform_name": sub.platform_name,
        "account_email": sub.account_email,
        "plan_name": sub.plan_name,
        "max_capacity": sub.max_capacity,
        "renewal_date": sub.renewal_date,
        "status": sub.status,
        "created_at": sub.created_at,
        "group_name": g.name if g else ""
    }
