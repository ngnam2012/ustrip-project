import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import socketio

from src.config.settings import settings
from src.utils.api import ApiError
from src.socket_app import sio

# Import Routers
from src.routers.auth import router as auth_router
from src.routers.trips import router as trips_router
from src.routers.activities import router as activities_router
from src.routers.funds import router as funds_router
from src.routers.expenses import router as expenses_router
from src.routers.dashboard import router as dashboard_router
from src.routers.misc import router as misc_router
from src.routers.ai import router as ai_router
from src.routers.chat import router as chat_router
from src.routers.payments import router as payments_router
from src.routers.mock_ota import router as mock_ota_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI application...")
    yield
    logger.info("Shutting down FastAPI application...")

app = FastAPI(
    title="UsTrip API",
    description="Python FastAPI backend for UsTrip",
    version="1.0.0",
    lifespan=lifespan,
)

# Exception Handler
@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"}
    )

# CORS setup
origins = [
    settings.CLIENT_URL,
]
if settings.MOBILE_CLIENT_URL:
    origins.append(settings.MOBILE_CLIENT_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ustrip-api"}

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(trips_router, prefix="/api")
app.include_router(activities_router, prefix="/api")
app.include_router(funds_router, prefix="/api")
app.include_router(expenses_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(misc_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(mock_ota_router, prefix="/api")

# Mount Socket.IO App
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    uvicorn.run("src.main:socket_app", host="0.0.0.0", port=settings.PORT, reload=True)
