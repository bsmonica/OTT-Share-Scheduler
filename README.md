# OTT Share Scheduler System

## 1. Project Overview

The **OTT Share Scheduler System** is a full-stack college project designed to manage shared OTT platform subscriptions (such as Netflix, Amazon Prime Video, Disney+ Hotstar, etc.) among student groups (e.g. hostel roommates, college clubs).

### Key Features:
- **Group Management**: Create groups and join existing groups using unique 6-character codes.
- **Subscription Management**: Add shared OTT accounts with maximum simultaneous screen capacities.
- **Intelligent Slot Booking**: Reserve uninterrupted viewing hours with backend conflict detection.
- **Overlap & Capacity Enforcement**: Accurately prevents simultaneous screen limits from being exceeded, handling exact, partial, and nested time overlaps while allowing adjacent bookings.
- **AI / Heuristic Scheduling Recommendation**: When a requested viewing slot is full, a Python proximity-based scheduling algorithm suggests the closest available time slot.
- **In-App Notifications**: Instant alerts for booking confirmations, slot cancellations, and AI recommendations with an unread badge counter.
- **Admin Dashboard & Reports**: Analytics on total users, groups, subscriptions, most-used OTT platforms, and popular viewing times.

---

## 2. Tech Stack & Architecture

```
React.js Frontend (Port 5173)
       ↓ (HTTP / REST APIs with JWT Bearer Auth)
FastAPI Backend (Port 8000)
       ↓ (SQLAlchemy ORM + PyMySQL)
MySQL Database (Port 3306)
```

- **Frontend**: React.js, JavaScript, React Router, Clean & Minimal Vanilla CSS.
- **Backend**: Python 3.11, FastAPI, Pydantic, Passlib/Bcrypt, Python-Jose (JWT).
- **Database**: MySQL (DDL script in `backend/schema.sql`). *Includes automatic SQLite fallback for zero-friction local execution if MySQL service is temporarily offline.*

---

## 3. How to Run the Project

### Prerequisites:
- Python 3.10+
- Node.js 18+
- MySQL (Optional: XAMPP / MySQL Server / MariaDB)

### A. Run Backend:
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   python -m pip install -r requirements.txt
   ```
2. (Optional) Initialize MySQL database:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *Swagger API Documentation will be available at:* `http://127.0.0.1:8000/docs`

### B. Run Frontend:
1. Open another terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at: `http://localhost:5173`

---

## 4. Demo Login Credentials

For quick evaluation during college vivas, the system comes pre-configured with demo accounts:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Student (Monica)** | `monica@college.edu` | `Password123!` | Active groups, subscriptions & bookings |
| **Student (Sashwathi)** | `sashwathi@college.edu` | `Password123!` | Group member & active viewer |
| **College Admin** | `admin@college.edu` | `AdminPassword123!` | Access to Admin Dashboard & Reports |

---

## 5. Booking Logic & Viva Explanation

### Conflict Detection:
- Two bookings $[S_A, E_A)$ and $[S_B, E_B)$ overlap if and only if $\max(S_A, S_B) < \min(E_A, E_B)$.
- **Adjacent Bookings**: A slot `07:00–08:00` and `08:00–09:00` do not overlap because $\max(08:00, 07:00) = 08:00$ which is not strictly less than $\min(09:00, 08:00) = 08:00$.
- **Peak Concurrent Count**: Evaluated at all critical timepoints within the requested window. If adding the new booking causes concurrent usage to exceed `max_capacity`, the booking is rejected with `409 Conflict`.

### AI Recommendation Algorithm:
- When a requested slot is unavailable, the engine evaluates symmetric time offsets ($\pm 30, \pm 60, \pm 90, \dots$ minutes) across available hours (06:00 to 23:59).
- The nearest non-conflicting slot is recommended with the difference in minutes and reasoning.
- Users can apply and book the recommended slot with one click.
