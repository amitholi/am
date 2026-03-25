from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class HearingOut(BaseModel):
    id: int
    case_id: int
    hearing_date: Optional[datetime] = None
    hearing_type: Optional[str] = None
    courtroom: Optional[str] = None
    judge_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
