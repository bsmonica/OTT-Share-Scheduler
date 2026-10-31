from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.booking import Booking
from app.models.subscription import Subscription
from app.models.group import Group, GroupMember
from app.models.notification import Notification
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse, AvailabilityResponse
from app.utils.auth import get_current_user
from app.utils.scheduler import check_booking_conflict, get_day_slot_availability

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("/availability", response_model=AvailabilityResponse)
def get_slot_availability(
    subscription_id: int = Query(...),
    booking_date: date = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")

    # Verify user belongs to the group of this subscription unless admin
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == sub.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not in group")

    slots = get_day_slot_availability(db, sub, booking_date)
    return {
        "subscription_id": sub.id,
        "platform_name": sub.platform_name,
        "date": booking_date,
        "max_capacity": sub.max_capacity,
        "slots": slots
    }

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify group membership
    if current_user.role != "admin":
        membership = db.query(GroupMember).filter(
            GroupMember.group_id == booking_data.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not in group")

    # 2. Verify subscription
    sub = db.query(Subscription).filter(
        Subscription.id == booking_data.subscription_id,
        Subscription.group_id == booking_data.group_id
    ).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found in this group")
    if sub.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subscription is inactive")

    # 3. Check conflict & capacity
    is_conflict, message, peak_usage, cap = check_booking_conflict(
        db=db,
        subscription_id=sub.id,
        booking_date=booking_data.booking_date,
        req_start=booking_data.start_time,
        req_end=booking_data.end_time,
        user_id=current_user.id
    )

    if is_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message
        )

    # 4. Create booking
    new_booking = Booking(
        group_id=booking_data.group_id,
        subscription_id=booking_data.subscription_id,
        user_id=current_user.id,
        booking_date=booking_data.booking_date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        status="confirmed"
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # 5. In-app confirmation notification
    start_str = new_booking.start_time.strftime("%H:%M")
    end_str = new_booking.end_time.strftime("%H:%M")
    notif = Notification(
        user_id=current_user.id,
        title="Booking Confirmed",
        message=f"Slot booked for {sub.platform_name} on {new_booking.booking_date} ({start_str} - {end_str}).",
        type="booking_confirmation"
    )
    db.add(notif)
    db.commit()

    grp = db.query(Group).filter(Group.id == new_booking.group_id).first()
    return {
        "id": new_booking.id,
        "group_id": new_booking.group_id,
        "subscription_id": new_booking.subscription_id,
        "user_id": new_booking.user_id,
        "booking_date": new_booking.booking_date,
        "start_time": new_booking.start_time,
        "end_time": new_booking.end_time,
        "status": new_booking.status,
        "created_at": new_booking.created_at,
        "user_name": current_user.name,
        "platform_name": sub.platform_name,
        "group_name": grp.name if grp else ""
    }

@router.get("", response_model=List[BookingResponse])
def get_bookings(
    group_id: Optional[int] = Query(None),
    subscription_id: Optional[int] = Query(None),
    booking_date: Optional[date] = Query(None),
    my_bookings: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Booking)

    if current_user.role != "admin" and not my_bookings:
        # Filter to groups user belongs to
        user_group_ids = [m.group_id for m in db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()]
        query = query.filter(Booking.group_id.in_(user_group_ids))

    if my_bookings or (current_user.role != "admin" and group_id is None and subscription_id is None):
        query = query.filter(Booking.user_id == current_user.id)

    if group_id:
        query = query.filter(Booking.group_id == group_id)
    if subscription_id:
        query = query.filter(Booking.subscription_id == subscription_id)
    if booking_date:
        query = query.filter(Booking.booking_date == booking_date)

    bookings = query.order_by(Booking.booking_date.desc(), Booking.start_time.asc()).all()
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

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking_by_id(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role != "admin" and b.user_id != current_user.id:
        # Check if same group
        is_member = db.query(GroupMember).filter(
            GroupMember.group_id == b.group_id,
            GroupMember.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return {
        "id": b.id,
        "group_id": b.group_id,
        "subscription_id": b.subscription_id,
        "user_id": b.user_id,
        "booking_date": b.booking_date,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "status": b.status,
        "created_at": b.created_at,
        "user_name": b.user.name if b.user else "",
        "platform_name": b.subscription.platform_name if b.subscription else "",
        "group_name": b.group.name if b.group else ""
    }

@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role != "admin" and b.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot cancel another user's booking")

    b.status = "cancelled"
    db.commit()

    # Create notification
    notif = Notification(
        user_id=b.user_id,
        title="Booking Cancelled",
        message=f"Booking on {b.booking_date} ({b.start_time.strftime('%H:%M')} - {b.end_time.strftime('%H:%M')}) was cancelled.",
        type="cancellation"
    )
    db.add(notif)
    db.commit()

    return {"message": "Booking successfully cancelled", "booking_id": b.id, "status": "cancelled"}

@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role != "admin" and b.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if payload.status:
        b.status = payload.status
        db.commit()
        db.refresh(b)

    return {
        "id": b.id,
        "group_id": b.group_id,
        "subscription_id": b.subscription_id,
        "user_id": b.user_id,
        "booking_date": b.booking_date,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "status": b.status,
        "created_at": b.created_at,
        "user_name": b.user.name if b.user else "",
        "platform_name": b.subscription.platform_name if b.subscription else "",
        "group_name": b.group.name if b.group else ""
    }
