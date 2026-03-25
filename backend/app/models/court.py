from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_en = Column(String(255))
    court_type = Column(String(50), nullable=False)  # שלום, מחוזי, עליון, עבודה, משפחה, תעבורה
    district = Column(String(100))
    city = Column(String(100))
    address = Column(Text)
    phone = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cases = relationship("Case", back_populates="court")
    judges = relationship("Judge", back_populates="court")
