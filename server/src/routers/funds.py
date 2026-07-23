from fastapi import APIRouter, Depends, status, Request, Response
from typing import Any, Dict
from datetime import datetime
from src.schemas.fund import FundUpdate, ContributionCreate, ContributionUpdate
from src.dependencies.auth import get_trip_member, get_trip_owner, require_contribution_member
from src.config.db import db
from src.utils.api import ApiError
from src.services.fund_service import refresh_member_contribution, refresh_trip_contributions

router = APIRouter(tags=["funds"])

@router.get("/trips/{tripId}/fund")
async def get_fund(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    fund_res = db.table('shared_funds').select('*').eq('trip_id', trip_id).execute()
    if not fund_res.data:
        raise ApiError(404, 'Fund not found')
    fund = fund_res.data[0]
    
    contributions_res = db.table('fund_contributions').select('amount').eq('trip_id', trip_id).eq('payment_status', 'success').execute()
    expenses_res = db.table('expenses').select('amount').eq('trip_id', trip_id).eq('payment_source', 'shared_fund').execute()
    personal_res = db.table('expenses').select('amount').eq('trip_id', trip_id).eq('payment_source', 'personal').execute()
    
    total_collected = sum(float(item.get('amount', 0)) for item in (contributions_res.data or []))
    fund_spent = sum(float(item.get('amount', 0)) for item in (expenses_res.data or []))
    personal_spent = sum(float(item.get('amount', 0)) for item in (personal_res.data or []))
    
    return {
        **fund,
        "total_collected": total_collected,
        "fund_spent": fund_spent,
        "personal_spent": personal_spent,
        "total_trip_expenses": fund_spent + personal_spent,
        "remaining_to_target": max(0, float(fund.get('target_amount', 0)) - total_collected),
        "current_balance": total_collected - fund_spent
    }

@router.patch("/trips/{tripId}/fund")
async def update_fund(request: Request, fund_in: FundUpdate, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    res = db.table('shared_funds').update({"target_amount": fund_in.target_amount}).eq('trip_id', trip_id).execute()
    if not res.data:
        raise ApiError(404, 'Fund not found')
        
    await refresh_trip_contributions(trip_id)
    return res.data[0]

@router.get("/trips/{tripId}/contributions")
async def list_contributions(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('fund_contributions').select('*,profile:profiles(id,full_name,email,avatar_url)').eq('trip_id', trip_id).order('contributed_at', desc=True).execute()
    return res.data or []

@router.post("/trips/{tripId}/contributions", status_code=status.HTTP_201_CREATED)
async def add_contribution(request: Request, contrib_in: ContributionCreate, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    payload = contrib_in.model_dump(exclude_unset=True)
    if 'contributed_at' in payload and payload['contributed_at']:
        payload['contributed_at'] = payload['contributed_at'].isoformat()
        
    payload.update({
        "trip_id": trip_id,
        "payment_method": "manual",
        "payment_status": "success",
        "paid_at": datetime.utcnow().isoformat()
    })
    
    res = db.table('fund_contributions').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to add contribution')
        
    contribution = res.data[0]
    await refresh_member_contribution(trip_id, contribution['user_id'])
    
    return contribution

@router.patch("/contributions/{contributionId}")
async def update_contribution(request: Request, contrib_in: ContributionUpdate, current_user: Dict[str, Any] = Depends(require_contribution_member)):
    contribution_id = request.path_params.get('contributionId')
    payload = contrib_in.model_dump(exclude_unset=True)
    if 'contributed_at' in payload and payload['contributed_at']:
        payload['contributed_at'] = payload['contributed_at'].isoformat()
        
    res = db.table('fund_contributions').update(payload).eq('id', contribution_id).execute()
    if not res.data:
        raise ApiError(404, 'Contribution not found')
        
    contribution = res.data[0]
    await refresh_member_contribution(contribution['trip_id'], contribution['user_id'])
    
    return contribution
