# app/schemas/category.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CategoryBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=255)
    descricao: Optional[str] = Field(None, max_length=1000)
    cor: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=255)
    descricao: Optional[str] = Field(None, max_length=1000)
    cor: Optional[str] = None


class CategoryOut(CategoryBase):
    id: int
    created_at: datetime


class CategoryList(BaseModel):
    items: list[CategoryOut]
    total: int
