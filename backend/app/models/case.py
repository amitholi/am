from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Text, JSON, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import TSVECTOR, JSONB
from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), nullable=False, index=True)
    case_type = Column(String(10), nullable=False, index=True)  # ת"א, ת"צ, ע"א וכו'
    case_type_description = Column(String(255))
    court_id = Column(Integer, ForeignKey("courts.id"), index=True)
    filing_date = Column(Date, index=True)
    status = Column(String(50), index=True)  # פתוח, סגור, מחוק
    status_date = Column(Date)
    judge_name = Column(String(255))
    judge_id = Column(Integer, ForeignKey("judges.id"), index=True)
    description = Column(Text)
    decision_type = Column(String(100))
    source_url = Column(Text)
    raw_data = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    search_vector = Column(TSVECTOR)

    court = relationship("Court", back_populates="cases")
    judge = relationship("Judge", back_populates="cases")
    parties = relationship("Party", back_populates="case", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    hearings = relationship("Hearing", back_populates="case", cascade="all, delete-orphan")
    case_attorneys = relationship("CaseAttorney", back_populates="case", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("case_number", "court_id", name="uq_case_number_court"),
        Index("idx_cases_search", "search_vector", postgresql_using="gin"),
    )
