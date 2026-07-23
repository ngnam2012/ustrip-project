from fastapi import APIRouter, Depends, status
from typing import Any, Dict
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta

from src.schemas.auth import UserCreate, UserLogin, UserProfileUpdate, TokenResponse, UserResponse
from src.dependencies.auth import get_current_user
from src.config.db import db
from src.utils.api import unwrap, ApiError
from src.config.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def sign_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7) # Equivalent to 7d
    to_encode = {"sub": user_id, "exp": expire}
    return jwt.encode(to_encode, settings.JWT_SECRET or 'development_secret', algorithm="HS256")

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    email = user_in.email.lower()
    
    # Check existing
    res = db.table('profiles').select('id').eq('email', email).execute()
    existing = res.data or []
    if existing:
        raise ApiError(409, 'Email is already registered')
        
    password_hash = pwd_context.hash(user_in.password)
    
    # Insert
    insert_data = {
        "email": email,
        "password_hash": password_hash,
        "full_name": user_in.full_name
    }
    insert_res = db.table('profiles').insert(insert_data).execute()
    if not insert_res.data:
        raise ApiError(500, 'Failed to create user')
        
    user = insert_res.data[0]
    
    return {
        "token": sign_token(user['id']),
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin):
    email = user_in.email.lower()
    
    # Supabase maybeSingle equivalent logic
    res = db.table('profiles').select('*').eq('email', email).execute()
    user = res.data[0] if res.data else None
    
    if not user or not pwd_context.verify(user_in.password, user['password_hash']):
        raise ApiError(401, 'Invalid email or password')
        
    # Remove password hash from response
    if 'password_hash' in user:
        del user['password_hash']
        
    return {
        "token": sign_token(user['id']),
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@router.patch("/profile", response_model=UserResponse)
async def update_profile(profile_in: UserProfileUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    changes = profile_in.model_dump(exclude_unset=True)
    if not changes:
        return current_user
        
    res = db.table('profiles').update(changes).eq('id', current_user['id']).execute()
    if not res.data:
        raise ApiError(500, 'Failed to update profile')
        
    return res.data[0]
