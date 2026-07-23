from fastapi import HTTPException
from typing import Any, Dict, List, TypeVar

class ApiError(HTTPException):
    def __init__(self, status: int, message: str):
        super().__init__(status_code=status, detail=message)

def unwrap(result: Any) -> Any:
    # In python supabase client, currently `result.data` is returned directly for successful queries in v2, 
    # but let's handle it safely if it returns an object with 'data' and 'error' or raises an exception.
    # Typically supabase-py raises APIError on failure, but we'll try to keep the interface similar.
    
    if hasattr(result, 'error') and result.error is not None:
        raise ApiError(400, str(result.error))
    
    if hasattr(result, 'data'):
        return result.data
        
    return result

def pick(source: Dict[str, Any], keys: List[str]) -> Dict[str, Any]:
    return {k: source[k] for k in keys if k in source}
