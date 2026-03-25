from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PartyOut(BaseModel):
    id: int
    case_id: int
    name: str
    party_type: Optional[str] = None
    party_number: Optional[int] = None
    id_number: Optional[str] = None
    entity_type: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PartyWithCases(PartyOut):
    case_count: int = 0
