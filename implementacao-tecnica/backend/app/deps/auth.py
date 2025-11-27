from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from supabase import Client

from app.core.config import get_settings
from app.db.supabase import get_supabase_client
from app.schemas.user import UserOut, TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    supabase: Client = Depends(get_supabase_client),
) -> UserOut:
    settings = get_settings()

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception

    resp = (
        supabase.table("users")
        .select("id,name,email")
        .eq("id", token_data.user_id)
        .single()
        .execute()
    )

    if not resp.data:
        raise credentials_exception

    return UserOut(id=str(resp.data["id"]), name=resp.data["name"], email=resp.data["email"])
