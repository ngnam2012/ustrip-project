from pydantic import BaseModel, Field
from typing import Optional

class PushTokenRequest(BaseModel):
    token: str = Field(min_length=20, max_length=300)
    platform: Optional[str] = 'unknown'

class RemovePushTokenRequest(BaseModel):
    token: str = Field(min_length=20, max_length=300)
