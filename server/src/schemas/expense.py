from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

class ExpenseBase(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    payment_source: Optional[str] = None # 'shared_fund' or 'personal'
    paid_by: Optional[str] = None
    related_activity_id: Optional[str] = None
    split_method: Optional[str] = None
    bill_image_url: Optional[str] = None
    note: Optional[str] = None
    expense_date: Optional[date] = None

class ExpenseCreate(ExpenseBase):
    participants: Optional[List[str]] = []
    exact_splits: Optional[List[Dict[str, Any]]] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    payment_source: Optional[str] = None
    paid_by: Optional[str] = None
    related_activity_id: Optional[str] = None
    split_method: Optional[str] = None
    bill_image_url: Optional[str] = None
    note: Optional[str] = None
    expense_date: Optional[date] = None
    participants: Optional[List[str]] = None
    exact_splits: Optional[List[Dict[str, Any]]] = None

class SettleSplitRequest(BaseModel):
    is_settled: bool = True
