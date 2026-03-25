from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourtBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    court_type: str
    district: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


class CourtOut(CourtBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
