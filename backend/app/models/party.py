from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Party(Base):
    __tablename__ = "parties"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    party_type = Column(String(50))  # תובע, נתבע, מבקש, משיב, מערער
    party_number = Column(Integer)
    id_number = Column(String(20))
    entity_type = Column(String(50))  # אדם פרטי, חברה, עמותה, רשות
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="parties")
    case_attorneys = relationship("CaseAttorney", back_populates="party")

    __table_args__ = (
        Index("idx_parties_name", "name"),
        Index("idx_parties_case_id", "case_id"),
    )
