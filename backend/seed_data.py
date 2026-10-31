"""
Seed demo data for college viva demonstration.
Populates sample users, groups, subscriptions, bookings, and notifications.
"""
from datetime import date, time, timedelta
from app.database import SessionLocal, Base, engine
from app.models import User, Group, GroupMember, Subscription, Booking, Notification
from app.utils.auth import get_password_hash

def seed():
    print("[SEED] Ensuring fresh demo college data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Fetch or create users
        u1 = db.query(User).filter(User.email == "monica@college.edu").first()
        if not u1:
            u1 = User(name="B.S. Monica", email="monica@college.edu", password_hash=get_password_hash("Password123!"), role="user")
            db.add(u1)

        u2 = db.query(User).filter(User.email == "sashwathi@college.edu").first()
        if not u2:
            u2 = User(name="K. Sashwathi Sri", email="sashwathi@college.edu", password_hash=get_password_hash("Password123!"), role="user")
            db.add(u2)

        admin = db.query(User).filter(User.email == "admin@college.edu").first()
        if not admin:
            admin = User(name="College Admin", email="admin@college.edu", password_hash=get_password_hash("AdminPassword123!"), role="admin")
            db.add(admin)

        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        db.refresh(admin)

        # 2. Check if group exists
        g1 = db.query(Group).filter(Group.group_code == "DORM404").first()
        if not g1:
            g1 = Group(name="Dorm 404 OTT Club", description="Roommates shared accounts for weekend movies", group_code="DORM404", created_by=u1.id)
            db.add(g1)
            db.commit()
            db.refresh(g1)

        # Ensure membership
        for u in [u1, u2]:
            m = db.query(GroupMember).filter(GroupMember.group_id == g1.id, GroupMember.user_id == u.id).first()
            if not m:
                db.add(GroupMember(group_id=g1.id, user_id=u.id, role="admin" if u.id == u1.id else "member"))
        db.commit()

        # 3. Ensure Subscriptions
        sub1 = db.query(Subscription).filter(Subscription.group_id == g1.id, Subscription.platform_name == "Netflix").first()
        if not sub1:
            sub1 = Subscription(
                group_id=g1.id,
                platform_name="Netflix",
                account_email="dorm404@netflix.com",
                plan_name="Standard (2 Screens)",
                max_capacity=2,
                renewal_date=date.today() + timedelta(days=25)
            )
            db.add(sub1)

        sub2 = db.query(Subscription).filter(Subscription.group_id == g1.id, Subscription.platform_name == "Amazon Prime Video").first()
        if not sub2:
            sub2 = Subscription(
                group_id=g1.id,
                platform_name="Amazon Prime Video",
                account_email="dorm404@prime.com",
                plan_name="Prime Video (3 Screens)",
                max_capacity=3,
                renewal_date=date.today() + timedelta(days=40)
            )
            db.add(sub2)
        db.commit()

        # 4. Ensure notification
        notif = db.query(Notification).filter(Notification.user_id == u1.id).first()
        if not notif:
            db.add(Notification(
                user_id=u1.id,
                title="Welcome to OTT Share Scheduler",
                message="Your group 'Dorm 404 OTT Club' is active with Netflix and Prime subscriptions.",
                type="general",
                is_read=False
            ))
            db.commit()

        print("[SEED] Successfully verified demo groups, memberships, and subscriptions!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
