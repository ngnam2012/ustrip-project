from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time

class ActivityBase(BaseModel):
    title: str = Field(min_length=1)
    activity_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    location_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    map_provider: Optional[str] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    participants: Optional[List[str]] = []

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    activity_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    location_name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None
    map_provider: Optional[str] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None
    participants: Optional[List[str]] = None
