import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_phase3_tests():
    print("[TEST] Starting Phase 3 Groups & Subscriptions Tests...")
    uid = uuid.uuid4().hex[:6]
    
    # 1. Register User 1
    u1_res = client.post("/auth/register", json={
        "name": "Monica BS",
        "email": f"monica_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    token1 = u1_res.json()["access_token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # 2. Register User 2
    u2_res = client.post("/auth/register", json={
        "name": "Sashwathi Sri",
        "email": f"sashwathi_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    token2 = u2_res.json()["access_token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # 3. User 1 creates group
    grp_res = client.post("/groups", json={
        "name": "Dorm 404 OTT Club",
        "description": "Shared accounts for dorm room"
    }, headers=h1)
    assert grp_res.status_code == 201, f"Create group failed: {grp_res.text}"
    grp_data = grp_res.json()
    grp_id = grp_data["id"]
    grp_code = grp_data["group_code"]
    assert len(grp_code) >= 6
    print(f"  [OK] Group created successfully with code: {grp_code}")

    # 4. User 2 joins group with group_code
    join_res = client.post("/groups/join", json={"group_code": grp_code}, headers=h2)
    assert join_res.status_code == 200, f"Join group failed: {join_res.text}"
    print("  [OK] User 2 joined group using group code")

    # 5. User 2 attempts to join again (duplicate join prevention)
    dup_join = client.post("/groups/join", json={"group_code": grp_code}, headers=h2)
    assert dup_join.status_code == 400
    print("  [OK] Duplicate group join prevented")

    # 6. Check group members list
    members_res = client.get(f"/groups/{grp_id}/members", headers=h1)
    assert members_res.status_code == 200
    members = members_res.json()
    assert len(members) == 2
    print(f"  [OK] Verified 2 group members: {[m['user_name'] for m in members]}")

    # 7. User 1 creates Netflix subscription (capacity 2)
    sub_res = client.post("/subscriptions", json={
        "group_id": grp_id,
        "platform_name": "Netflix",
        "account_email": "dorm404@netflix.com",
        "plan_name": "Standard (2 Screens)",
        "max_capacity": 2,
        "renewal_date": "2026-11-01"
    }, headers=h1)
    assert sub_res.status_code == 201, f"Create subscription failed: {sub_res.text}"
    sub_data = sub_res.json()
    sub_id = sub_data["id"]
    assert sub_data["max_capacity"] == 2
    print(f"  [OK] Created subscription for {sub_data['platform_name']} (Capacity: {sub_data['max_capacity']})")

    # 8. User 2 views subscription
    subs_list = client.get(f"/subscriptions?group_id={grp_id}", headers=h2)
    assert subs_list.status_code == 200
    assert len(subs_list.json()) >= 1
    print("  [OK] User 2 successfully viewed group subscriptions")

    # 9. Register outsider user and check permission denial
    u3_res = client.post("/auth/register", json={
        "name": "Outsider",
        "email": f"outsider_{uid}@test.edu",
        "password": "Password123!",
        "role": "user"
    })
    token3 = u3_res.json()["access_token"]
    h3 = {"Authorization": f"Bearer {token3}"}
    outsider_view = client.get(f"/groups/{grp_id}", headers=h3)
    assert outsider_view.status_code == 403
    print("  [OK] Non-member access to group correctly forbidden (403)")

    print("[SUCCESS] All Phase 3 Groups & Subscriptions tests passed!\n")

if __name__ == "__main__":
    run_phase3_tests()
