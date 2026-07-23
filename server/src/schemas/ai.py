from pydantic import BaseModel
from typing import Optional

class SuggestItineraryRequest(BaseModel):
    destination: str
    days: int
    budget: str
    style: Optional[str] = 'Tự do'
    group: Optional[int] = 1

class SuggestPlacesRequest(BaseModel):
    destination: str
    category: Optional[str] = 'tổng hợp'
