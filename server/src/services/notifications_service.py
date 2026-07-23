import os
import httpx
import asyncio
from typing import List, Dict, Any
from src.config.db import db
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
PUSH_BATCH_SIZE = 100

def batches(items: List[Any], size: int = PUSH_BATCH_SIZE) -> List[List[Any]]:
    return [items[i:i + size] for i in range(0, len(items), size)]

async def send_expo_push(notifications: List[Dict[str, Any]]):
    if not notifications:
        return

    user_ids = list(set([n['user_id'] for n in notifications]))
    
    tokens_res = db.table('push_tokens').select('token,user_id').in_('user_id', user_ids).execute()
    tokens = tokens_res.data or []
    
    if not tokens:
        return

    notifications_by_user: Dict[str, List[Dict[str, Any]]] = {}
    for n in notifications:
        user_id = n['user_id']
        if user_id not in notifications_by_user:
            notifications_by_user[user_id] = []
        notifications_by_user[user_id].append(n)

    messages = []
    for token_record in tokens:
        token = token_record['token']
        user_id = token_record['user_id']
        user_notifications = notifications_by_user.get(user_id, [])
        
        for n in user_notifications:
            messages.append({
                "to": token,
                "sound": "default",
                "title": n['title'],
                "body": n['message'],
                "priority": "high",
                "channelId": "default",
                "data": {
                    "notificationId": n.get('id'),
                    "tripId": n.get('trip_id'),
                    "type": n.get('type')
                }
            })

    async with httpx.AsyncClient(timeout=30.0) as client:
        for batch in batches(messages):
            try:
                headers = {'Content-Type': 'application/json'}
                expo_token = os.environ.get('EXPO_ACCESS_TOKEN')
                if expo_token:
                    headers['Authorization'] = f'Bearer {expo_token}'
                    
                response = await client.post(EXPO_PUSH_URL, json=batch, headers=headers)
                if not response.is_success:
                    logger.error(f"Expo push request failed: {response.status_code} {response.text}")
            except Exception as e:
                logger.error(f"Expo push delivery failed: {e}")

async def notify_users(payloads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not payloads:
        return []
    
    res = db.table('notifications').insert(payloads).execute()
    data = res.data or []
    
    # Run expo push in background or await it
    await send_expo_push(data)
    
    return data

async def notify_user(user_id: str, trip_id: str, type: str, title: str, message: str) -> Dict[str, Any]:
    notifications = await notify_users([{
        "user_id": user_id, 
        "trip_id": trip_id, 
        "type": type, 
        "title": title, 
        "message": message
    }])
    return notifications[0] if notifications else {}

async def notify_trip_members(trip_id: str, actor_id: str, type: str, title: str, message: str) -> List[Dict[str, Any]]:
    members_res = db.table('trip_members').select('user_id').eq('trip_id', trip_id).neq('user_id', actor_id).execute()
    members = members_res.data or []
    
    payloads = [{
        "user_id": m['user_id'], 
        "trip_id": trip_id, 
        "type": type, 
        "title": title, 
        "message": message
    } for m in members]
    
    return await notify_users(payloads)
