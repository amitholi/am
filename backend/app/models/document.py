from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(100))  # החלטה, פסק דין, פרוטוקול, בקשה, כתב תביעה
    title = Column(String(500))
    filing_date = Column(Date)
    content = Column(Text)
    source_url = Column(Text)
    file_hash = Column(String(64), unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case", back_populates="documents")
