# app/api/routes/email.py
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import Optional
from app.db.supabase import get_supabase_client
from app.schemas.example import ExampleCreate, ExampleUpdate, ExampleOut, ExampleList
from app.utils.text_processing import basic_clean, guess_and_extract
from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError

router = APIRouter(prefix="/examples", tags=["examples"])

@router.get("/", response_model=ExampleList)
def list_examples(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    categoria_id: Optional[str] = None,
    supabase: Client = Depends(get_supabase_client),
):
    from_ = (page - 1) * page_size
    to = from_ + page_size - 1

    query = supabase.table("examples").select("*", count="exact").order("created_at", desc=True)

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
def get_email(example_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("examples").select("*").eq("id", example_id).single().execute()
    if resp.error:
        raise HTTPException(status_code=404, detail="E-mail não encontrado")
    return ExampleOut(**resp.data)


@router.post("/", response_model=ExampleOut, status_code=201)
def create_example(
    payload: ExampleCreate,
    supabase: Client = Depends(get_supabase_client),
):
    data = payload.dict()
    data["conteudo"] = basic_clean(data["conteudo"])

    resp = supabase.table("examples").insert(data).execute()

    return ExampleOut(**resp.data[0])



@router.delete("/{example_id}", status_code=204)
def delete_email(example_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("examples").delete().eq("id", example_id).execute()
