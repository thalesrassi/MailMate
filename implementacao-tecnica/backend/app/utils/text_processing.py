# Limpeza e extração de texto
import re
from pypdf import PdfReader
from fastapi import UploadFile
from typing import Optional

FOOTER_PATTERNS = [
    r"Enviado do meu iPhone",
    r"Enviado do meu Android",
]

def basic_clean(text: str) -> str:
    t = text.strip()
    t = re.sub(r"\s+\n", "\n", t)
    for pat in FOOTER_PATTERNS:
        t = re.sub(pat, "", t, flags=re.IGNORECASE)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def extract_from_pdf(upload: UploadFile) -> str:
    reader = PdfReader(upload.file)
    out = []
    for page in reader.pages:
        out.append(page.extract_text() or "")
    return "\n".join(out).strip()

def extract_from_txt(upload: UploadFile) -> str:
    return upload.file.read().decode("utf-8", errors="ignore").strip()

def guess_and_extract(upload: UploadFile) -> Optional[str]:
    name = upload.filename.lower()
    if name.endswith(".pdf"):
        return extract_from_pdf(upload)
    if name.endswith(".txt"):
        return extract_from_txt(upload)
    return None
