from pydantic import BaseModel, Field
from typing import Optional

class PaymentCreateRequest(BaseModel):
    amount: float = Field(ge=1000, le=50000000)
    return_url: Optional[str] = None
    member_id: Optional[str] = None
    note: Optional[str] = None

class PaymentQueryRequest(BaseModel):
    payment_id: str
