from pydantic import BaseModel
from typing import Optional

class SuggestItineraryRequest(BaseModel):
    destination: str = "Đà Lạt"  # MVP: locked to Đà Lạt
    days: int
    budget: str
    style: Optional[str] = 'Tự do'
    group: Optional[int] = 1

class SuggestPlacesRequest(BaseModel):
    destination: str = "Đà Lạt"  # MVP: locked to Đà Lạt
    category: Optional[str] = 'tổng hợp'
