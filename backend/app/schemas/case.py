from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from app.schemas.court import CourtOut


class CaseBase(BaseModel):
    case_number: str
    case_type: str
    case_type_description: Optional[str] = None
    court_id: Optional[int] = None
    filing_date: Optional[date] = None
    status: Optional[str] = None
    status_date: Optional[date] = None
    judge_name: Optional[str] = None
    judge_id: Optional[int] = None
    description: Optional[str] = None
    decision_type: Optional[str] = None
    source_url: Optional[str] = None


class CaseOut(CaseBase):
    id: int
    court: Optional[CourtOut] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CaseListOut(BaseModel):
    id: int
    case_number: str
    case_type: str
    case_type_description: Optional[str] = None
    court_id: Optional[int] = None
    court_name: Optional[str] = None
    filing_date: Optional[date] = None
    status: Optional[str] = None
    judge_name: Optional[str] = None
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedCases(BaseModel):
    items: List[CaseListOut]
    total: int
    page: int
    per_page: int
    pages: int
    facets: Optional[dict] = None
