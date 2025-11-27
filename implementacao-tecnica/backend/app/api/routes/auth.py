from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from supabase import Client
from app.deps.auth import get_current_user
from app.db.supabase import get_supabase_client
from app.schemas.user import UserCreate, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: UserOut = Depends(get_current_user)):
    return current_user

@router.post("/register", response_model=UserOut, status_code=201)
def register_user(
    payload: UserCreate,
    supabase: Client = Depends(get_supabase_client),
):
    # verifica se já existe
    existing = (
        supabase.table("users")
        .select("id")
        .eq("email", payload.email)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já registrado",
        )

    hashed = hash_password(payload.password)

    resp = (
        supabase.table("users")
        .insert({"email": payload.email, "name": payload.name, "password": hashed})
        .execute()
    )

    user = resp.data[0]
    return UserOut(id=str(user["id"]), name=user["name"], email=user["email"])


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    supabase: Client = Depends(get_supabase_client),
):
    email = form_data.username
    password = form_data.password

    resp = (
        supabase.table("users")
        .select("id,email,password")
        .eq("email", email)
        .execute()
    )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ou senha inválidos",
        )

    user = resp.data[0]

    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail ou senha inválidos",
        )

    access_token = create_access_token(user_id=str(user["id"]))

    return Token(access_token=access_token, token_type="bearer")
