from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class DocumentOut(BaseModel):
    id: int
    case_id: int
    document_type: Optional[str] = None
    title: Optional[str] = None
    filing_date: Optional[date] = None
    source_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
