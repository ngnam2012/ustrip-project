import socketio
import jwt
import logging
from src.config.db import db
from src.config.settings import settings

logger = logging.getLogger(__name__)

# Create Async Server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*') # Set allowed origins dynamically later if needed

def get_io():
    return sio

@sio.on('connect')
async def connect(sid, environ, auth):
    # Extract token
    token = None
    if auth and 'token' in auth:
        token = auth['token']
    else:
        # Check Authorization header (HTTP_AUTHORIZATION in ASGI)
        headers = dict(environ.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode('utf-8')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
    if not token:
        logger.error(f"Authentication error: Token missing for {sid}")
        raise socketio.exceptions.ConnectionRefusedError('Authentication error: Token missing')
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET or 'development_secret', algorithms=['HS256'])
        user_id = payload.get('sub')
        
        # Save user state
        async with sio.session(sid) as session:
            session['user'] = {"id": user_id, "sub": user_id}
            
        logger.info(f"Socket connected: {sid} (User: {user_id})")
    except Exception as e:
        logger.error(f"Authentication error: Invalid token for {sid} - {e}")
        raise socketio.exceptions.ConnectionRefusedError('Authentication error: Invalid token')

@sio.on('join_trip')
async def join_trip(sid, trip_id):
    session = await sio.get_session(sid)
    user_id = session['user']['id']
    
    # Check if user is a member
    res = db.table('trip_members').select('id').eq('trip_id', trip_id).eq('user_id', user_id).execute()
    if res.data:
        await sio.enter_room(sid, f"trip_{trip_id}")
        logger.info(f"User {user_id} joined trip_{trip_id}")
    else:
        await sio.emit('error', 'You are not a member of this trip', room=sid)

@sio.on('leave_trip')
async def leave_trip(sid, trip_id):
    session = await sio.get_session(sid)
    user_id = session.get('user', {}).get('id')
    await sio.leave_room(sid, f"trip_{trip_id}")
    logger.info(f"User {user_id} left trip_{trip_id}")

@sio.on('disconnect')
async def disconnect(sid):
    logger.info(f"Socket disconnected: {sid}")
