from fastapi import APIRouter, Depends, Request, status
import uuid
from typing import Any, Dict
from src.schemas.chat import SendMessageRequest
from src.dependencies.auth import get_trip_member
from src.config.db import db
from src.utils.api import ApiError
import asyncio
import logging
from src.socket_app import get_io

router = APIRouter(tags=["chat"])

@router.get("/trips/{tripId}/messages")
async def get_messages(request: Request, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    res = db.table('messages').select('*').eq('trip_id', trip_id).order('created_at', desc=False).execute()
    messages = res.data or []
    
    if messages:
        user_ids = list(set([m['user_id'] for m in messages]))
        profiles_res = db.table('profiles').select('id, full_name, avatar_url').in_('id', user_ids).execute()
        profiles = profiles_res.data or []
        profile_map = {p['id']: p for p in profiles}
        
        for m in messages:
            m['sender'] = profile_map.get(m['user_id'], {"full_name": "Unknown"})
            
    return messages

@router.post("/trips/{tripId}/messages", status_code=status.HTTP_201_CREATED)
async def send_message(request: Request, msg_in: SendMessageRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    content = msg_in.content.strip()
    if not content:
        raise ApiError(400, 'Content is required')
        
    res = db.table('messages').insert({
        'id': str(uuid.uuid4()),
        'trip_id': trip_id,
        'user_id': current_user['id'],
        'content': content
    }).execute()
    
    if not res.data:
        raise ApiError(500, 'Failed to send message')
        
    message = res.data[0]
    
    sender_res = db.table('profiles').select('id, full_name, avatar_url').eq('id', current_user['id']).execute()
    sender = sender_res.data[0] if sender_res.data else {"full_name": "Unknown"}
    message['sender'] = sender
    
    try:
        sio = get_io()
        
        # Determine if we are running in an event loop or not for emitting
        # Fastapi is async, python-socketio AsyncServer is async
        asyncio.create_task(sio.emit('new_message', message, room=f"trip_{trip_id}"))
    except Exception as e:
        logging.getLogger(__name__).error(f"Socket.io error emitting message: {e}")
        
    return message
