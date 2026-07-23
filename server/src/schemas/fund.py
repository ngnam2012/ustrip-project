from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FundUpdate(BaseModel):
    target_amount: float

class ContributionCreate(BaseModel):
    user_id: str
    amount: float
    payment_proof_url: Optional[str] = None
    note: Optional[str] = None
    contributed_at: Optional[datetime] = None

class ContributionUpdate(BaseModel):
    amount: Optional[float] = None
    payment_proof_url: Optional[str] = None
    note: Optional[str] = None
    contributed_at: Optional[datetime] = None
