from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Judge(Base):
    __tablename__ = "judges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    title = Column(String(50))  # שופט, שופטת, רשם, רשמת, נשיא
    court_id = Column(Integer, ForeignKey("courts.id"))
    appointment_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    court = relationship("Court", back_populates="judges")
    cases = relationship("Case", back_populates="judge")
    hearings = relationship("Hearing", back_populates="judge")
