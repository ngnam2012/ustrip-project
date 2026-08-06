from fastapi import APIRouter, Depends, status, Request, Response
from typing import Any, Dict, List
from src.schemas.activity import ActivityCreate, ActivityMoveRequest, ActivityUpdate
from src.dependencies.auth import get_trip_member, require_activity_member
from src.config.db import db
from src.utils.api import ApiError
from src.services.notifications_service import notify_trip_members
from src.utils.schedule import (
    InvalidSchedule,
    activity_interval,
    conflicting_activities,
    interval_payload,
    nearest_available_slots,
    public_conflict,
    shifted_interval,
    within_trip,
)

router = APIRouter(tags=["activities"])
activity_fields = ['title', 'activity_date', 'end_date', 'start_time', 'end_time', 'location', 'location_name', 'address', 'latitude', 'longitude', 'place_id', 'map_provider', 'estimated_cost', 'notes']
schedule_fields = {'activity_date', 'end_date', 'start_time', 'end_time'}

def serialize_activity_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(payload)
    for field in schedule_fields:
        value = result.get(field)
        if value and hasattr(value, 'isoformat'):
            result[field] = value.isoformat()
    return result

def schedule_error(message: str):
    raise ApiError(422, message, code='invalid_duration')

def conflict_error(candidate, activities, trip, excluding_id=None):
    conflicts = conflicting_activities(candidate, activities, excluding_id)
    if not conflicts:
        return
    raise ApiError(
        409,
        'Khung giờ này đang trùng với hoạt động khác',
        code='schedule_conflict',
        data={
            'proposed': interval_payload(candidate),
            'conflicts': [public_conflict(item) for item in conflicts],
            'suggestions': nearest_available_slots(candidate, activities, trip, excluding_id),
        },
    )

def fetch_trip_and_activities(trip_id: str):
    trip_res = db.table('trips').select('id,name,start_date,end_date').eq('id', trip_id).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
    activities_res = db.table('itinerary_activities') \
        .select('id,title,activity_date,end_date,start_time,end_time') \
        .eq('trip_id', trip_id) \
        .execute()
    return trip_res.data[0], activities_res.data or []

def validate_schedule(activity: Dict[str, Any], trip: Dict[str, Any], activities, excluding_id=None):
    try:
        candidate = activity_interval(activity)
    except (InvalidSchedule, ValueError) as exc:
        schedule_error(str(exc))
    if not within_trip(candidate, trip):
        raise ApiError(422, 'Hoạt động phải nằm trong thời gian của chuyến đi', code='outside_trip')
    conflict_error(candidate, activities, trip, excluding_id)
    return candidate

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
    trip, activities = fetch_trip_and_activities(trip_id)
    validate_schedule(payload, trip, activities)
    payload = serialize_activity_payload(payload)
        
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

    existing_res = db.table('itinerary_activities').select('*').eq('id', activity_id).execute()
    if not existing_res.data:
        raise ApiError(404, 'Activity not found')
    existing = existing_res.data[0]

    if schedule_fields.intersection(payload.keys()):
        trip, activities = fetch_trip_and_activities(existing['trip_id'])
        validate_schedule({**existing, **payload}, trip, activities, activity_id)
    payload = serialize_activity_payload(payload)
        
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

@router.post("/activities/{activityId}/move")
async def move_activity(request: Request, move_in: ActivityMoveRequest, current_user: Dict[str, Any] = Depends(require_activity_member)):
    activity_id = request.path_params.get('activityId')
    existing_res = db.table('itinerary_activities').select('*').eq('id', activity_id).execute()
    if not existing_res.data:
        raise ApiError(404, 'Activity not found')
    activity = existing_res.data[0]
    trip, activities = fetch_trip_and_activities(activity['trip_id'])

    try:
        candidate = shifted_interval(
            activity,
            move_in.source_occurrence_date,
            move_in.target_occurrence_date,
            move_in.start_time_override,
        )
    except (InvalidSchedule, ValueError) as exc:
        schedule_error(str(exc))

    if not within_trip(candidate, trip):
        raise ApiError(422, 'Không thể chuyển hoạt động ra ngoài thời gian chuyến đi', code='outside_trip')
    conflict_error(candidate, activities, trip, activity_id)

    payload = interval_payload(candidate)
    updated_res = db.table('itinerary_activities').update(payload).eq('id', activity_id).execute()
    if not updated_res.data:
        raise ApiError(404, 'Activity not found')
    updated = updated_res.data[0]

    actor_name = current_user.get('full_name') or 'Một thành viên'
    await notify_trip_members(
        activity['trip_id'],
        current_user['id'],
        'itinerary_update',
        'Lịch trình đã thay đổi',
        f"{actor_name} đã chuyển {activity['title']} sang {payload['activity_date']} {payload['start_time'][:5]}",
    )
    return updated

@router.delete("/activities/{activityId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(request: Request, current_user: Dict[str, Any] = Depends(require_activity_member)):
    activity_id = request.path_params.get('activityId')
    db.table('itinerary_activities').delete().eq('id', activity_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
