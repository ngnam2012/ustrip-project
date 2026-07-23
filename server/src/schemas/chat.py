from pydantic import BaseModel
from typing import Optional

class SendMessageRequest(BaseModel):
    content: str
