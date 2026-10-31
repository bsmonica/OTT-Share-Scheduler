from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    platform_name = Column(String(100), nullable=False, index=True)  # Netflix, Prime Video, Disney+, etc.
    account_email = Column(String(150), nullable=False)
    plan_name = Column(String(100), default="Standard")  # Basic, Standard, Premium
    max_capacity = Column(Integer, nullable=False, default=2)  # max simultaneous screens
    status = Column(String(20), nullable=False, default="active")  # 'active', 'inactive'
    renewal_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="subscriptions")
    bookings = relationship("Booking", back_populates="subscription", cascade="all, delete-orphan")
