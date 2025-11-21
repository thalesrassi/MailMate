# MailMate - Sistema de Classificação e Respostas Automáticas de E-mails

Sistema completo desenvolvido em React.js com TypeScript, utilizando shadcn/ui, lucide-react e Tailwind CSS 4.

## 📋 Visão Geral

O MailMate é uma aplicação web para automatização de classificação e geração de respostas para e-mails, com interface moderna e suporte a dark/light mode.

## ✨ Funcionalidades

### 🏠 Página Inicial (Home)
- Formulário para submissão de e-mails (texto ou upload de arquivo)
- Processamento e classificação automática
- Geração de respostas automatizadas
- Histórico de e-mails processados recentemente
- Sistema de tabs para visualização de resultados

### 📊 Dashboard
- Estatísticas de e-mails processados
- Cards com métricas principais:
  - Total de e-mails processados
  - Categoria mais usada
  - Média de score

### 📨 E-mails
- Listagem completa de todos os e-mails processados
- Filtros por categoria e score
- Busca por assunto ou conteúdo
- Cards expansíveis com preview do conteúdo
- Layout responsivo em grid

### 🗂️ Categorias
- Gerenciamento completo de categorias
- Criação de novas categorias
- Adição de exemplos por categoria (conteúdo + resposta ideal)
- Listagem de exemplos cadastrados
- Interface em duas colunas (categorias à esquerda, exemplos à direita)

### 🎨 Tema
- Suporte completo a dark/light mode
- Toggle de tema na navbar
- Persistência da preferência do usuário
- Transições suaves entre temas

## 🚀 Tecnologias Utilizadas

- **React 18.3.1** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.9.3** - Superset tipado do JavaScript
- **Vite 5.4.21** - Build tool e dev server
- **Tailwind CSS 4.1.17** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI reutilizáveis
- **Radix UI** - Primitivos acessíveis para React
- **lucide-react** - Biblioteca de ícones
- **Wouter** - Roteamento leve para React
- **Sonner** - Biblioteca de toast notifications

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ ou Node.js 22+
- pnpm (recomendado) ou npm

### Passos

1. **Instalar dependências:**
```bash
pnpm install
# ou
npm install
```

2. **Iniciar servidor de desenvolvimento:**
```bash
pnpm dev
# ou
npm run dev
```

3. **Acessar a aplicação:**
```
http://localhost:5173
```

## 🏗️ Build para Produção

```bash
pnpm build
# ou
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

### Preview do Build

```bash
pnpm preview
# ou
npm run preview
```

## 📁 Estrutura do Projeto

```
client/
├── public/                 # Arquivos estáticos
│   ├── autou_logo.jpeg
│   ├── dark_logo.png
│   └── light_logo.png
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes shadcn/ui
│   │   ├── Navbar.tsx    # Barra de navegação
│   │   ├── HomePage.tsx  # Página inicial
│   │   ├── DashboardPage.tsx
│   │   ├── EmailsPage.tsx
│   │   └── CategoriesPage.tsx
│   ├── contexts/         # Contextos React
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Hooks customizados
│   │   └── useTheme.ts
│   ├── lib/              # Utilitários
│   │   └── utils.ts
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Ponto de entrada
│   ├── index.css         # Estilos globais e tema
│   └── const.ts          # Constantes
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎯 Arquitetura

### Sistema de Navegação

O projeto **não utiliza React Router**. A navegação é gerenciada por state interno no `App.tsx`:

```typescript
const [currentPage, setCurrentPage] = useState('home');

// Renderização condicional
{currentPage === 'home' && <HomePage />}
{currentPage === 'dashboard' && <DashboardPage />}
{currentPage === 'emails' && <EmailsPage />}
{currentPage === 'categories' && <CategoriesPage />}
```

### Gerenciamento de Tema

O tema é gerenciado pelo `ThemeContext` e persiste no localStorage:

```typescript
const { theme, toggleTheme } = useTheme();
```

### Dados Mock

Atualmente, todas as páginas utilizam dados mock (simulados) em JavaScript/TypeScript. Para integração com backend real:

1. Substitua as funções mock por chamadas à API
2. Utilize os endpoints sugeridos:
   - `GET /emails` - Listar e-mails
   - `GET /categorias` - Listar categorias
   - `POST /categorias` - Criar categoria
   - `GET /examples` - Listar exemplos
   - `POST /examples` - Criar exemplo
   - `GET /stats` - Estatísticas do dashboard

## 🎨 Padrão Visual

O projeto mantém um padrão visual consistente:

- **Cores primárias**: Azul (definido em `index.css`)
- **Componentes**: shadcn/ui com Radix UI
- **Ícones**: lucide-react
- **Tipografia**: Sistema padrão do navegador
- **Espaçamento**: Baseado em Tailwind CSS
- **Responsividade**: Mobile-first com breakpoints do Tailwind

### Paleta de Cores

Definida em `src/index.css`:
- Light mode: Fundo branco, texto escuro
- Dark mode: Fundo escuro, texto claro
- Primary: Azul 700
- Accent: Variações de cinza

## 🔧 Configuração

### Vite

O arquivo `vite.config.ts` está configurado para:
- Suporte a React com plugin oficial
- Tailwind CSS 4 via plugin
- Aliases de path (`@/` aponta para `src/`)
- Servidor configurado para aceitar conexões externas

### TypeScript

Configuração estrita habilitada com:
- Target ES2020
- Module ESNext
- JSX React
- Path aliases

## 🚦 Status do Projeto

✅ **Completo e Funcional**

- [x] Navbar com navegação
- [x] Sistema de navegação por state
- [x] Dark/Light mode
- [x] HomePage com formulário de submissão
- [x] DashboardPage com estatísticas
- [x] EmailsPage com listagem e filtros
- [x] CategoriesPage com CRUD completo
- [x] Responsividade
- [x] Dados mock funcionais
- [x] Build otimizado

## 📝 Notas de Desenvolvimento

### Padrão de Código

- Componentes funcionais com TypeScript
- Hooks para gerenciamento de estado
- Componentes pequenos e modulares
- Props tipadas com interfaces
- CSS via Tailwind classes

### Boas Práticas

- Separação de responsabilidades
- Componentes reutilizáveis
- Código limpo e idiomático
- Acessibilidade (via Radix UI)
- Performance otimizada

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Crie novos componentes em `src/components/`
2. Adicione rotas no `App.tsx` se necessário
3. Mantenha o padrão visual existente
4. Utilize componentes shadcn/ui quando possível
5. Teste em ambos os temas (light/dark)

## 📄 Licença

Este projeto foi desenvolvido para uso interno.

## 👥 Autores

Desenvolvido seguindo as especificações do arquivo `pasted_content.txt`.

---

**Versão:** 1.0.0  
**Data:** Novembro 2025
