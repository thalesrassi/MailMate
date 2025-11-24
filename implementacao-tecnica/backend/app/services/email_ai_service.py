# app/services/email_ai_service.py
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI
from supabase import Client

from app.core.config import get_settings
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.core.config import Settings  # type: ignore
else:
    Settings = Any  # só para type hints


def _get_client(settings: Settings) -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY não configurada no .env")
    return OpenAI(api_key=settings.openai_api_key)


def fetch_categories_and_examples(
    supabase: Client,
) -> Tuple[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]]]:
    """
    Busca todas as categorias e respectivos exemplos no Supabase.
    Retorna:
      - lista de categorias
      - dict { categoria_id: [exemplos...] }
    """
    cat_resp = supabase.table("categorias").select("id,nome,descricao").execute()
    categories = cat_resp.data or []

    ex_resp = (
        supabase.table("examples")
        .select("id,conteudo,resposta,categoria_id")
        .execute()
    )
    examples_raw = ex_resp.data or []

    examples_by_category: Dict[str, List[Dict[str, Any]]] = {}
    for ex in examples_raw:
        cid = str(ex["categoria_id"])
        examples_by_category.setdefault(cid, []).append(ex)

    return categories, examples_by_category


def build_system_prompt(
    categories: List[Dict[str, Any]],
    examples_by_category: Dict[str, List[Dict[str, Any]]],
) -> str:
    """
    Monta um system prompt detalhado, com:
      - lista de categorias (id + nome + descrição)
      - exemplos de e-mail/resposta por categoria
      - regras duras para NÃO inventar categorias
    """

    # Bloco de categorias
    cat_lines: List[str] = []
    for cat in categories:
        cid = str(cat["id"])
        nome = cat.get("nome") or ""
        desc = cat.get("descricao") or ""
        cat_lines.append(f"- ID: {cid} | Nome: {nome} | Descrição: {desc}")

    categorias_str = "\n".join(cat_lines) if cat_lines else "Nenhuma categoria."

    # Bloco de exemplos
    example_blocks: List[str] = []
    for cat in categories:
        cid = str(cat["id"])
        nome = cat.get("nome") or ""
        exs = examples_by_category.get(cid, [])
        if not exs:
            continue
        example_blocks.append(f"Categoria: {nome} (ID: {cid})")
        for ex in exs:
            example_blocks.append(
                f"  - E-mail exemplo:\n    {ex['conteudo']}\n"
                f"    Resposta ideal:\n    {ex['resposta']}\n"
            )

    exemplos_str = (
        "\n".join(example_blocks)
        if example_blocks
        else "Ainda não há exemplos cadastrados."
    )

    prompt = f"""
Você é um assistente especializado em leitura e resposta de e-mails corporativos.
Seu objetivo é:
1) Gerar **uma resposta adequada** para o e-mail recebido.
2) **Classificar esse e-mail em exatamente UMA categoria** existente no sistema.

O sistema do usuário já possui categorias pré-definidas e exemplos reais de e-mails e respostas.
Você NUNCA deve inventar nova categoria ou novo ID. Use apenas as categorias fornecidas abaixo.

=========================
CATEGORIAS DISPONÍVEIS
=========================
Cada categoria tem:
- Um ID (usado internamente pelo sistema).
- Um nome (compreensível para humanos).
- Uma descrição.

Lista de categorias (ID, Nome, Descrição):
{categorias_str}

IMPORTANTE:
- Sempre escolha UMA ÚNICA categoria.
- Se nenhuma categoria fizer sentido razoávelmente,
  escolha a categoria cujo nome seja 'Outros' (ou equivalente de categoria genérica).

=========================
EXEMPLOS POR CATEGORIA
=========================
Os exemplos abaixo mostram e-mails reais e respostas consideradas ideais
para cada categoria. Use esses exemplos como referência de tom, estrutura
e tipo de problema tratado.

{exemplos_str}

=========================
TAREFA SOBRE CADA E-MAIL
=========================

Ao receber o conteúdo de um e-mail, você deve:

1) Ler e entender o contexto.
2) Gerar uma resposta educada, clara e objetiva, em **português do Brasil**,
   adequada ao remetente e ao contexto do e-mail.
3) Escolher qual categoria (ID) melhor descreve o tipo de assunto do e-mail.
4) NÃO perguntar nada ao usuário do sistema (aplicação); sua saída será lida por um backend.
5) Não inventar informações que não estejam no e-mail do remetente.
   Se algo não estiver claro, faça perguntas de esclarecimento na própria resposta ao remetente.

=========================
REGRAS DE SEGURANÇA E QUALIDADE
=========================
- Não invente categorias. Use apenas os IDs fornecidos.
- Não invente políticas da empresa; se necessário, use respostas neutras, do tipo:
  "conforme as políticas internas da empresa" sem detalhar algo que não foi dito.
- Nunca produza informações confidenciais ou dados pessoais que não estejam no e-mail.
- Seja profissional, cordial e direto.
- Responda sempre em **português do Brasil**.
- Se não houver categoria claramente adequada, use a categoria de nome 'Outros'.
- **NUNCA** devolva nada além de um JSON válido, sem comentários, sem texto adicional.

=========================
FORMATO DE RESPOSTA (OBRIGATÓRIO)
=========================

Você deve responder SEMPRE com um único JSON válido, no formato:

{{
  "assunto": "linha de assunto sugerida para a resposta",
  "resposta": "texto completo da resposta, em português do Brasil",
  "categoria_id": "ID da categoria escolhida (string)",
  "justificativa_categoria": "explicação curta (1–3 frases) do porquê essa categoria foi escolhida"
}}

- O campo "categoria_id" **DEVE** ser um dos IDs fornecidos na lista de categorias.
- Não inclua campos extras.
- Não escreva nada fora do JSON (sem markdown, sem explicações).
"""
    return prompt


def process_email_with_ai(
    conteudo_email: str,
    supabase: Client,
    settings: Optional[Settings] = None,
    model: str = "gpt-4.1-mini",
) -> Dict[str, Any]:

    if settings is None:
        settings = get_settings()

    client = _get_client(settings)

    categories, examples_by_category = fetch_categories_and_examples(supabase)
    if not categories:
        raise RuntimeError("Não há categorias cadastradas no banco.")

    system_prompt = build_system_prompt(categories, examples_by_category)

    try:
        completion = client.chat.completions.create(
            model=model,
            temperature=0.1,
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        "Conteúdo do e-mail recebido (texto integral, sem edição):\n\n"
                        f"{conteudo_email}"
                    ),
                },
            ],
        )
    except Exception as e:
        raise RuntimeError(f"Erro ao chamar modelo de IA: {e}")

    try:
        text = completion.choices[0].message.content
        if not text:
            raise RuntimeError("IA retornou resposta vazia.")
    except Exception as e:
        raise RuntimeError(f"Erro ao extrair texto da resposta da IA: {e}")

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"IA não retornou JSON válido: {e}\nConteúdo retornado: {text}")

    for field in ["assunto", "resposta", "categoria_id"]:
        if field not in data or not isinstance(data[field], str):
            raise RuntimeError(f"Campo obrigatório ausente ou inválido: {field}")

    return data

