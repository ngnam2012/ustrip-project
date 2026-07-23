from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class TripCreate(BaseModel):
    name: str = Field(min_length=2)
    destination: str
    start_date: datetime
    end_date: datetime
    estimated_budget: Optional[float] = 0
    description: Optional[str] = None
    cover_image_url: Optional[str] = None

class TripUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    destination: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    estimated_budget: Optional[float] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None

class AddMemberRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = 'member'

class UpdateMemberRequest(BaseModel):
    role: Optional[str] = None
    contribution_status: Optional[str] = None
    paid_amount: Optional[float] = None
    remaining_amount: Optional[float] = None

class CreateReminderRequest(BaseModel):
    recipient_id: str
    message: Optional[str] = 'Nhắc bạn hoàn tất khoản đóng góp cho chuyến đi.'
