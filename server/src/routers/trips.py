from fastapi import APIRouter, Depends, status, Request, Response
from typing import Any, Dict, List
from src.schemas.trip import TripCreate, TripUpdate, AddMemberRequest, UpdateMemberRequest, CreateReminderRequest
from src.dependencies.auth import get_current_user, get_trip_member, get_trip_owner
from src.config.db import db
from src.utils.api import ApiError
from src.services.fund_service import refresh_trip_contributions
from src.services.notifications_service import notify_user

router = APIRouter(prefix="/trips", tags=["trips"])
trip_fields = ['name', 'destination', 'start_date', 'end_date', 'estimated_budget', 'description', 'cover_image_url']

@router.get("")
async def list_trips(current_user: Dict[str, Any] = Depends(get_current_user)):
    res = db.table('trip_members').select('role,trip:trips(*,members:trip_members(count),fund:shared_funds(target_amount))').eq('user_id', current_user['id']).execute()
    memberships = res.data or []
    
    result = []
    for m in memberships:
        trip = m.get('trip')
        if trip:
            trip['role'] = m.get('role')
            result.append(trip)
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_trip(trip_in: TripCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    payload = trip_in.model_dump(exclude_unset=True)
    payload['created_by'] = current_user['id']
    
    # Supabase date formatting issue workaround if needed, pydantic usually handles it to ISO string.
    for k, v in payload.items():
        if hasattr(v, 'isoformat'):
            payload[k] = v.isoformat()
            
    res = db.table('trips').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to create trip')
        
    trip = res.data[0]
    
    # create member and fund
    db.table('trip_members').insert({
        'trip_id': trip['id'],
        'user_id': current_user['id'],
        'role': 'owner',
        'contribution_status': 'unpaid'
    }).execute()
    
    db.table('shared_funds').insert({
        'trip_id': trip['id'],
        'target_amount': trip.get('estimated_budget', 0)
    }).execute()
    
    return trip

@router.get("/{tripId}")
async def get_trip(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('trips').select('*,members:trip_members(*,profile:profiles(id,email,full_name,avatar_url)),fund:shared_funds(*)').eq('id', trip_id).execute()
    if not res.data:
        raise ApiError(404, 'Trip not found')
    return res.data[0]

@router.patch("/{tripId}")
async def update_trip(request: Request, trip_in: TripUpdate, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    payload = trip_in.model_dump(exclude_unset=True)
    if not payload:
        raise ApiError(400, 'No fields to update')
        
    for k, v in payload.items():
        if hasattr(v, 'isoformat'):
            payload[k] = v.isoformat()
            
    res = db.table('trips').update(payload).eq('id', trip_id).execute()
    if not res.data:
        raise ApiError(500, 'Failed to update trip')
    return res.data[0]

@router.delete("/{tripId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(request: Request, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    db.table('trips').delete().eq('id', trip_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{tripId}/members")
async def list_members(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('trip_members').select('*,profile:profiles(id,email,full_name,avatar_url,phone)').eq('trip_id', trip_id).order('created_at').execute()
    return res.data or []

@router.post("/{tripId}/members", status_code=status.HTTP_201_CREATED)
async def add_member(request: Request, member_in: AddMemberRequest, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    email = member_in.email.lower()
    
    res = db.table('profiles').select('id,email,full_name,avatar_url').eq('email', email).execute()
    profile = res.data[0] if res.data else None
    
    if not profile:
        raise ApiError(404, 'No registered user found with that email')
        
    member_res = db.table('trip_members').insert({
        'trip_id': trip_id,
        'user_id': profile['id'],
        'role': member_in.role or 'member'
    }).execute()
    
    if not member_res.data:
        raise ApiError(500, 'Failed to add member')
    member = member_res.data[0]
    
    await refresh_trip_contributions(trip_id)
    await notify_user(profile['id'], trip_id, 'member_added', 'Bạn đã được thêm vào chuyến đi', 'Mở UsTrip để xem kế hoạch mới.')
    
    return {**member, "profile": profile}

@router.patch("/{tripId}/members/{userId}")
async def update_member(request: Request, member_in: UpdateMemberRequest, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    user_id = request.path_params.get('userId')
    changes = member_in.model_dump(exclude_unset=True)
    if not changes:
        raise ApiError(400, 'No fields to update')
        
    res = db.table('trip_members').update(changes).eq('trip_id', trip_id).eq('user_id', user_id).execute()
    if not res.data:
        raise ApiError(404, 'Member not found')
    return res.data[0]

@router.delete("/{tripId}/members/{userId}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(request: Request, current_user: Dict[str, Any] = Depends(get_trip_owner)):
    trip_id = request.path_params.get('tripId')
    user_id = request.path_params.get('userId')
    
    if user_id == current_user['id']:
        raise ApiError(400, 'Trip owner cannot remove themselves')
        
    db.table('trip_members').delete().eq('trip_id', trip_id).eq('user_id', user_id).execute()
    await refresh_trip_contributions(trip_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{tripId}/reminders", status_code=status.HTTP_201_CREATED)
async def create_reminder(request: Request, reminder_in: CreateReminderRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    if reminder_in.recipient_id == current_user['id']:
        raise ApiError(400, 'Bạn không thể tự gửi nhắc nhở cho chính mình.')
        
    payload = {
        'trip_id': trip_id,
        'recipient_id': reminder_in.recipient_id,
        'created_by': current_user['id'],
        'message': reminder_in.message
    }
    res = db.table('reminders').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to create reminder')
    reminder = res.data[0]
    
    await notify_user(reminder['recipient_id'], trip_id, 'contribution_reminder', 'Nhắc đóng góp', reminder['message'])
    return reminder

@router.get("/{tripId}/reminders")
async def list_reminders(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('reminders').select('*,recipient:profiles!recipient_id(id,full_name,email,avatar_url)').eq('trip_id', trip_id).order('sent_at', desc=True).execute()
    return res.data or []
