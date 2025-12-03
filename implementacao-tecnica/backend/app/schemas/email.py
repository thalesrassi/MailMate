from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class EmailBase(BaseModel):
    conteudo: str
    assunto: Optional[str] = None
    resposta: Optional[str] = None
    categoria_id: Optional[int] = None
    score_id: Optional[int] = None


class EmailCreate(EmailBase):
    pass


class EmailUpdate(BaseModel):
    conteudo: Optional[str] = None
    assunto: Optional[str] = None
    resposta: Optional[str] = None
    categoria_id: Optional[int] = None
    score_id: Optional[int] = None


class EmailOut(EmailBase):
    id: int
    created_at: datetime


class EmailList(BaseModel):
    items: list[EmailOut]
    page: int
    page_size: int
    total: int
