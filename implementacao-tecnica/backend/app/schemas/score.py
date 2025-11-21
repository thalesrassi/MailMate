# app/schemas/score.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ScoreBase(BaseModel):
    # ex: "insatisfatorio", "satisfatorio", "excelente"
    classificacao: str = Field(..., min_length=1, max_length=100)


class ScoreCreate(ScoreBase):
    pass


class ScoreUpdate(BaseModel):
    classificacao: Optional[str] = Field(None, max_length=100)


class ScoreOut(ScoreBase):
    id: int
    created_at: datetime

class ScoreList(BaseModel):
    items: list[ScoreOut]
    total: int
