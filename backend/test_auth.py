import sys
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_flow():
    print("[TEST] Starting Phase 2 Authentication Tests...")
    uid = uuid.uuid4().hex[:6]
    test_email = f"monica_{uid}@college.edu"
    admin_email = f"admin_{uid}@college.edu"
    
    # 1. Register User A (Student: Monica)
    res_reg = client.post("/auth/register", json={
        "name": "B.S. Monica",
        "email": test_email,
        "password": "Password123!",
        "role": "user"
    })
    assert res_reg.status_code == 201, f"Register failed: {res_reg.text}"
    data_reg = res_reg.json()
    assert "access_token" in data_reg
    assert data_reg["user"]["role"] == "user"
    print("  [OK] User registration successful")

    # 2. Register Duplicate Email
    res_dup = client.post("/auth/register", json={
        "name": "Monica Duplicate",
        "email": test_email,
        "password": "Password123!",
        "role": "user"
    })
    assert res_dup.status_code == 400
    assert "Email already registered" in res_dup.json()["detail"]
    print("  [OK] Duplicate email rejection verified")

    # 3. Register Admin User (Sashwathi Sri)
    res_admin = client.post("/auth/register", json={
        "name": "K. Sashwathi Sri",
        "email": admin_email,
        "password": "AdminPassword123!",
        "role": "admin"
    })
    assert res_admin.status_code == 201
    assert res_admin.json()["user"]["role"] == "admin"
    print("  [OK] Admin registration successful")

    # 4. Login with valid credentials
    res_login = client.post("/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    print("  [OK] User login successful with JWT")

    # 5. Login with invalid password
    res_invalid = client.post("/auth/login", json={
        "email": test_email,
        "password": "WrongPassword!"
    })
    assert res_invalid.status_code == 401
    print("  [OK] Invalid login rejected with 401")

    # 6. Access /users/me with valid Bearer token
    res_me = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == test_email
    print("  [OK] Protected /users/me endpoint validated")

    # 7. Access /users/me without token
    res_no_token = client.get("/users/me")
    assert res_no_token.status_code in (401, 403)
    print("  [OK] Unauthenticated access rejected")

    print("[SUCCESS] All Phase 2 Authentication & Role tests passed!\n")

if __name__ == "__main__":
    test_auth_flow()
