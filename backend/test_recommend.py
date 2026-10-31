import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_recommend_tests():
    print("[TEST] Starting Phase 6: AI Scheduling Recommendation Tests...")
    
    uid = uuid.uuid4().hex[:6]
    # Register test users
    uA_res = client.post("/auth/register", json={
        "name": "Monica Test",
        "email": f"monica_rec_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    tokenA = uA_res.json()["access_token"]
    hA = {"Authorization": f"Bearer {tokenA}"}

    uB_res = client.post("/auth/register", json={
        "name": "Sashwathi Test",
        "email": f"sashwathi_rec_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    tokenB = uB_res.json()["access_token"]
    hB = {"Authorization": f"Bearer {tokenB}"}

    uC_res = client.post("/auth/register", json={
        "name": "Third Student",
        "email": f"student3_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    tokenC = uC_res.json()["access_token"]
    hC = {"Authorization": f"Bearer {tokenC}"}

    # Create Group & Subscription (Capacity: 2 screens)
    grp = client.post("/groups", json={"name": "Recommendation Test Group"}, headers=hA).json()
    grp_id = grp["id"]
    code = grp["group_code"]

    client.post("/groups/join", json={"group_code": code}, headers=hB)
    client.post("/groups/join", json={"group_code": code}, headers=hC)

    sub = client.post("/subscriptions", json={
        "group_id": grp_id,
        "platform_name": "Disney+ Hotstar",
        "account_email": f"disney_{uid}@test.com",
        "plan_name": "Super 2 Screens",
        "max_capacity": 2,
        "renewal_date": "2026-11-20"
    }, headers=hA).json()
    sub_id = sub["id"]

    target_date = "2026-10-15"

    # Fill 19:00 - 20:00 (7 PM - 8 PM) completely with 2 bookings
    client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": target_date,
        "start_time": "19:00",
        "end_time": "20:00"
    }, headers=hA)

    client.post("/bookings", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": target_date,
        "start_time": "19:00",
        "end_time": "20:00"
    }, headers=hB)

    # 1. User C asks for recommendation when slot 19:00 - 20:00 is full
    rec_res = client.post("/scheduler/recommend", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": target_date,
        "start_time": "19:00",
        "end_time": "20:00"
    }, headers=hC)
    assert rec_res.status_code == 200, f"Recommendation failed: {rec_res.text}"
    rec_data = rec_res.json()
    assert rec_data["is_requested_available"] is False
    assert rec_data["recommended_slot"] is not None
    rec_slot = rec_data["recommended_slot"]
    print(f"  [OK] Requested 19:00-20:00 unavailable -> Recommended: {rec_slot['start_time']} - {rec_slot['end_time']} ({rec_slot['reason']})")
    assert rec_slot["difference_minutes"] <= 60

    # 2. Check recommendation when slot IS available
    free_rec = client.post("/scheduler/recommend", json={
        "group_id": grp_id,
        "subscription_id": sub_id,
        "booking_date": target_date,
        "start_time": "21:00",
        "end_time": "22:00"
    }, headers=hC)
    assert free_rec.status_code == 200
    free_data = free_rec.json()
    assert free_data["is_requested_available"] is True
    print("  [OK] Free slot correctly identified as available without unnecessary conflict")

    print("[SUCCESS] All Phase 6 AI Recommendation tests passed!\n")

if __name__ == "__main__":
    run_recommend_tests()
