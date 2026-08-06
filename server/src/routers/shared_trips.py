from fastapi import APIRouter, Depends, Request, Response, status
from typing import Any, Dict, List, Optional
from src.schemas.trip import ShareTripRequest
from src.dependencies.auth import get_current_user, get_trip_owner, get_trip_member
from src.config.db import db
from src.utils.api import ApiError

router = APIRouter(tags=["shared-trips"])


# ---------------------------------------------------------------------------
# Helper: assert a trip is accessible (public, or link-accessible by id, or member)
# ---------------------------------------------------------------------------
def _assert_shared_trip_accessible(trip: Dict[str, Any], user_id: str) -> None:
    """Raises 403 if the trip is private and the user is not a member."""
    visibility = trip.get('visibility', 'private')
    if visibility == 'private':
        # Check membership
        mem = db.table('trip_members').select('id').eq('trip_id', trip['id']).eq('user_id', user_id).execute()
        if not mem.data:
            raise ApiError(403, 'This trip is private')


# ---------------------------------------------------------------------------
# Community feed — returns all public trips with aggregate stats
# GET /shared-trips
# ---------------------------------------------------------------------------
@router.get("/shared-trips")
async def list_shared_trips(
    current_user: Dict[str, Any] = Depends(get_current_user),
    destination: Optional[str] = None,
    limit: int = 24,
    offset: int = 0,
):
    query = db.table('trips').select(
        'id,name,destination,start_date,end_date,cover_image_url,visibility,description,'
        'created_by,created_at,'
        'author:profiles!created_by(id,full_name,avatar_url)'
    ).eq('visibility', 'public').order('created_at', desc=True).range(offset, offset + limit - 1)

    if destination:
        query = query.ilike('destination', f'%{destination}%')

    res = query.execute()
    trips = res.data or []

    return trips


# ---------------------------------------------------------------------------
# Shared trip detail — works for 'link' and 'public' trips (or members of private)
# GET /shared-trips/{tripId}
# ---------------------------------------------------------------------------
@router.get("/shared-trips/{tripId}")
async def get_shared_trip(
    tripId: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    res = db.table('trips').select(
        '*,'
        'author:profiles!created_by(id,full_name,avatar_url)'
    ).eq('id', tripId).execute()

    if not res.data:
        raise ApiError(404, 'Trip not found')

    trip = res.data[0]
    _assert_shared_trip_accessible(trip, current_user['id'])

    # Fetch itinerary activities (read-only preview)
    acts_res = db.table('itinerary_activities').select(
        'id,title,activity_date,start_time,end_time,location,location_name,notes,estimated_cost'
    ).eq('trip_id', tripId).order('activity_date').order('start_time').execute()

    return {
        **trip,
        'activities': acts_res.data or [],
    }


# ---------------------------------------------------------------------------
# Set trip visibility (owner only)
# POST /trips/{tripId}/share
# ---------------------------------------------------------------------------
@router.post("/trips/{tripId}/share")
async def set_trip_visibility(
    tripId: str,
    body: ShareTripRequest,
    current_user: Dict[str, Any] = Depends(get_trip_owner),
):
    res = db.table('trips').update({'visibility': body.visibility}).eq('id', tripId).execute()
    if not res.data:
        raise ApiError(500, 'Failed to update trip visibility')
    return {'visibility': body.visibility, 'message': 'Trip visibility updated'}


# ---------------------------------------------------------------------------
# Clone / copy a shared trip to the current user's account
# POST /shared-trips/{tripId}/clone
# ---------------------------------------------------------------------------
@router.post("/shared-trips/{tripId}/clone", status_code=status.HTTP_201_CREATED)
async def clone_trip(
    tripId: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    # Fetch original trip
    res = db.table('trips').select('*').eq('id', tripId).execute()
    if not res.data:
        raise ApiError(404, 'Trip not found')
    original = res.data[0]

    if original['created_by'] == current_user['id']:
        raise ApiError(400, 'You cannot clone your own trip')

    _assert_shared_trip_accessible(original, current_user['id'])

    # Get original author name for attribution
    author_res = db.table('profiles').select('full_name').eq('id', original['created_by']).execute()
    author_name = author_res.data[0]['full_name'] if author_res.data else 'Unknown'

    attribution = f"Cloned from {author_name}'s \"{original['name']}\""
    new_description = f"{attribution}\n\n{original.get('description') or ''}".strip()

    # Create the new trip
    new_trip_res = db.table('trips').insert({
        'name': original['name'],
        'destination': original['destination'],
        'start_date': original['start_date'],
        'end_date': original['end_date'],
        'estimated_budget': original.get('estimated_budget', 0),
        'description': new_description,
        'cover_image_url': original.get('cover_image_url'),
        'created_by': current_user['id'],
        'visibility': 'private',  # cloned trips start private
    }).execute()

    if not new_trip_res.data:
        raise ApiError(500, 'Failed to clone trip')

    new_trip = new_trip_res.data[0]
    new_trip_id = new_trip['id']

    # Add cloner as owner
    db.table('trip_members').insert({
        'trip_id': new_trip_id,
        'user_id': current_user['id'],
        'role': 'owner',
        'contribution_status': 'unpaid',
        'invitation_status': 'accepted',
    }).execute()

    # Create shared fund for new trip
    db.table('shared_funds').insert({
        'trip_id': new_trip_id,
        'target_amount': original.get('estimated_budget', 0),
    }).execute()

    # Copy itinerary activities
    acts_res = db.table('itinerary_activities').select('*').eq('trip_id', tripId).execute()
    activities = acts_res.data or []
    for act in activities:
        act.pop('id', None)
        act.pop('created_at', None)
        act.pop('updated_at', None)
        act['trip_id'] = new_trip_id
        act['created_by'] = current_user['id']
    if activities:
        db.table('itinerary_activities').insert(activities).execute()

    return new_trip
