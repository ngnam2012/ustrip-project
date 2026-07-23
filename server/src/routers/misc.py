import re
import os
import base64
from fastapi import APIRouter, Depends, status, Request, UploadFile, File, Response
from typing import Any, Dict
from datetime import datetime
import cloudinary.uploader

from src.schemas.misc import PushTokenRequest, RemovePushTokenRequest
from src.dependencies.auth import get_current_user
from src.config.db import db
from src.utils.api import ApiError
from src.config.settings import settings

router = APIRouter(tags=["misc"])

@router.get("/notifications")
async def get_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    res = db.table('notifications').select('*').eq('user_id', current_user['id']).order('created_at', desc=True).execute()
    return res.data or []

@router.patch("/notifications/{notificationId}/read")
async def read_notification(request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    notification_id = request.path_params.get('notificationId')
    res = db.table('notifications').update({"is_read": True}).eq('id', notification_id).eq('user_id', current_user['id']).execute()
    if not res.data:
        raise ApiError(404, 'Notification not found')
    return res.data[0]

@router.put("/notifications/push-token")
async def register_push_token(token_in: PushTokenRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    token = token_in.token
    if not re.match(r'^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$', token):
        raise ApiError(422, 'A valid Expo push token is required')
        
    payload = {
        "token": token,
        "user_id": current_user['id'],
        "platform": token_in.platform or 'unknown',
        "updated_at": datetime.utcnow().isoformat()
    }
    
    res = db.table('push_tokens').upsert(payload, on_conflict='token').execute()
    if not res.data:
        raise ApiError(500, 'Failed to register push token')
    return res.data[0]

@router.delete("/notifications/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def remove_push_token(token_in: RemovePushTokenRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    db.table('push_tokens').delete().eq('token', token_in.token).eq('user_id', current_user['id']).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/upload/{kind}", status_code=status.HTTP_201_CREATED)
async def upload_image(request: Request, image: UploadFile = File(...), current_user: Dict[str, Any] = Depends(get_current_user)):
    kind = request.path_params.get('kind')
    if kind not in ['bill', 'payment-proof', 'avatar', 'trip-cover']:
        raise ApiError(404, 'Upload kind not found')
        
    if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
        raise ApiError(503, 'Cloudinary is not configured on the server')
        
    file_bytes = await image.read()
    
    if not re.match(r'^image\/(jpeg|png|webp|heic)$', image.content_type):
        raise ApiError(422, 'Only jpeg, png, webp, and heic images are allowed')
        
    if len(file_bytes) > 5 * 1024 * 1024:
        raise ApiError(413, 'File size exceeds 5MB limit')
        
    base64_img = base64.b64encode(file_bytes).decode('utf-8')
    data_uri = f"data:{image.content_type};base64,{base64_img}"
    
    folder = os.environ.get('CLOUDINARY_FOLDER', 'ustrip')
    
    try:
        result = cloudinary.uploader.upload(
            data_uri,
            folder=f"{folder}/{kind}",
            resource_type="image",
            transformation=[{"width": 1800, "height": 1800, "crop": "limit", "quality": "auto"}]
        )
        return {"url": result.get("secure_url"), "public_id": result.get("public_id")}
    except Exception as e:
        err_msg = str(e)
        if hasattr(e, 'http_code') and getattr(e, 'http_code') in [401, 403]:
            raise ApiError(502, 'Cloudinary rejected the configured cloud name, API key, or API secret')
        raise ApiError(502, f"Cloudinary upload failed: {err_msg}")
