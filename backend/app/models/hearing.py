from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Hearing(Base):
    __tablename__ = "hearings"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hearing_date = Column(DateTime(timezone=True))
    hearing_type = Column(String(100))  # קדם משפט, הוכחות, סיכומים
    courtroom = Column(String(50))
    judge_id = Column(Integer, ForeignKey("judges.id"))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="hearings")
    judge = relationship("Judge", back_populates="hearings")
