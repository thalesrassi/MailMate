# app/db/supabase.py
from supabase import create_client, Client
from functools import lru_cache
from ..core.config import get_settings

@lru_cache
def get_supabase_client() -> Client:
    settings = get_settings()
    client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return client
