# app/api/routes/email.py
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import Optional
from app.db.supabase import get_supabase_client
from app.schemas.email import EmailCreate, EmailUpdate, EmailOut, EmailList
from app.utils.text_processing import basic_clean, guess_and_extract
from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError

router = APIRouter(prefix="/emails", tags=["emails"])

@router.get("/", response_model=EmailList)
def list_emails(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    categoria_id: Optional[str] = None,
    score_id: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
):
    from_ = (page - 1) * page_size
    to = from_ + page_size - 1

    query = supabase.table("emails").select("*", count="exact").order("created_at", desc=True)

    if categoria_id:
        query = query.eq("categoria_id", categoria_id)
    if score_id:
        query = query.eq("score_id", score_id)

    resp = query.range(from_, to).execute()
    try:
        resp = query.range(from_, to).execute()
    except PostgrestAPIError as e:
        print("Erro Supabase:", e)
        raise HTTPException(status_code=500, detail=str(e))


    data = resp.data or []
    total = resp.count or len(data)

    items = [EmailOut(**item) for item in data]

    return EmailList(items=items, page=page, page_size=page_size, total=total)


@router.get("/{email_id}", response_model=EmailOut)
def get_email(email_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("emails").select("*").eq("id", email_id).single().execute()

    return EmailOut(**resp.data)


@router.post("/", response_model=EmailOut, status_code=201)
def create_email(
    payload: EmailCreate,
    supabase: Client = Depends(get_supabase_client),
):
    data = payload.dict()
    data["conteudo"] = basic_clean(data["conteudo"])

    resp = supabase.table("emails").insert(data).execute()

    return EmailOut(**resp.data[0])


@router.put("/{email_id}", response_model=EmailOut)
def update_email(
    email_id: str,
    payload: EmailUpdate,
    supabase: Client = Depends(get_supabase_client),
):
    data = {k: v for k, v in payload.dict().items() if v is not None}
    if "conteudo" in data and data["conteudo"]:
        data["conteudo"] = basic_clean(data["conteudo"])

    resp = supabase.table("emails").update(data).eq("id", email_id).execute()

    return EmailOut(**resp.data[0])


@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("emails").delete().eq("id", email_id).execute()
