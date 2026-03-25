from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AttorneyOut(BaseModel):
    id: int
    name: str
    license_number: Optional[str] = None
    firm_name: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
