import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_admin_tests():
    print("[TEST] Starting Phase 8 & 9: Admin Dashboard & Reports Tests...")
    uid = uuid.uuid4().hex[:6]

    # 1. Register normal user
    u_res = client.post("/auth/register", json={
        "name": "Normal Student",
        "email": f"student_{uid}@college.edu",
        "password": "Password123!",
        "role": "user"
    }).json()
    u_token = u_res["access_token"]
    u_hdr = {"Authorization": f"Bearer {u_token}"}

    # 2. Register admin user
    adm_res = client.post("/auth/register", json={
        "name": "Admin Sashwathi",
        "email": f"admin_{uid}@college.edu",
        "password": "AdminPassword123!",
        "role": "admin"
    }).json()
    adm_token = adm_res["access_token"]
    adm_hdr = {"Authorization": f"Bearer {adm_token}"}

    # 3. Normal user forbidden from admin reports
    forbid_res = client.get("/admin/reports", headers=u_hdr)
    assert forbid_res.status_code == 403
    print("  [OK] Regular user forbidden from admin endpoints (403)")

    # 4. Admin accesses /admin/users
    users_res = client.get("/admin/users", headers=adm_hdr)
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 2
    print(f"  [OK] Admin fetched users list: {len(users_res.json())} users")

    # 5. Admin accesses /admin/reports
    reports_res = client.get("/admin/reports", headers=adm_hdr)
    assert reports_res.status_code == 200
    rep = reports_res.json()
    assert "total_users" in rep
    assert "total_groups" in rep
    assert "total_bookings" in rep
    assert "most_used_platforms" in rep
    assert "popular_viewing_times" in rep
    print(f"  [OK] Admin reports generated successfully:")
    print(f"       Total Users: {rep['total_users']}, Groups: {rep['total_groups']}, Bookings: {rep['total_bookings']}")
    print(f"       Most-used Platforms: {[p['platform_name'] for p in rep['most_used_platforms']]}")
    print(f"       Popular Times: {[t['hour_slot'] for t in rep['popular_viewing_times']]}")

    print("[SUCCESS] All Phase 8 & 9 Admin & Reports tests passed!\n")

if __name__ == "__main__":
    run_admin_tests()
