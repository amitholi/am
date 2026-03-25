from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class JudgeOut(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    court_id: Optional[int] = None
    court_name: Optional[str] = None
    appointment_date: Optional[date] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JudgeStats(BaseModel):
    judge_id: int
    judge_name: str
    total_cases: int
    open_cases: int
    closed_cases: int
    case_types: List[dict] = []
    cases_by_year: List[dict] = []
