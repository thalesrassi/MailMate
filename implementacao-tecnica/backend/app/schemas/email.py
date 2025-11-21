from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EmailBase(BaseModel):
    conteudo: str = Field(..., min_length=1, max_length=20000)
    assunto: Optional[str] = None
    resposta: Optional[str] = None
    categoria_id: Optional[str] = None
    score_id: Optional[str] = None


class EmailCreate(EmailBase):
    pass


class EmailUpdate(BaseModel):
    conteudo: Optional[str] = Field(None, max_length=20000)
    assunto: Optional[str] = None
    resposta: Optional[str] = None
    categoria_id: Optional[str] = None
    score_id: Optional[str] = None


class EmailOut(EmailBase):
    id: int
    created_at: datetime
    updated_at: datetime


class EmailList(BaseModel):
    items: list[EmailOut]
    page: int
    page_size: int
    total: int
