from fastapi import APIRouter, Depends, Request, Response, status
from typing import Any, Dict, List, Optional
from src.schemas.trip import ShareTripRequest, TripRatingRequest, TripCommentRequest
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
        'author:profiles!created_by(id,full_name,avatar_url),'
        'copies:trip_copies!trip_copies_original_trip_id_fkey(count),'
        'ratings:trip_ratings(rating)'
    ).eq('visibility', 'public').order('created_at', desc=True).range(offset, offset + limit - 1)

    if destination:
        query = query.ilike('destination', f'%{destination}%')

    res = query.execute()
    trips = res.data or []

    # Compute avg rating and clone count for each trip
    enriched = []
    for t in trips:
        raw_ratings = t.pop('ratings', []) or []
        copies = t.pop('copies', []) or []
        ratings_list = [r['rating'] for r in raw_ratings if r.get('rating')]
        avg_rating = round(sum(ratings_list) / len(ratings_list), 1) if ratings_list else None
        enriched.append({
            **t,
            'avg_rating': avg_rating,
            'rating_count': len(ratings_list),
            'clone_count': copies[0]['count'] if copies else 0,
        })

    return enriched


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
        'author:profiles!created_by(id,full_name,avatar_url),'
        'copies:trip_copies!trip_copies_original_trip_id_fkey(count),'
        'ratings:trip_ratings(rating)'
    ).eq('id', tripId).execute()

    if not res.data:
        raise ApiError(404, 'Trip not found')

    trip = res.data[0]
    _assert_shared_trip_accessible(trip, current_user['id'])

    # Fetch itinerary activities (read-only preview)
    acts_res = db.table('itinerary_activities').select(
        'id,title,activity_date,start_time,end_time,location,location_name,notes,estimated_cost'
    ).eq('trip_id', tripId).order('activity_date').order('start_time').execute()

    # Compute aggregates
    raw_ratings = trip.pop('ratings', []) or []
    copies = trip.pop('copies', []) or []
    ratings_list = [r['rating'] for r in raw_ratings if r.get('rating')]
    avg_rating = round(sum(ratings_list) / len(ratings_list), 1) if ratings_list else None

    # Get caller's own rating
    own_rating_res = db.table('trip_ratings').select('rating').eq('trip_id', tripId).eq('user_id', current_user['id']).execute()
    own_rating = own_rating_res.data[0]['rating'] if own_rating_res.data else None

    # Attribution: was this trip cloned from another?
    copy_res = db.table('trip_copies').select(
        'original_trip_id,'
        'original:trips!trip_copies_original_trip_id_fkey(name,author:profiles!created_by(full_name))'
    ).eq('cloned_trip_id', tripId).execute()
    cloned_from = copy_res.data[0] if copy_res.data else None

    return {
        **trip,
        'avg_rating': avg_rating,
        'rating_count': len(ratings_list),
        'clone_count': copies[0]['count'] if copies else 0,
        'own_rating': own_rating,
        'activities': acts_res.data or [],
        'cloned_from': cloned_from,
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

    # Copy itinerary activities (skip personal-only notes — copy as-is per approved plan)
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

    # Log the clone
    db.table('trip_copies').insert({
        'original_trip_id': tripId,
        'cloned_trip_id': new_trip_id,
        'cloned_by': current_user['id'],
    }).execute()

    return new_trip


# ---------------------------------------------------------------------------
# Ratings
# ---------------------------------------------------------------------------
@router.get("/shared-trips/{tripId}/ratings")
async def get_ratings(
    tripId: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    trip_res = db.table('trips').select('id,visibility').eq('id', tripId).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
    _assert_shared_trip_accessible(trip_res.data[0], current_user['id'])

    ratings_res = db.table('trip_ratings').select('rating').eq('trip_id', tripId).execute()
    ratings = [r['rating'] for r in (ratings_res.data or [])]
    avg = round(sum(ratings) / len(ratings), 1) if ratings else None

    own_res = db.table('trip_ratings').select('rating').eq('trip_id', tripId).eq('user_id', current_user['id']).execute()
    own_rating = own_res.data[0]['rating'] if own_res.data else None

    return {
        'avg_rating': avg,
        'rating_count': len(ratings),
        'own_rating': own_rating,
    }


@router.post("/shared-trips/{tripId}/ratings")
async def upsert_rating(
    tripId: str,
    body: TripRatingRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    trip_res = db.table('trips').select('id,visibility,created_by').eq('id', tripId).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
    trip = trip_res.data[0]
    if trip['created_by'] == current_user['id']:
        raise ApiError(400, 'You cannot rate your own trip')
    _assert_shared_trip_accessible(trip, current_user['id'])

    # Upsert: update if exists, else insert
    existing = db.table('trip_ratings').select('id').eq('trip_id', tripId).eq('user_id', current_user['id']).execute()
    if existing.data:
        db.table('trip_ratings').update({'rating': body.rating}).eq('trip_id', tripId).eq('user_id', current_user['id']).execute()
    else:
        db.table('trip_ratings').insert({'trip_id': tripId, 'user_id': current_user['id'], 'rating': body.rating}).execute()

    return {'rating': body.rating, 'message': 'Rating saved'}


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------
@router.get("/shared-trips/{tripId}/comments")
async def list_comments(
    tripId: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    trip_res = db.table('trips').select('id,visibility').eq('id', tripId).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
    _assert_shared_trip_accessible(trip_res.data[0], current_user['id'])

    res = db.table('trip_comments').select(
        'id,content,parent_id,created_at,'
        'author:profiles!user_id(id,full_name,avatar_url)'
    ).eq('trip_id', tripId).order('created_at').execute()

    return res.data or []


@router.post("/shared-trips/{tripId}/comments", status_code=status.HTTP_201_CREATED)
async def post_comment(
    tripId: str,
    body: TripCommentRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    trip_res = db.table('trips').select('id,visibility').eq('id', tripId).execute()
    if not trip_res.data:
        raise ApiError(404, 'Trip not found')
    _assert_shared_trip_accessible(trip_res.data[0], current_user['id'])

    payload: Dict[str, Any] = {
        'trip_id': tripId,
        'user_id': current_user['id'],
        'content': body.content,
    }
    if body.parent_id:
        payload['parent_id'] = body.parent_id

    res = db.table('trip_comments').insert(payload).execute()
    if not res.data:
        raise ApiError(500, 'Failed to post comment')

    comment = res.data[0]
    # Re-fetch with author join
    full = db.table('trip_comments').select(
        'id,content,parent_id,created_at,'
        'author:profiles!user_id(id,full_name,avatar_url)'
    ).eq('id', comment['id']).execute()
    return full.data[0] if full.data else comment


@router.delete("/shared-trips/{tripId}/comments/{commentId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    tripId: str,
    commentId: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    res = db.table('trip_comments').select('id,user_id').eq('id', commentId).eq('trip_id', tripId).execute()
    if not res.data:
        raise ApiError(404, 'Comment not found')
    if res.data[0]['user_id'] != current_user['id']:
        raise ApiError(403, 'You can only delete your own comments')
    db.table('trip_comments').delete().eq('id', commentId).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
