from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict, Any, Callable
from src.config.db import db
from src.config.settings import settings
from src.utils.api import ApiError

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    if not token:
        raise ApiError(401, 'Authentication required')
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET or 'development_secret', algorithms=['HS256'])
        res = db.table('profiles').select('id,email,full_name,avatar_url,phone').eq('id', payload.get('sub')).execute()
        user = res.data[0] if res.data else None
        
        if not user:
            raise Exception('User not found')
            
        return user
    except Exception:
        raise ApiError(401, 'Invalid or expired token')

async def get_trip_member(request: Request, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    # Try to get tripId from path parameters first, then query, then body
    trip_id = request.path_params.get('tripId')
    if not trip_id:
        trip_id = request.query_params.get('trip_id')
    if not trip_id:
        try:
            body = await request.json()
            trip_id = body.get('trip_id')
        except Exception:
            pass
            
    if not trip_id:
        raise ApiError(400, 'tripId is required')
        
    res = db.table('trip_members').select('role').eq('trip_id', trip_id).eq('user_id', user['id']).execute()
    data = res.data[0] if res.data else None
    
    if not data:
        raise ApiError(403, 'You are not a member of this trip')
        
    # Store tripRole in request state for later use
    request.state.trip_role = data['role']
    request.state.trip_id = trip_id
    
    return user

async def get_trip_owner(request: Request, user: Dict[str, Any] = Depends(get_trip_member)) -> Dict[str, Any]:
    if getattr(request.state, 'trip_role', None) != 'owner':
        raise ApiError(403, 'Only the trip owner can perform this action')
    return user

def _resource_member_dependency(table: str, param: str, relation: str = 'trip_id') -> Callable:
    async def dependency(request: Request, user: Dict[str, Any] = Depends(get_current_user)):
        resource_id = request.path_params.get(param)
        res = db.table(table).select(relation).eq('id', resource_id).execute()
        resource = res.data[0] if res.data else None
        
        if not resource:
            raise ApiError(404, 'Resource not found')
            
        trip_id = resource[relation]
        membership_res = db.table('trip_members').select('role').eq('trip_id', trip_id).eq('user_id', user['id']).execute()
        membership = membership_res.data[0] if membership_res.data else None
        
        if not membership:
            raise ApiError(403, 'You are not a member of this trip')
            
        request.state.trip_role = membership['role']
        request.state.trip_id = trip_id
        return user
    return dependency

require_activity_member = _resource_member_dependency('itinerary_activities', 'activityId')
require_expense_member = _resource_member_dependency('expenses', 'expenseId')
require_contribution_member = _resource_member_dependency('fund_contributions', 'contributionId')

async def require_split_member(request: Request, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    split_id = request.path_params.get('splitId')
    # Supabase join: select('expense:expenses(trip_id)') -> currently supabase-py supports relation joins 
    res = db.table('expense_splits').select('expenses(trip_id)').eq('id', split_id).execute()
    split = res.data[0] if res.data else None
    
    if not split or not split.get('expenses'):
        raise ApiError(404, 'Resource not found')
        
    trip_id = split['expenses']['trip_id']
    membership_res = db.table('trip_members').select('role').eq('trip_id', trip_id).eq('user_id', user['id']).execute()
    membership = membership_res.data[0] if membership_res.data else None
    
    if not membership:
        raise ApiError(403, 'You are not a member of this trip')
        
    request.state.trip_role = membership['role']
    request.state.trip_id = trip_id
    return user
