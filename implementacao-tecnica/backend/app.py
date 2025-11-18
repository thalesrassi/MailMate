import os
import json
import re
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from supabase import create_client, Client
from openai import OpenAI
from pypdf import PdfReader


# Configuração Supabase + OpenAI
load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
PORT = int(os.getenv("PORT", "8000"))

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Configure OPENAI_API_KEY no .env")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Configuração FastAPI
app = FastAPI(title="AutoU Email Classifier API", version="0.2")

ALLOWED_ORIGINS = (os.getenv("ALLOWED_ORIGINS") or "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Scheemas
class EmailCreate(BaseModel):
    conteudo: str = Field(..., min_length=1, max_length=20000)
    classificacao: Optional[str] = None
    resposta: Optional[str] = None
    assunto: Optional[str] = None

class EmailOut(BaseModel):
    id: str
    conteudo: str
    classificacao: Optional[str]
    resposta: Optional[str]
    assunto: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class EmailList(BaseModel):
    items: list[EmailOut]
    page: int
    page_size: int

# Limpeza e extração de texto
FOOTER_PATTERNS = [
    r"At\.?t?e?\.?.*",           # "Att.", "Atte", etc
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


# Funções de IA

def decide_required_fields(intent: str) -> list[str]:
    """
    Define quais dados pedir com base no intent.
    """
    intent = intent or "outros"
    mapping = {
        "status": ["número do protocolo OU CPF/CNPJ"],
        "cobranca": ["CPF/CNPJ"],
        "cadastro": ["CPF/CNPJ"],
        "suporte_acesso": ["e-mail cadastrado"],
        "envio_documento": [],  # confirmar recebimento; pedir nada extra por padrão
        "duvida_produto": ["se é PF ou PJ", "faixa de investimento desejada"],
        "informacao_institucional": ["se é PF ou PJ", "assunto de interesse"],
        "contestacao": ["número do protocolo OU CPF/CNPJ"],
        "felicitacao_agradecimento": [],
        "marketing_spam": [],
        "outros": [],
    }
    return mapping.get(intent, [])

# Classificação
CLASSIFY_SYSTEM = """
Você é um classificador de e-mails corporativos de uma empresa financeira. 
Rotule cada e-mail como "Produtivo" ou "Improdutivo" e identifique o INTENT do contato.

REGRAS (aplique em ordem):
A. IMPRODUTIVO quando:
   - Felicitações, votos, saudações, “obrigado(a)”, mensagens genéricas sem pedido.
   - Respostas automáticas (OOO) sem solicitação.
   - Marketing frio/propaganda não solicitada, spam, correntes.
   - Conteúdo vazio/ilegível.

B. PRODUTIVO quando há PEDIDO ESPECÍFICO, por ex.:
   - Status/andamento de solicitação/caso (status, protocolo, “acompanhar”).
   - Dúvidas sobre produtos/sistema (como investir, taxas, resgate).
   - Envio/solicitação de documentos (“segue comprovante”, “anexo RG”).
   - Suporte de acesso/erro no portal (login, senha, 2FA).
   - Cobrança/financeiro (boletos, faturas, parcelas).
   - Cadastro/atualização de dados.
   - Contestação/reclamação com pedido explícito de ação.

C. Casos MISTOS (felicitação + pedido objetivo) => PRODUTIVO.

INTENTS possíveis (escolha a mais específica):
  ["status", "duvida_produto", "envio_documento", "suporte_acesso", "cobranca",
   "cadastro", "contestacao", "informacao_institucional", "felicitacao_agradecimento",
   "marketing_spam", "outros"]

OUTPUT (JSON apenas):
{
  "classificacao": "Produtivo" | "Improdutivo",
  "intent": string,             // uma das opções acima
  "evidencias": string[],       // palavras/trechos que fundamentam a decisão
  "conf": number,               // 0.00–1.00
  "rationale": string           // 1 frase curta
}
Não inclua nenhum texto fora do JSON.
""".strip()


def classify_text(conteudo: str) -> dict:
    user_msg = f"E-mail (texto bruto):\n---\n{conteudo}\n---"
    try:
        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": CLASSIFY_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.0,
            max_tokens=200,
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        data = json.loads(raw)

        # Normalização mínima
        c = (data.get("classificacao") or "").strip().lower()
        data["classificacao"] = "Produtivo" if c == "produtivo" else "Improdutivo"

        intent = (data.get("intent") or "outros").strip()
        data["intent"] = intent

        ev = data.get("evidencias") or []
        if isinstance(ev, str):
            ev = [ev]
        data["evidencias"] = ev[:5]

        conf = data.get("conf")
        try:
            conf = float(conf)
        except Exception:
            conf = 0.6
        data["conf"] = max(0.0, min(1.0, conf))

        r = (data.get("rationale") or "").strip()
        data["rationale"] = r[:200]

        return data
    except Exception:
        # Fallback: heurística conservadora
        txt = conteudo.lower()
        impro_signals = ["feliz", "parabéns", "obrigado", "agradeço", "boas festas"]
        if any(s in txt for s in impro_signals):
            return {"classificacao":"Improdutivo","intent":"felicitacao_agradecimento","evidencias":[], "conf":0.55, "rationale":"Expressão de cortesia sem pedido."}
        prod_signals = ["status", "protocolo", "como", "anexo", "segue", "boleto", "fatura", "login", "senha"]
        label = "Produtivo" if any(s in txt for s in prod_signals) else "Improdutivo"
        intent = "status" if "status" in txt or "protocolo" in txt else ("envio_documento" if ("anexo" in txt or "segue" in txt) else "outros")
        return {"classificacao":label,"intent":intent,"evidencias":[], "conf":0.5, "rationale":"Fallback parsing."}


# Resposta
REPLY_SYSTEM = """
Você é Gabriel, atendimento da AutoU Invest (gestora fundada em 2010, sede em São Paulo, filiais em BH e Porto Alegre; foco em renda fixa, multimercados e estruturados). 
Escreva em PT-BR, tom profissional e cordial, 2–3 parágrafos curtos (80–140 palavras), sem jargões.

REGRAS:
- Se categoria = IMPRODUTIVO: agradeça e encerre sem criar tarefas e sem pedir dados pessoais.
- Se categoria = PRODUTIVO: reconheça o pedido, informe próximos passos e mencione o prazo de resposta de até {{SLA_HORAS}} horas úteis.
- Solicite APENAS os dados indicados em "dados_a_pedir". Se a lista estiver vazia, NÃO peça CPF/CNPJ.
- Se houver anexos declarados no texto (“segue”, “anexo…”), confirme recebimento e encaminhamento.
- Jamais invente informações de conta/contrato ou compartilhe dados sensíveis.
-- Gere a saída EXCLUSIVAMENTE em JSON, com as chaves:
  {
    "assunto": string,   // linha de assunto curta, clara, sem colchetes, sem emojis, 4–10 palavras
    "corpo": string      // corpo da mensagem final; encerre com:
                         // "Atenciosamente,\nGabriel\nAutoU Invest"
  }

Estilo:
- Evite parágrafos longos (2–3 curtos).
- Não invente informações de conta/contrato.
- Não compartilhe dados sensíveis.
""".strip()

def generate_reply(conteudo: str, classificacao: Literal["Produtivo","Improdutivo"], intent: str, sla_horas: int = 24) -> dict:
    sys = REPLY_SYSTEM.replace("{{SLA_HORAS}}", str(sla_horas))
    dados = decide_required_fields(intent)
    user = (
        "Contexto do e-mail recebido:\n"
        f"- Categoria: {classificacao}\n"
        f"- Intent: {intent}\n"
        f"- dados_a_pedir: {', '.join(dados) if dados else 'nenhum'}\n"
        "Texto do e-mail:\n---\n"
        f"{conteudo}\n---\n\n"
        "Construa a resposta final ao cliente seguindo as REGRAS."
    )
    try:
        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": sys},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=int(os.getenv("RESPONSE_MAX_TOKENS", "350")),
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        data = json.loads(raw)

        assunto = (data.get("assunto") or "").strip()
        corpo = (data.get("corpo") or "").strip()

        # sanity/fallbacks
        if not assunto:
            # heurística simples
            if classificacao == "Produtivo":
                assunto = "Retorno AutoU Invest — seu atendimento"
            else:
                assunto = "Agradecimento — AutoU Invest"
        if len(assunto.split()) > 14:
            assunto = " ".join(assunto.split()[:14])

        if not corpo:
            corpo = (
                "Não foi possível gerar a resposta completa agora. "
                "Nossa equipe dará continuidade manualmente.\n\n"
                "Atenciosamente,\nGabriel\nAutoU Invest"
            )

        # poda de segurança (máx. ~160 palavras)
        if len(corpo.split()) > 170:
            corpo = " ".join(corpo.split()[:170])

        return {"assunto": assunto, "corpo": corpo}

    except Exception:
        # fallback ultra-defensivo
        assunto = (
            "Retorno AutoU Invest — seu atendimento"
            if classificacao == "Produtivo"
            else "Agradecimento — AutoU Invest"
        )
        corpo = (
            "Olá,\n\nRecebemos sua mensagem e vamos dar sequência internamente. "
            "Retornaremos em breve.\n\n"
            "Atenciosamente,\nGabriel\nAutoU Invest"
        )
        return {"assunto": assunto, "corpo": corpo}



# Endpoints
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/emails", response_model=EmailOut)
def create_email(email: EmailCreate):
    data = {
        "conteudo": email.conteudo,
        "classificacao": email.classificacao,
        "resposta": email.resposta,
        "assunto": email.assunto,
    }
    res = supabase.table("emails").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Falha ao inserir no Banco de Dados")
    return res.data[0]

@app.get("/emails", response_model=EmailList)
def list_emails(page: int = 1, page_size: int = 20):
    start = (page - 1) * page_size
    end = start + page_size - 1
    res = supabase.table("emails").select("*").order("created_at", desc=True).range(start, end).execute()
    return {"items": res.data, "page": page, "page_size": page_size}


@app.post("/emails/ai", response_model=EmailOut)
async def create_email_ai(
    conteudo: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    if not conteudo and not file:
        raise HTTPException(status_code=400, detail="Envie 'conteudo' OU 'file' (.pdf/.txt).")

    if file:
        if not (file.filename.lower().endswith(".pdf") or file.filename.lower().endswith(".txt")):
            raise HTTPException(status_code=400, detail="Apenas .pdf ou .txt.")
        extracted = guess_and_extract(file)
        if not extracted:
            raise HTTPException(status_code=400, detail="Não foi possível extrair texto do arquivo.")
        conteudo = extracted

    clean = basic_clean(conteudo or "")
    if not clean:
        raise HTTPException(status_code=400, detail="Conteúdo vazio após limpeza.")

    # 1) Classificar (JSON)
    cls = classify_text(clean)  # {"classificacao":..., "conf":..., "rationale":...}
    classificacao = cls["classificacao"]
    intent = cls.get("intent", "outros")
    sla = 24 if classificacao == "Produtivo" else 0
    
    # 2) Gerar resposta
    reply = generate_reply(clean, classificacao, intent, sla_horas=(sla or 24))
    assunto = reply["assunto"]
    resposta = reply["corpo"]

    # 3) Persistir
    data = {
        "conteudo": clean,
        "classificacao": classificacao,
        "resposta": resposta,
        "assunto": assunto,
    }
    res = supabase.table("emails").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Falha ao inserir no Banco de Dados")
    return res.data[0]

