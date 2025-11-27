from fastapi import APIRouter, Depends, HTTPException, status
from app.db.supabase import get_supabase_client
from app.deps.auth import get_current_user
from app.schemas.user import UserOut
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut, CategoryList
from supabase import Client
from postgrest.exceptions import APIError as PostgrestAPIError
from app.utils.colors import pick_category_color

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=CategoryList)
def list_categories(supabase: Client = Depends(get_supabase_client), current_user: UserOut = Depends(get_current_user),):
    try:
        resp = supabase.table("categorias").select("*").eq("user_id", current_user.id).order("created_at").execute()
        data = resp.data or []
        items = [CategoryOut(**item) for item in data]
        return CategoryList(items=items, total=len(items))
    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: str, supabase: Client = Depends(get_supabase_client)):
    try:
        resp = supabase.table("categorias").select("*").eq("id", category_id).single().execute()
        if not resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return CategoryOut(**resp.data)
    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    data = payload.dict()
    data["user_id"] = current_user.id
    # Busca cores já usadas para as categorias do usuário
    colors_resp = (
        supabase
        .table("categorias")
        .select("cor")
        .eq("user_id", current_user.id)
        .execute()
    )
    existing_colors = [row["cor"] for row in (colors_resp.data or []) if row.get("cor")]

    # Se não veio cor, gera uma
    if not data.get("cor"):
        data["cor"] = pick_category_color(existing_colors)
    try:
        resp = supabase.table("categorias").insert(data).execute()
        if not resp.data or len(resp.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create category")
        return CategoryOut(**resp.data[0])
    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    try:
        updates = {k: v for k, v in payload.dict().items() if v is not None}

        resp = (
            supabase.table("categorias")
            .update(updates)
            .eq("id", category_id)
            .eq("user_id", current_user.id)
            .execute()
        )

        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or unauthorized",
            )

        return CategoryOut(**resp.data[0])

    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: str,
    supabase: Client = Depends(get_supabase_client),
    current_user: UserOut = Depends(get_current_user),
):
    try:
        resp = (
            supabase.table("categorias")
            .delete()
            .eq("id", category_id)
            .eq("user_id", current_user.id)
            .execute()
        )

        # Se nada for deletado → não existe OU não pertence ao user
        if resp.data == []:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or unauthorized",
            )

        return None

    except PostgrestAPIError as e:
        raise HTTPException(status_code=500, detail=str(e))

