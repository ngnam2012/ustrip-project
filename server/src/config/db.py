import logging
from supabase import create_client, Client
from src.config.settings import settings

logger = logging.getLogger(__name__)

url = settings.SUPABASE_URL
key = settings.SUPABASE_SERVICE_ROLE_KEY

if url == "http://localhost:54321" or key == "development-key":
    logger.warning("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to python-backend/.env.")

db: Client = create_client(url, key)
