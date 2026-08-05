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
    fund_per_person = float(fund.get('target_amount', 0)) / max(len(members), 1) if fund else 0
            
    return {
        "total_budget": float(trip.get('estimated_budget', 0)),
        "total_shared_fund": float(fund.get('target_amount', 0)),
        "fund_per_person": fund_per_person,
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

@router.get("/trips/{tripId}/member-reports")
async def member_reports(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    # 1. Fetch members
    members_res = db.table('trip_members').select('user_id, profile:profiles(id,full_name,avatar_url)').eq('trip_id', trip_id).execute()
    members = members_res.data or []
    
    # 2. Fetch fund contributions
    contrib_res = db.table('fund_contributions').select('user_id,amount').eq('trip_id', trip_id).eq('payment_status', 'success').execute()
    contributions = contrib_res.data or []
    
    # 3. Fetch ALL expenses and splits
    expenses_res = db.table('expenses').select('id,title,amount,paid_by,payment_source,splits:expense_splits(user_id,amount_owed,is_settled)').eq('trip_id', trip_id).execute()
    expenses = expenses_res.data or []
    
    reports = {m['user_id']: {
        "user_id": m['user_id'], 
        "profile": m['profile'],
        "fund_contributed": 0,
        "fund_consumed": 0,
        "fund_balance": 0,
        "personal_paid": 0,
        "personal_consumed": 0,
        "personal_balance": 0
    } for m in members}
    
    # Aggregate fund contributions
    for c in contributions:
        uid = c['user_id']
        if uid in reports:
            reports[uid]['fund_contributed'] += float(c.get('amount', 0))
            
    # Aggregate expenses
    for expense in expenses:
        payer_id = expense['paid_by']
        source = expense.get('payment_source')
        is_settlement = (expense.get('title') == 'Thanh toán nợ tối ưu')
        
        splits = expense.get('splits') or []
        for split in splits:
            uid = split['user_id']
            amount_owed = float(split['amount_owed'])
            
            if source == 'shared_fund':
                if uid in reports:
                    reports[uid]['fund_consumed'] += amount_owed
            elif source == 'personal':
                # Personal consumed (ignore settlements for the consumption total)
                if not is_settlement and uid in reports:
                    reports[uid]['personal_consumed'] += amount_owed
                
                # Personal balance (unsettled debts)
                if not split.get('is_settled') and uid != payer_id:
                    if uid in reports:
                        reports[uid]['personal_balance'] -= amount_owed
                    if payer_id in reports:
                        reports[payer_id]['personal_balance'] += amount_owed

        if source == 'personal' and not is_settlement and payer_id in reports:
            reports[payer_id]['personal_paid'] += float(expense.get('amount', 0))
            
    # Final calculations
    for uid, rep in reports.items():
        rep['fund_balance'] = rep['fund_contributed'] - rep['fund_consumed']
        
    return list(reports.values())
