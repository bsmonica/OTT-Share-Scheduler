import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_test_user(name: str, prefix: str):
    email = f"{prefix}_{uuid.uuid4().hex[:6]}@test.edu"
    res = client.post("/auth/register", json={
        "name": name,
        "email": email,
        "password": "Password123!",
        "role": "user"
    })
    assert res.status_code == 201
    return res.json()["user"], res.json()["access_token"]

def run_booking_tests():
    print("[TEST] Starting Phase 4 & 5: Booking Logic & Conflict Detection Tests...")
    
    # Create 3 distinct users: User A, User B, User C
    userA, tokenA = create_test_user("User A", "user_a")
    userB, tokenB = create_test_user("User B", "user_b")
    userC, tokenC = create_test_user("User C", "user_c")

    hA = {"Authorization": f"Bearer {tokenA}"}
    hB = {"Authorization": f"Bearer {tokenB}"}
    hC = {"Authorization": f"Bearer {tokenC}"}

    # User A creates a group
    grp = client.post("/groups", json={"name": "Testing OTT Group"}, headers=hA).json()
    grp_id = grp["id"]
    code = grp["group_code"]

    # User B & C join the group
    client.post("/groups/join", json={"group_code": code}, headers=hB)
    client.post("/groups/join", json={"group_code": code}, headers=hC)

    # User A creates a subscription with max_capacity = 2 (Netflix Premium 2 screens)
    sub = client.post("/subscriptions", json={
        "group_id": grp_id,
        "platform_name": "Netflix",
        "account_email": "ott_test@domain.com",
        "plan_name": "Standard",
        "max_capacity": 2,
        "renewal_date": "2026-12-01"
    }, headers=hA).json()
    sub_id = sub["id"]

    test_date = "2026-10-10"

    # ========================================================
    # TEST 1: Capacity = 2, Exact Overlap (A: 07:00-08:00, B: 07:00-08:00, C: 07:00-08:00)
    # A books 07:00-08:00 -> SUCCESS
    # B books 07:00-08:00 -> SUCCESS (capacity reaches 2/2)
    # C books 07:00-08:00 -> MUST BE REJECTED (409 CONFLICT)
    # ========================================================
    res_bA = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "07:00",
        "end_time": "08:00"
    }, headers=hA)
    assert res_bA.status_code == 201, f"User A booking failed: {res_bA.text}"
    print("  [OK] Case 1a: User A booked 07:00-08:00 successfully (Count: 1/2)")

    res_bB = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "07:00",
        "end_time": "08:00"
    }, headers=hB)
    assert res_bB.status_code == 201, f"User B booking failed: {res_bB.text}"
    print("  [OK] Case 1b: User B booked 07:00-08:00 successfully (Count: 2/2)")

    res_bC = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "07:00",
        "end_time": "08:00"
    }, headers=hC)
    assert res_bC.status_code == 409, f"Expected 409 conflict for User C, got {res_bC.status_code}"
    print("  [OK] Case 1c: User C booking 07:00-08:00 REJECTED as capacity is full")

    # ========================================================
    # TEST 2: Adjacent Bookings (A: 07:00-08:00, B: 08:00-09:00)
    # Both must be allowed even when capacity is reached in earlier slot!
    # ========================================================
    res_adj = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "08:00",
        "end_time": "09:00"
    }, headers=hC)
    assert res_adj.status_code == 201, f"Adjacent booking failed: {res_adj.text}"
    print("  [OK] Case 2: Adjacent booking 08:00-09:00 ALLOWED (zero boundary collision)")

    # ========================================================
    # TEST 3: Partial / Nested Overlap & Simultaneous Usage
    # In 08:00-09:00, User C is booked (1/2).
    # User A books 08:30-09:30 (simultaneous becomes 2/2 from 08:30 to 09:00) -> ALLOWED.
    # Then User B tries to book 08:45-09:15 -> Peak becomes 3/2 -> MUST BE REJECTED.
    # ========================================================
    res_bA_partial = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "08:30",
        "end_time": "09:30"
    }, headers=hA)
    assert res_bA_partial.status_code == 201
    print("  [OK] Case 3a: Partial overlap 08:30-09:30 ALLOWED (Simultaneous peak: 2/2)")

    res_bB_exceed = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "08:45",
        "end_time": "09:15"
    }, headers=hB)
    assert res_bB_exceed.status_code == 409
    print("  [OK] Case 3b: Nested overlap 08:45-09:15 REJECTED (Simultaneous peak exceeds 2)")

    # ========================================================
    # TEST 4: Availability breakdown
    # Check availability endpoint for test_date
    # ========================================================
    avail_res = client.get(f"/bookings/availability?subscription_id={sub_id}&booking_date={test_date}", headers=hA)
    assert avail_res.status_code == 200
    avail_data = avail_res.json()
    slots = {s["start_time"]: s for s in avail_data["slots"]}
    
    assert slots["07:00"]["status"] == "Full"
    assert slots["07:00"]["occupied_count"] == 2
    assert "User A" in slots["07:00"]["current_users"]
    assert "User B" in slots["07:00"]["current_users"]
    print("  [OK] Case 4: Availability breakdown correctly reports 07:00-08:00 as Full (2/2)")

    # ========================================================
    # TEST 5: Cancellation & Recovery of Slot
    # User B cancels their 07:00-08:00 booking.
    # Then User C books 07:00-08:00 -> Now MUST SUCCEED!
    # ========================================================
    userB_booking_id = res_bB.json()["id"]
    cancel_res = client.delete(f"/bookings/{userB_booking_id}", headers=hB)
    assert cancel_res.status_code == 200
    print("  [OK] Case 5a: User B successfully cancelled 07:00-08:00 booking")

    res_bC_retry = client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": test_date,
        "start_time": "07:00",
        "end_time": "08:00"
    }, headers=hC)
    assert res_bC_retry.status_code == 201
    print("  [OK] Case 5b: User C successfully booked freed slot (07:00-08:00)")

    print("[SUCCESS] All Phase 4 & 5 Booking, Availability & Conflict tests passed!\n")

if __name__ == "__main__":
    run_booking_tests()
