"""
OTT Share Scheduler System - Core Conflict Detection & Scheduling Engine
Team: B.S. Monica & K. Sashwathi Sri

This module provides deterministic, viva-friendly conflict detection:
1. Validates time logic (start < end, minimum duration).
2. Performs time-interval intersection checks (adjacent bookings allowed, overlapping disallowed if over capacity).
3. Evaluates maximum concurrent usage using critical point time-slice analysis.
"""

from datetime import date, time, datetime, timedelta
from typing import Tuple, List, Optional
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.subscription import Subscription
from app.models.user import User

def time_to_minutes(t: time) -> int:
    """Convert time object (HH:MM) to total minutes from midnight for exact comparisons."""
    return t.hour * 60 + t.minute

def minutes_to_time(m: int) -> time:
    """Convert total minutes from midnight back to time object."""
    hours = (m // 60) % 24
    minutes = m % 60
    return time(hour=hours, minute=minutes)

def check_booking_conflict(
    db: Session,
    subscription_id: int,
    booking_date: date,
    req_start: time,
    req_end: time,
    user_id: int,
    exclude_booking_id: Optional[int] = None
) -> Tuple[bool, str, int, int]:
    """
    Checks if requested booking slot causes a capacity conflict or user double-booking.
    Returns:
        (is_conflict: bool, message: str, peak_usage: int, max_capacity: int)
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        return True, "Subscription not found", 0, 0

    if sub.status != "active":
        return True, "Subscription is inactive or expired", 0, sub.max_capacity

    req_start_min = time_to_minutes(req_start)
    req_end_min = time_to_minutes(req_end)

    if req_start_min >= req_end_min:
        return True, "Start time must be before end time", 0, sub.max_capacity

    # Query all active (confirmed) bookings for this subscription on this date
    query = db.query(Booking).filter(
        Booking.subscription_id == subscription_id,
        Booking.booking_date == booking_date,
        Booking.status == "confirmed"
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    existing_bookings = query.all()

    # 1. Filter existing bookings that overlap with [req_start_min, req_end_min)
    # Overlap occurs when max(startA, startB) < min(endA, endB)
    overlapping = []
    for b in existing_bookings:
        b_start_min = time_to_minutes(b.start_time)
        b_end_min = time_to_minutes(b.end_time)
        
        # Check strict interval overlap: [req_start, req_end) overlaps with [b_start, b_end)
        if max(req_start_min, b_start_min) < min(req_end_min, b_end_min):
            overlapping.append((b, b_start_min, b_end_min))
            # Also check if this user already has an active overlapping booking on this subscription
            if b.user_id == user_id:
                return True, "You already have an active booking overlapping with this time slot", 0, sub.max_capacity

    if not overlapping:
        # No overlapping bookings at all -> completely available
        return False, "Slot available", 1, sub.max_capacity

    # 2. Evaluate peak concurrent usage across all critical time points in [req_start_min, req_end_min)
    # The critical test points are req_start_min and each booking's start time inside the range.
    critical_points = {req_start_min}
    for _, b_start_min, _ in overlapping:
        if req_start_min <= b_start_min < req_end_min:
            critical_points.add(b_start_min)

    max_simultaneous = 0
    for t in sorted(critical_points):
        # Count how many existing bookings cover point t
        concurrent = 0
        for _, b_start_min, b_end_min in overlapping:
            if b_start_min <= t < b_end_min:
                concurrent += 1
        
        # Adding candidate booking gives concurrent + 1
        total_at_t = concurrent + 1
        if total_at_t > max_simultaneous:
            max_simultaneous = total_at_t

        if total_at_t > sub.max_capacity:
            return True, f"Capacity limit exceeded (Peak simultaneous users would be {total_at_t}/{sub.max_capacity})", total_at_t, sub.max_capacity

    return False, "Slot available", max_simultaneous, sub.max_capacity

def get_day_slot_availability(
    db: Session,
    subscription: Subscription,
    target_date: date,
    start_hour: int = 6,
    end_hour: int = 24
) -> List[dict]:
    """
    Generates 1-hour availability slots across the day with occupancy and status.
    """
    bookings = db.query(Booking).filter(
        Booking.subscription_id == subscription.id,
        Booking.booking_date == target_date,
        Booking.status == "confirmed"
    ).all()

    slots = []
    for h in range(start_hour, end_hour):
        slot_start_min = h * 60
        slot_end_min = (h + 1) * 60
        
        # Find bookings overlapping this hour slot
        active_in_slot = []
        user_names = []
        for b in bookings:
            b_start_min = time_to_minutes(b.start_time)
            b_end_min = time_to_minutes(b.end_time)
            if max(slot_start_min, b_start_min) < min(slot_end_min, b_end_min):
                active_in_slot.append(b)
                if b.user and b.user.name not in user_names:
                    user_names.append(b.user.name)

        occupied = len(active_in_slot)
        cap = subscription.max_capacity

        if occupied == 0:
            status_text = "Available"
        elif occupied < cap:
            status_text = f"Partially Occupied ({occupied}/{cap})"
        else:
            status_text = "Full"

        start_str = f"{h:02d}:00"
        end_str = f"{h+1:02d}:00" if h + 1 < 24 else "23:59"

        slots.append({
            "start_time": start_str,
            "end_time": end_str,
            "occupied_count": occupied,
            "max_capacity": cap,
            "status": status_text,
            "current_users": user_names
        })

    return slots

def find_best_time_recommendation(
    db: Session,
    subscription_id: int,
    target_date: date,
    req_start: time,
    req_end: time,
    user_id: int
) -> Tuple[bool, Optional[dict], List[dict]]:
    """
    Python-based Proximity Scheduling Algorithm:
    1. Checks if requested slot is available.
    2. If unavailable, sweeps forward and backward around requested time in 30-min intervals.
    3. Evaluates capacity constraints for each interval.
    4. Selects the closest available alternative with minimal difference.
    5. If same day is exhausted, checks next day at the preferred time.
    """
    # 1. Check if requested slot is free
    conflict, msg, _, _ = check_booking_conflict(
        db, subscription_id, target_date, req_start, req_end, user_id
    )
    if not conflict:
        return True, None, []

    req_start_min = time_to_minutes(req_start)
    req_end_min = time_to_minutes(req_end)
    duration_min = req_end_min - req_start_min
    if duration_min <= 0:
        duration_min = 60

    # Search offsets outward: +30, -30, +60, -60, +90, -90, +120, -120, ... up to 360 mins
    search_offsets = []
    for step in range(30, 361, 30):
        search_offsets.append(step)   # Forward offset (e.g., +30, +60)
        search_offsets.append(-step)  # Backward offset (e.g., -30, -60)

    valid_candidates = []
    
    # Earliest booking: 06:00 (360m), Latest booking end: 23:59 (1439m)
    for offset in search_offsets:
        cand_start_min = req_start_min + offset
        cand_end_min = cand_start_min + duration_min

        if cand_start_min < 360 or cand_end_min > 1439:
            continue

        cand_start = minutes_to_time(cand_start_min)
        cand_end = minutes_to_time(cand_end_min)

        c_conflict, _, _, _ = check_booking_conflict(
            db, subscription_id, target_date, cand_start, cand_end, user_id
        )
        if not c_conflict:
            diff_abs = abs(offset)
            direction_str = f"{diff_abs} mins later" if offset > 0 else f"{diff_abs} mins earlier"
            candidate_item = {
                "booking_date": target_date,
                "start_time": cand_start,
                "end_time": cand_end,
                "difference_minutes": diff_abs,
                "reason": f"Available slot {direction_str} on requested date"
            }
            valid_candidates.append(candidate_item)
            if len(valid_candidates) >= 5:
                break

    # If no slots found on target_date, check next day at the exact requested time
    if not valid_candidates:
        next_date = target_date + timedelta(days=1)
        next_conflict, _, _, _ = check_booking_conflict(
            db, subscription_id, next_date, req_start, req_end, user_id
        )
        if not next_conflict:
            valid_candidates.append({
                "booking_date": next_date,
                "start_time": req_start,
                "end_time": req_end,
                "difference_minutes": 1440,
                "reason": "Exact requested time is available on the next day"
            })

    best_slot = valid_candidates[0] if valid_candidates else None
    return False, best_slot, valid_candidates[:3]
