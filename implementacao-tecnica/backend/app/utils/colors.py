from __future__ import annotations
from typing import Iterable
import random

CATEGORY_PALETTE = [
    "#6D28D9",  # Roxo vibrante (coerente com seu primary/indigo)
    "#D946EF",  # Rosa mais quente, combina com seu dark-primary (#9c2279)
    "#059669",  # Verde Emerald (OKLCH coerente)
    "#D97706",  # Amber (similar ao seu chart-4/5)
    "#2563EB",  # Azul forte, alinhado ao seu blue-base
    "#7C3AED",  # Roxo/indigo mais profundo (coerente com dark mode)
    "#DC2626",  # Vermelho (destructive)
    "#4B5563",  # Cinza neutro (zinc/gray)
    "#0D9488",  # Teal sofisticado (ótimo para diversidade)
]

def pick_category_color(existing_colors: Iterable[str]) -> str:
    used = set(c.lower() for c in existing_colors if c)
    for c in CATEGORY_PALETTE:
        if c.lower() not in used:
            return c
    # se esgotar, devolve qualquer uma
    return random.choice(CATEGORY_PALETTE)
