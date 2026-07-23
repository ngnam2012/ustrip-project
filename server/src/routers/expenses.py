from fastapi import APIRouter, Depends, status, Request, Response
from typing import Any, Dict, List
from datetime import datetime
from src.schemas.expense import ExpenseCreate, ExpenseUpdate, SettleSplitRequest
from src.dependencies.auth import get_trip_member, require_expense_member, require_split_member
from src.config.db import db
from src.utils.api import ApiError
from src.services.notifications_service import notify_trip_members
from src.utils.split import compute_equal_splits

router = APIRouter(tags=["expenses"])
expense_fields = ['title', 'amount', 'category', 'payment_source', 'paid_by', 'related_activity_id', 'split_method', 'bill_image_url', 'note', 'expense_date']

async def assert_personal_payer(trip_id: str, payer_id: str):
    res = db.table('trip_members').select('id').eq('trip_id', trip_id).eq('user_id', payer_id).execute()
    if not res.data:
        raise ApiError(422, 'Personal expense payer must be a member of the trip')

async def normalize_participants(trip_id: str, participants: List[str]) -> List[str]:
    if not participants:
        raise ApiError(422, 'Select at least one person this expense was paid for')
    unique_ids = list(set([p for p in participants if p]))
    if not unique_ids:
        raise ApiError(422, 'Select at least one person this expense was paid for')
        
    res = db.table('trip_members').select('user_id').eq('trip_id', trip_id).in_('user_id', unique_ids).execute()
    members = res.data or []
    if len(members) != len(unique_ids):
        raise ApiError(422, 'Every selected person must be a member of the trip')
    return unique_ids

async def available_fund_balance(trip_id: str, excluding_expense_id: str = None) -> float:
    contrib_res = db.table('fund_contributions').select('amount').eq('trip_id', trip_id).eq('payment_status', 'success').execute()
    fund_exp_res = db.table('expenses').select('id,amount').eq('trip_id', trip_id).eq('payment_source', 'shared_fund').execute()
    
    collected = sum(float(item.get('amount', 0)) for item in (contrib_res.data or []))
    spent = sum(float(item.get('amount', 0)) for item in (fund_exp_res.data or []) if item.get('id') != excluding_expense_id)
    return collected - spent

async def normalize_expense_payload(request: Request, payload_in: Dict[str, Any], current_user: Dict[str, Any], existing: Dict[str, Any] = None) -> Dict[str, Any]:
    trip_id = existing.get('trip_id') if existing else request.path_params.get('tripId')
    payment_source = payload_in.get('payment_source') or (existing.get('payment_source') if existing else 'personal')
    amount = float(payload_in.get('amount') if payload_in.get('amount') is not None else (existing.get('amount') if existing else 0))
    
    payload = {k: v for k, v in payload_in.items() if k in expense_fields}
    if 'expense_date' in payload and payload['expense_date']:
        payload['expense_date'] = payload['expense_date'].isoformat()
        
    if payment_source == 'shared_fund':
        if getattr(request.state, 'trip_role', None) != 'owner':
            raise ApiError(403, 'Only the trip owner can record an expense paid from the shared fund')
            
        balance = await available_fund_balance(trip_id, existing.get('id') if existing else None)
        if amount > balance:
            raise ApiError(422, f"Shared fund balance is only {balance:,.0f} VND")
        
        payload['payment_source'] = 'shared_fund'
        payload['paid_by'] = None
        return payload
        
    payer_id = payload.get('paid_by') or (existing.get('paid_by') if existing else current_user['id'])
    await assert_personal_payer(trip_id, payer_id)
    
    payload['payment_source'] = 'personal'
    payload['paid_by'] = payer_id
    return payload

async def save_participants(expense_id: str, participants: List[str]):
    db.table('expense_participants').delete().eq('expense_id', expense_id).execute()
    if participants:
        payload = [{'expense_id': expense_id, 'user_id': uid} for uid in participants]
        db.table('expense_participants').insert(payload).execute()

@router.get("/trips/{tripId}/expenses")
async def list_expenses(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('expenses') \
        .select('*,payer:profiles!paid_by(id,full_name,avatar_url),activity:itinerary_activities(id,title),participants:expense_participants(user_id)') \
        .eq('trip_id', trip_id) \
        .order('expense_date', desc=True) \
        .execute()
    return res.data or []

@router.post("/trips/{tripId}/expenses", status_code=status.HTTP_201_CREATED)
async def create_expense(request: Request, expense_in: ExpenseCreate, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    payload = await normalize_expense_payload(request, expense_in.model_dump(exclude_unset=True), current_user)
    
    participant_ids = []
    if payload.get('payment_source') == 'personal':
        participant_ids = await normalize_participants(trip_id, expense_in.participants or [])
        
    payload['trip_id'] = trip_id
    res = db.table('expenses').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to create expense')
    expense = res.data[0]
    
    if expense.get('payment_source') == 'personal':
        await save_participants(expense['id'], participant_ids)
        
    payment_src_text = 'chi từ quỹ chung' if expense.get('payment_source') == 'shared_fund' else 'thành viên trả hộ'
    await notify_trip_members(trip_id, current_user['id'], 'new_expense', 'Chi tiêu mới', f"{expense['title']}: {expense['amount']} ({payment_src_text})")
    
    return expense

@router.get("/expenses/{expenseId}")
async def get_expense(request: Request, current_user: Dict[str, Any] = Depends(require_expense_member)):
    expense_id = request.path_params.get('expenseId')
    res = db.table('expenses') \
        .select('*,payer:profiles!paid_by(id,full_name,avatar_url),activity:itinerary_activities(id,title),participants:expense_participants(user_id,profile:profiles(id,full_name,avatar_url)),splits:expense_splits(*,profile:profiles(id,full_name,avatar_url))') \
        .eq('id', expense_id) \
        .execute()
    if not res.data:
        raise ApiError(404, 'Expense not found')
    return res.data[0]

@router.patch("/expenses/{expenseId}")
async def update_expense(request: Request, expense_in: ExpenseUpdate, current_user: Dict[str, Any] = Depends(require_expense_member)):
    expense_id = request.path_params.get('expenseId')
    
    existing_res = db.table('expenses').select('*').eq('id', expense_id).execute()
    if not existing_res.data:
        raise ApiError(404, 'Expense not found')
    existing = existing_res.data[0]
    
    payload = await normalize_expense_payload(request, expense_in.model_dump(exclude_unset=True), current_user, existing)
    
    participant_ids = None
    if payload.get('payment_source') == 'personal' and (expense_in.participants is not None or existing.get('payment_source') != 'personal'):
        participant_ids = await normalize_participants(existing['trip_id'], expense_in.participants or [])
        
    res = db.table('expenses').update(payload).eq('id', expense_id).execute()
    if not res.data:
        raise ApiError(500, 'Failed to update expense')
    expense = res.data[0]
    
    if expense.get('payment_source') == 'shared_fund':
        db.table('expense_participants').delete().eq('expense_id', expense['id']).execute()
        db.table('expense_splits').delete().eq('expense_id', expense['id']).execute()
    else:
        if participant_ids is not None:
            await save_participants(expense['id'], participant_ids)
        if participant_ids is not None or expense_in.amount is not None:
            db.table('expense_splits').delete().eq('expense_id', expense['id']).execute()
            
    return expense

@router.delete("/expenses/{expenseId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(request: Request, current_user: Dict[str, Any] = Depends(require_expense_member)):
    expense_id = request.path_params.get('expenseId')
    db.table('expenses').delete().eq('id', expense_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/expenses/{expenseId}/split", status_code=status.HTTP_201_CREATED)
async def split_expense(request: Request, current_user: Dict[str, Any] = Depends(require_expense_member)):
    expense_id = request.path_params.get('expenseId')
    res = db.table('expenses').select('amount,trip_id,payment_source,participants:expense_participants(user_id)').eq('id', expense_id).execute()
    if not res.data:
        raise ApiError(404, 'Expense not found')
    expense = res.data[0]
    
    if expense.get('payment_source') == 'shared_fund':
        raise ApiError(422, 'Expenses paid from the shared fund do not create personal debt')
        
    participants = expense.get('participants') or []
    participant_ids = [p['user_id'] for p in participants]
    
    if not participant_ids:
        raise ApiError(422, 'At least one participant is required')
        
    amount = float(expense.get('amount', 0))
    splits = compute_equal_splits(amount, participant_ids, expense_id)
        
    db.table('expense_splits').delete().eq('expense_id', expense_id).execute()
    splits_res = db.table('expense_splits').insert(splits).execute()
    return splits_res.data or []

@router.get("/trips/{tripId}/settlements")
async def get_settlements(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('expenses').select('id,title,amount,paid_by,payer:profiles!paid_by(id,full_name),splits:expense_splits(*,profile:profiles(id,full_name))').eq('trip_id', trip_id).eq('payment_source', 'personal').execute()
    expenses = res.data or []
    
    result = []
    for expense in expenses:
        splits = expense.get('splits') or []
        for split in splits:
            if split['user_id'] != expense['paid_by']:
                result.append({
                    **split,
                    "expense_title": expense['title'],
                    "owed_to": expense.get('payer')
                })
    return result

@router.patch("/splits/{splitId}/settled")
async def settle_split(request: Request, split_in: SettleSplitRequest, current_user: Dict[str, Any] = Depends(require_split_member)):
    split_id = request.path_params.get('splitId')
    settled = split_in.is_settled
    
    payload = {
        "is_settled": settled,
        "settled_at": datetime.utcnow().isoformat() if settled else None
    }
    
    res = db.table('expense_splits').update(payload).eq('id', split_id).execute()
    if not res.data:
        raise ApiError(404, 'Split not found')
    return res.data[0]

@router.get("/trips/{tripId}/optimized-settlements")
async def get_optimized_settlements(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    # We need to get all unsettled splits
    res = db.table('expenses').select('id,paid_by,splits:expense_splits(*)').eq('trip_id', trip_id).eq('payment_source', 'personal').execute()
    expenses = res.data or []
    
    balances = {} # user_id -> float
    
    for expense in expenses:
        payer_id = expense['paid_by']
        splits = expense.get('splits') or []
        for split in splits:
            if not split['is_settled'] and split['user_id'] != payer_id:
                debtor_id = split['user_id']
                amount = float(split['amount_owed'])
                
                balances[debtor_id] = balances.get(debtor_id, 0) - amount
                balances[payer_id] = balances.get(payer_id, 0) + amount

    debtors = []
    creditors = []
    for uid, bal in balances.items():
        if bal < -0.01:
            debtors.append({"user_id": uid, "amount": -bal})
        elif bal > 0.01:
            creditors.append({"user_id": uid, "amount": bal})
            
    debtors.sort(key=lambda x: x['amount'], reverse=True)
    creditors.sort(key=lambda x: x['amount'], reverse=True)
    
    optimized = []
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        debt = debtors[i]['amount']
        credit = creditors[j]['amount']
        
        settle_amount = min(debt, credit)
        
        optimized.append({
            "debtor_id": debtors[i]['user_id'],
            "creditor_id": creditors[j]['user_id'],
            "amount": round(settle_amount, 2)
        })
        
        debtors[i]['amount'] -= settle_amount
        creditors[j]['amount'] -= settle_amount
        
        if debtors[i]['amount'] < 0.01:
            i += 1
        if creditors[j]['amount'] < 0.01:
            j += 1
            
    # fetch user profiles for the optimized list
    user_ids = set()
    for opt in optimized:
        user_ids.add(opt['debtor_id'])
        user_ids.add(opt['creditor_id'])
        
    profiles = {}
    if user_ids:
        profiles_res = db.table('profiles').select('id,full_name,avatar_url').in_('id', list(user_ids)).execute()
        for p in (profiles_res.data or []):
            profiles[p['id']] = p
            
    for opt in optimized:
        opt['debtor_profile'] = profiles.get(opt['debtor_id'])
        opt['creditor_profile'] = profiles.get(opt['creditor_id'])

    return optimized
