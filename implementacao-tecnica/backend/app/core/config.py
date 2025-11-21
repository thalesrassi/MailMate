from pydantic import BaseModel
from functools import lru_cache
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Settings(BaseModel):
    supabase_url: str
    supabase_service_role_key: str
    openai_api_key: Optional[str] = None
    allowed_origins: list[str] = ["*"]
    port: int = 8000

    class Config:
        arbitrary_types_allowed = True

@lru_cache
def get_settings() -> Settings:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    allowed_origins_raw = os.getenv("ALLOWED_ORIGINS") or ""

    if not supabase_url or not supabase_service_role_key:
        raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env")

    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()] or ["*"]

    return Settings(
        supabase_url=supabase_url,
        supabase_service_role_key=supabase_service_role_key,
        openai_api_key=openai_api_key,
        allowed_origins=allowed_origins,
        port=int(os.getenv("PORT", "8000")),
    )
