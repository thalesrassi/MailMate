from fastapi import APIRouter
from app.api.routes import email, example, score

api_router = APIRouter()
api_router.include_router(email.router)
api_router.include_router(example.router)
api_router.include_router(score.router)
