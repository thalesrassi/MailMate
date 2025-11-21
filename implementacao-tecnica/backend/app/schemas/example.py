from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ExampleBase(BaseModel):
    conteudo: str = Field(..., min_length=1, max_length=20000)
    resposta: Optional[str] = None
    categoria_id: Optional[str] = None


class ExampleCreate(ExampleBase):
    pass


class ExampleUpdate(BaseModel):
    conteudo: Optional[str] = Field(None, max_length=20000)
    resposta: Optional[str] = None
    categoria_id: Optional[str] = None


class ExampleOut(ExampleBase):
    id: int
    created_at: datetime
    updated_at: datetime


class ExampleList(BaseModel):
    items: list[ExampleOut]
    page: int
    page_size: int
    total: int
