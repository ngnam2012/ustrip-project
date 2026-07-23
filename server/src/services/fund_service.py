from src.config.db import db

async def refresh_member_contribution(trip_id: str, user_id: str):
    contributions_res = db.table('fund_contributions') \
        .select('amount') \
        .eq('trip_id', trip_id) \
        .eq('user_id', user_id) \
        .eq('payment_status', 'success') \
        .execute()
    contributions = contributions_res.data or []
    fund_res = db.table('shared_funds') \
        .select('target_amount') \
        .eq('trip_id', trip_id) \
        .execute()
    fund = fund_res.data[0] if fund_res.data else None
    
    members_res = db.table('trip_members') \
        .select('*', count='exact') \
        .eq('trip_id', trip_id) \
        .execute()
    count = members_res.count if hasattr(members_res, 'count') and members_res.count is not None else len(members_res.data or [])
    
    paid = sum(float(item.get('amount', 0)) for item in contributions)
    expected = float(fund.get('target_amount', 0) if fund else 0) / max(count, 1)
    
    if paid >= expected and expected > 0:
        status = 'paid'
    elif paid > 0:
        status = 'partial'
    else:
        status = 'unpaid'
        
    db.table('trip_members').update({
        'paid_amount': paid,
        'remaining_amount': max(0, expected - paid),
        'contribution_status': status
    }).eq('trip_id', trip_id).eq('user_id', user_id).execute()

async def refresh_trip_contributions(trip_id: str):
    members_res = db.table('trip_members').select('user_id').eq('trip_id', trip_id).execute()
    members = members_res.data or []
    for member in members:
        await refresh_member_contribution(trip_id, member['user_id'])
