import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_notifications_test():
    print("[TEST] Starting Phase 7: Notifications System Tests...")
    uid = uuid.uuid4().hex[:6]
    
    # Register user
    reg = client.post("/auth/register", json={
        "name": "Monica Notifications",
        "email": f"monica_notif_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    }).json()
    token = reg["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    # 1. Initially 0 notifications
    n_res = client.get("/notifications", headers=h)
    assert n_res.status_code == 200
    assert n_res.json()["unread_count"] == 0
    print("  [OK] Initial notifications check: 0 unread")

    # 2. Create group and subscription
    grp = client.post("/groups", json={"name": "Notif Group"}, headers=h).json()
    sub = client.post("/subscriptions", json={
        "group_id": grp["id"],
        "platform_name": "Amazon Prime",
        "account_email": f"prime_{uid}@test.com",
        "plan_name": "Standard",
        "max_capacity": 2
    }, headers=h).json()

    # 3. Create booking -> Auto generates confirmation notification
    b_res = client.post("/bookings", json={
        "group_id": grp["id"],
        "subscription_id": sub["id"],
        "booking_date": "2026-10-25",
        "start_time": "14:00",
        "end_time": "15:00"
    }, headers=h)
    assert b_res.status_code == 201
    booking_id = b_res.json()["id"]

    # 4. Verify unread notification exists
    n_res2 = client.get("/notifications", headers=h)
    data2 = n_res2.json()
    assert data2["unread_count"] == 1
    assert data2["total_count"] == 1
    first_notif = data2["notifications"][0]
    assert first_notif["type"] == "booking_confirmation"
    print(f"  [OK] Notification received: '{first_notif['title']}' - '{first_notif['message']}'")

    # 5. Mark single notification as read
    read_res = client.put(f"/notifications/{first_notif['id']}/read", headers=h)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True

    n_res3 = client.get("/notifications", headers=h)
    assert n_res3.json()["unread_count"] == 0
    print("  [OK] Single notification marked as read; unread count reduced to 0")

    # 6. Cancel booking -> Auto generates cancellation notification
    client.delete(f"/bookings/{booking_id}", headers=h)
    n_res4 = client.get("/notifications", headers=h)
    data4 = n_res4.json()
    assert data4["unread_count"] == 1
    assert data4["total_count"] == 2
    print("  [OK] Cancellation notification generated upon booking deletion")

    # 7. Mark all as read
    client.put("/notifications/read-all", headers=h)
    n_res5 = client.get("/notifications", headers=h)
    assert n_res5.json()["unread_count"] == 0
    print("  [OK] Mark all as read endpoint verified")

    print("[SUCCESS] All Phase 7 Notifications tests passed!\n")

if __name__ == "__main__":
    run_notifications_test()
