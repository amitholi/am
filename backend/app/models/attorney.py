from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Attorney(Base):
    __tablename__ = "attorneys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    license_number = Column(String(20), unique=True)
    firm_name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case_attorneys = relationship("CaseAttorney", back_populates="attorney")


class CaseAttorney(Base):
    __tablename__ = "case_attorneys"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"))
    attorney_id = Column(Integer, ForeignKey("attorneys.id"))
    party_id = Column(Integer, ForeignKey("parties.id"))
    role = Column(String(50))  # ב"כ תובע, ב"כ נתבע

    case = relationship("Case", back_populates="case_attorneys")
    attorney = relationship("Attorney", back_populates="case_attorneys")
    party = relationship("Party", back_populates="case_attorneys")
