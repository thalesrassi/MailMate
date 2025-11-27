from datetime import datetime, timedelta
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

#password: hashed
def verify_password(plain_password: str, password: str) -> bool:
    return pwd_context.verify(plain_password, password)


def create_access_token(user_id: str, expires_minutes: Optional[int] = None) -> str:
    settings = get_settings()
    if expires_minutes is None:
        expires_minutes = settings.jwt_access_token_expires_minutes

    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode = {"sub": user_id, "exp": expire}

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt
