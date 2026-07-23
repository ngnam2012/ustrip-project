from fastapi import APIRouter, Depends, status, Request, Response
from typing import Any, Dict, List
from src.schemas.activity import ActivityCreate, ActivityUpdate
from src.dependencies.auth import get_trip_member, require_activity_member
from src.config.db import db
from src.utils.api import ApiError
from src.services.notifications_service import notify_trip_members

router = APIRouter(tags=["activities"])
activity_fields = ['title', 'activity_date', 'start_time', 'end_time', 'location', 'location_name', 'address', 'latitude', 'longitude', 'place_id', 'map_provider', 'estimated_cost', 'notes']

async def save_participants(activity_id: str, participants: List[str]):
    db.table('activity_participants').delete().eq('activity_id', activity_id).execute()
    if participants:
        payload = [{'activity_id': activity_id, 'user_id': uid} for uid in participants]
        db.table('activity_participants').insert(payload).execute()

@router.get("/trips/{tripId}/activities")
async def list_activities(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('itinerary_activities') \
        .select('*,participants:activity_participants(user_id,profile:profiles(id,full_name,avatar_url)),expenses(id,title,amount)') \
        .eq('trip_id', trip_id) \
        .order('activity_date') \
        .order('start_time') \
        .execute()
    return res.data or []

@router.post("/trips/{tripId}/activities", status_code=status.HTTP_201_CREATED)
async def create_activity(request: Request, activity_in: ActivityCreate, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    
    payload = {k: v for k, v in activity_in.model_dump().items() if k in activity_fields and v is not None}
    
    # Format dates/times for Supabase JSON insert
    if 'activity_date' in payload and payload['activity_date']:
        payload['activity_date'] = payload['activity_date'].isoformat()
    if 'start_time' in payload and payload['start_time']:
        payload['start_time'] = payload['start_time'].isoformat()
    if 'end_time' in payload and payload['end_time']:
        payload['end_time'] = payload['end_time'].isoformat()
        
    payload['trip_id'] = trip_id
    payload['created_by'] = current_user['id']
    
    res = db.table('itinerary_activities').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to create activity')
        
    activity = res.data[0]
    
    await save_participants(activity['id'], activity_in.participants or [])
    await notify_trip_members(trip_id, current_user['id'], 'itinerary_update', 'Lịch trình mới', activity['title'])
    
    return activity

@router.get("/activities/{activityId}")
async def get_activity(request: Request, current_user: Dict[str, Any] = Depends(require_activity_member)):
    activity_id = request.path_params.get('activityId')
    res = db.table('itinerary_activities') \
        .select('*,participants:activity_participants(user_id,profile:profiles(id,full_name,avatar_url)),expenses(*)') \
        .eq('id', activity_id) \
        .execute()
    if not res.data:
        raise ApiError(404, 'Activity not found')
    return res.data[0]

@router.patch("/activities/{activityId}")
async def update_activity(request: Request, activity_in: ActivityUpdate, current_user: Dict[str, Any] = Depends(require_activity_member)):
    activity_id = request.path_params.get('activityId')
    payload = {k: v for k, v in activity_in.model_dump(exclude_unset=True).items() if k in activity_fields}
    
    if 'activity_date' in payload and payload['activity_date']:
        payload['activity_date'] = payload['activity_date'].isoformat()
    if 'start_time' in payload and payload['start_time']:
        payload['start_time'] = payload['start_time'].isoformat()
    if 'end_time' in payload and payload['end_time']:
        payload['end_time'] = payload['end_time'].isoformat()
        
    if payload:
        res = db.table('itinerary_activities').update(payload).eq('id', activity_id).execute()
        if not res.data:
            raise ApiError(404, 'Activity not found')
        activity = res.data[0]
    else:
        activity = (db.table('itinerary_activities').select('*').eq('id', activity_id).execute()).data[0]
        
    if activity_in.participants is not None:
        await save_participants(activity_id, activity_in.participants)
        
    return activity

@router.delete("/activities/{activityId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(request: Request, current_user: Dict[str, Any] = Depends(require_activity_member)):
    activity_id = request.path_params.get('activityId')
    db.table('itinerary_activities').delete().eq('id', activity_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
