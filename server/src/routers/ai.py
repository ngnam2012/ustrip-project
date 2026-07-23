from fastapi import APIRouter, Depends, Request
from typing import Any, Dict
from src.schemas.ai import SuggestItineraryRequest, SuggestPlacesRequest
from src.dependencies.auth import get_trip_member
from src.services.ai_service import generate_itinerary, suggest_places as ai_suggest_places

router = APIRouter(tags=["ai"])

@router.post("/trips/{tripId}/ai/itinerary")
async def suggest_itinerary(request: Request, data_in: SuggestItineraryRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    result = await generate_itinerary(
        destination=data_in.destination,
        days=data_in.days,
        budget=data_in.budget,
        style=data_in.style,
        group=data_in.group
    )
    return {"itinerary": result}

@router.post("/trips/{tripId}/ai/places")
async def suggest_places(request: Request, data_in: SuggestPlacesRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    result = await ai_suggest_places(
        destination=data_in.destination,
        category=data_in.category
    )
    return {"places": result}
