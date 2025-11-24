# app/api/routes/score.py
from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import get_supabase_client
from app.schemas.score import ScoreCreate, ScoreUpdate, ScoreOut, ScoreList
from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError

router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("/", response_model=ScoreList)
def list_scores(supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("scores").select("*").order("created_at").execute()
    data = resp.data or []
    items = [ScoreOut(**item) for item in data]
    return ScoreList(items=items, total=len(items))


@router.get("/{score_id}", response_model=ScoreOut)
def get_score(score_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("scores").select("*").eq("id", score_id).single().execute()

    return ScoreOut(**resp.data)


@router.post("/", response_model=ScoreOut, status_code=201)
def create_score(
    payload: ScoreCreate,
    supabase: Client = Depends(get_supabase_client),
):
    resp = supabase.table("scores").insert(payload.dict()).execute()

    return ScoreOut(**resp.data[0])


@router.put("/{score_id}", response_model=ScoreOut)
def update_score(
    score_id: str,
    payload: ScoreUpdate,
    supabase: Client = Depends(get_supabase_client),
):
    data = {k: v for k, v in payload.dict().items() if v is not None}
    resp = supabase.table("scores").update(data).eq("id", score_id).execute()

    return ScoreOut(**resp.data[0])


@router.delete("/{score_id}", status_code=204)
def delete_score(score_id: str, supabase: Client = Depends(get_supabase_client)):
    resp = supabase.table("scores").delete().eq("id", score_id).execute()

