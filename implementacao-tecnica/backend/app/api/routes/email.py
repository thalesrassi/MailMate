# app/api/routes/email.py
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import Optional
from app.db.supabase import get_supabase_client
from app.schemas.email import EmailCreate, EmailUpdate, EmailOut, EmailList
from app.utils.text_processing import basic_clean, guess_and_extract
from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError
from app.services.email_ai_service import process_email_with_ai
from app.core.config import get_settings

router = APIRouter(prefix="/emails", tags=["emails"])


# Função auxiliar para extrair e limpar conteúdo
def extract_and_clean_content(
    conteudo: str = Form(None),
    file: UploadFile = File(None),
) -> str:
    # Conteúdo não enviado
    if not conteudo and not file:
        raise HTTPException(
            status_code=400,
            detail="Envie 'conteudo' OU 'file' (.pdf/.txt)."
        )

    # Se veio arquivo
    if file:
        fname = file.filename.lower()
        if not (fname.endswith(".pdf") or fname.endswith(".txt")):
            raise HTTPException(
                status_code=400,
                detail="Apenas .pdf ou .txt são aceitos."
            )

        extracted = guess_and_extract(file)
        if not extracted:
            raise HTTPException(
                status_code=400,
                detail="Não foi possível extrair texto do arquivo."
            )

        conteudo = extracted

    # Limpeza final
    clean = basic_clean(conteudo or "")
    if not clean.strip():
        raise HTTPException(
            status_code=400,
            detail="Conteúdo vazio após limpeza."
        )

    return clean

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
    conteudo: str = Form(None),
    file: UploadFile = File(None),
    supabase: Client = Depends(get_supabase_client),
):
    settings = get_settings()

    # 1) Extrai texto do arquivo ou usa texto direto
    clean_content = extract_and_clean_content(conteudo, file)

    # 2) IA processa o e-mail (gera assunto + resposta + categoria_id)
    try:
        ai_data = process_email_with_ai(
            conteudo_email=clean_content,
            supabase=supabase,
            settings=settings,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 3) Salva no Supabase
    to_insert = {
        "conteudo": clean_content,
        "assunto": ai_data["assunto"],
        "resposta": ai_data["resposta"],
        "categoria_id": ai_data["categoria_id"],
        "score_id": None,
    }

    try:
        resp = supabase.table("emails").insert(to_insert).execute()
    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))

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


