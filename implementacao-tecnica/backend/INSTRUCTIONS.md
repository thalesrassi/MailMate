Instruções para rodar localmente:

- Clonar o repositório

- Criar e ativar o ambiente virtual:
  -  rm -rf .venv
  - `python3 -m venv .venv`
  - `source .venv/bin/activate`   # Linux/Mac
  - `.venv\Scripts\activate`      # Windows

- Instalar dependências com pip install -r requirements.txt

- Criar um banco de dados local com supabase usando o script fornecido na pasta scripts.sql

- Configurar váriaveis de ambiente com base no .env.example (Necessário possuir token da openAI)

- Rodar uvicorn app.main:app --reload

- Acessar http://localhost:8000

- OBS: Com a aplicação rodando, pode testar a interface seguindo os passos no readme do repositório `https://github.com/marquezzin/autou-frontend`

Url em produção disponível: https://autou-backend-wr7t.onrender.com
