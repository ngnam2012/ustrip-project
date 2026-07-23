from fastapi import APIRouter, Depends, Request
from typing import Any, Dict
from src.dependencies.auth import get_trip_member
from src.config.db import db
from src.utils.api import ApiError

router = APIRouter(tags=["dashboard"])

@router.get("/trips/{tripId}/financial-summary")
async def financial_summary(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    trip_res = db.table('trips').select('estimated_budget').eq('id', trip_id).execute()
    fund_res = db.table('shared_funds').select('target_amount').eq('trip_id', trip_id).execute()
    members_res = db.table('trip_members').select('*,profile:profiles(id,full_name,avatar_url)').eq('trip_id', trip_id).execute()
    contrib_res = db.table('fund_contributions').select('amount').eq('trip_id', trip_id).eq('payment_status', 'success').execute()
    expense_res = db.table('expenses').select('*,payer:profiles!paid_by(id,full_name)').eq('trip_id', trip_id).order('expense_date', desc=True).execute()
    
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
        
    trip = trip_res.data[0]
    fund = fund_res.data[0] if fund_res.data else {}
    members = members_res.data or []
    contributions = contrib_res.data or []
    expense_rows = expense_res.data or []
    
    total_collected = sum(float(x.get('amount', 0)) for x in contributions)
    total_spent = sum(float(x.get('amount', 0)) for x in expense_rows)
    fund_spent = sum(float(x.get('amount', 0)) for x in expense_rows if x.get('payment_source') == 'shared_fund')
    personal_spent = sum(float(x.get('amount', 0)) for x in expense_rows if x.get('payment_source') == 'personal')
    
    by_category = {}
    by_day = {}
    for x in expense_rows:
        cat = x.get('category')
        amt = float(x.get('amount', 0))
        date = x.get('expense_date')
        
        if cat:
            by_category[cat] = by_category.get(cat, 0) + amt
        if date:
            by_day[date] = by_day.get(date, 0) + amt
            
    return {
        "total_budget": float(trip.get('estimated_budget', 0)),
        "total_shared_fund": float(fund.get('target_amount', 0)),
        "total_collected": total_collected,
        "total_spent": total_spent,
        "fund_spent": fund_spent,
        "personal_spent": personal_spent,
        "remaining_fund": total_collected - fund_spent,
        "by_category": by_category,
        "by_day": by_day,
        "members": members,
        "recent_expenses": expense_rows[:5],
        "unpaid_members": [m for m in members if m.get('contribution_status') != 'paid']
    }

@router.get("/trips/{tripId}/dashboard")
async def dashboard(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    trip_res = db.table('trips').select('*,members:trip_members(count)').eq('id', trip_id).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
        
    activities_res = db.table('itinerary_activities').select('*').eq('trip_id', trip_id).order('activity_date').order('start_time').execute()
    expenses_res = db.table('expenses').select('*').eq('trip_id', trip_id).order('created_at', desc=True).limit(5).execute()
    
    activity_rows = activities_res.data or []
    
    return {
        "trip": trip_res.data[0],
        "upcoming_activities": activity_rows[:5],
        "map_activities": activity_rows,
        "recent_expenses": expenses_res.data or []
    }
