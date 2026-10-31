from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.group import Group, GroupMember
from app.models.subscription import Subscription
from app.models.notification import Notification
from app.models.user import User
from app.schemas.scheduler import RecommendRequest, RecommendResponse, AlternativeSlot
from app.utils.auth import get_current_user
from app.utils.scheduler import find_best_time_recommendation

router = APIRouter(prefix="/scheduler", tags=["AI Scheduler"])

@router.post("/recommend", response_model=RecommendResponse)
def recommend_best_time(
    req: RecommendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI / Heuristic Scheduling Recommendation Engine:
    When a requested slot is unavailable due to capacity or conflict,
    evaluates nearby slots and returns the closest suitable available slot.
    """
    # 1. Group membership check
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == req.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not in group")

    # 2. Subscription check
    sub = db.query(Subscription).filter(
        Subscription.id == req.subscription_id,
        Subscription.group_id == req.group_id
    ).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found in this group")

    is_available, best_slot, alternatives = find_best_time_recommendation(
        db=db,
        subscription_id=sub.id,
        target_date=req.booking_date,
        req_start=req.start_time,
        req_end=req.end_time,
        user_id=current_user.id
    )

    requested_slot_dict = {
        "date": str(req.booking_date),
        "start_time": req.start_time.strftime("%H:%M"),
        "end_time": req.end_time.strftime("%H:%M"),
        "platform": sub.platform_name
    }

    if is_available:
        return {
            "is_requested_available": True,
            "status_message": "The requested time slot is completely available!",
            "requested_slot": requested_slot_dict,
            "recommended_slot": None,
            "alternative_slots": [],
            "algorithm_info": "Proximity-based Capacity Constraint Satisfaction Algorithm"
        }

    # If unavailable, also trigger an in-app recommendation notification
    if best_slot:
        best_start_str = best_slot["start_time"].strftime("%H:%M")
        best_end_str = best_slot["end_time"].strftime("%H:%M")
        notif = Notification(
            user_id=current_user.id,
            title="AI Slot Recommendation",
            message=(
                f"Requested slot {req.start_time.strftime('%H:%M')}-{req.end_time.strftime('%H:%M')} for {sub.platform_name} was full. "
                f"Recommended alternative: {best_start_str}-{best_end_str} on {best_slot['booking_date']} ({best_slot['reason']})."
            ),
            type="recommendation"
        )
        db.add(notif)
        db.commit()

    alt_objects = [
        AlternativeSlot(
            booking_date=alt["booking_date"],
            start_time=alt["start_time"],
            end_time=alt["end_time"],
            difference_minutes=alt["difference_minutes"],
            reason=alt["reason"]
        ) for alt in alternatives
    ]

    best_object = None
    if best_slot:
        best_object = AlternativeSlot(
            booking_date=best_slot["booking_date"],
            start_time=best_slot["start_time"],
            end_time=best_slot["end_time"],
            difference_minutes=best_slot["difference_minutes"],
            reason=best_slot["reason"]
        )

    return {
        "is_requested_available": False,
        "status_message": "Requested slot is unavailable due to capacity limit. Showing closest alternatives.",
        "requested_slot": requested_slot_dict,
        "recommended_slot": best_object,
        "alternative_slots": alt_objects,
        "algorithm_info": "Proximity-based Capacity Constraint Satisfaction Algorithm"
    }
