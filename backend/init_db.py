"""
Database initialization script for OTT Share Scheduler System.
Run this script to initialize tables or verify connections.
"""
from app.database import engine, Base
from app.models import User, Group, GroupMember, Subscription, Booking, Notification

def init_database():
    print("[INIT] Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    print("[INIT] Tables created successfully:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")

if __name__ == "__main__":
    init_database()
