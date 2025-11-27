# app/api/routes/email.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError

from app.db.supabase import get_supabase_client
from app.deps.auth import get_current_user
from app.schemas.user import UserOut
from app.schemas.example import ExampleCreate, ExampleOut, ExampleList
from app.utils.text_processing import basic_clean

router = APIRouter(prefix="/examples", tags=["examples"])


@router.get("/", response_model=ExampleList)
def list_examples(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    categoria_id: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    from_ = (page - 1) * page_size
    to = from_ + page_size - 1

    query = (
        supabase.table("examples")
        .select("*", count="exact")
        .eq("user_id", current_user.id)
        .order("created_at", desc=True)
    )

    if categoria_id:
        query = query.eq("categoria_id", categoria_id)

    try:
        resp = query.range(from_, to).execute()
    except PostgrestAPIError as e:
        print("Erro Supabase:", e)
        raise HTTPException(status_code=500, detail=str(e))

    data = resp.data or []
    total = resp.count or len(data)

    items = [ExampleOut(**item) for item in data]

    return ExampleList(items=items, page=page, page_size=page_size, total=total)


@router.get("/{example_id}", response_model=ExampleOut)
def get_email(
    example_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    resp = (
        supabase.table("examples")
        .select("*")
        .eq("id", example_id)
        .eq("user_id", current_user.id)
        .single()
        .execute()
    )

    if not resp.data:
        raise HTTPException(status_code=404, detail="E-mail não encontrado")

    return ExampleOut(**resp.data)


@router.post("/", response_model=ExampleOut, status_code=201)
def create_example(
    payload: ExampleCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    data = payload.dict()
    data["conteudo"] = basic_clean(data["conteudo"])
    data["user_id"] = current_user.id

    resp = supabase.table("examples").insert(data).execute()

    if not resp.data:
        raise HTTPException(status_code=500, detail="Falha ao criar exemplo")

    return ExampleOut(**resp.data[0])


@router.delete("/{example_id}", status_code=204)
def delete_email(
    example_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    resp = (
        supabase.table("examples")
        .delete()
        .eq("id", example_id)
        .eq("user_id", current_user.id)   # 🔒 só apaga se for dele
        .execute()
    )

    # Se RLS estiver ativo, resp.data pode ser [] silenciosamente
    if resp.data == []:
        raise HTTPException(
            status_code=404,
            detail="E-mail não encontrado ou não pertence ao usuário",
        )

    return None
