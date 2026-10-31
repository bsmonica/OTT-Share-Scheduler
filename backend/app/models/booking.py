from datetime import datetime
from sqlalchemy import Column, Integer, String, Date, Time, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default="confirmed")  # 'confirmed', 'cancelled'
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_booking_slot", "subscription_id", "booking_date", "status"),
    )

    # Relationships
    group = relationship("Group", back_populates="bookings")
    subscription = relationship("Subscription", back_populates="bookings")
    user = relationship("User", back_populates="bookings")
