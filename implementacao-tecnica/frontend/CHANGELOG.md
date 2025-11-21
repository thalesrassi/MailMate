# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2025-11-21

### ✨ Adicionado

#### Estrutura Base
- Configuração inicial do projeto com Vite + React + TypeScript
- Integração do Tailwind CSS 4
- Configuração do shadcn/ui com Radix UI
- Sistema de temas (dark/light mode) com ThemeContext

#### Componentes de Interface
- **Navbar**: Barra de navegação fixa com logo, menu e toggle de tema
- **HomePage**: Página inicial com formulário de submissão de e-mails
- **DashboardPage**: Dashboard com cards de estatísticas
- **EmailsPage**: Listagem de e-mails com filtros e busca
- **CategoriesPage**: Gerenciamento completo de categorias e exemplos

#### Funcionalidades
- Sistema de navegação por state interno (sem React Router)
- Processamento mock de e-mails
- Histórico de e-mails processados (localStorage)
- Filtros por categoria e score
- Busca por assunto ou conteúdo
- CRUD de categorias e exemplos
- Cards expansíveis para visualização de detalhes
- Toast notifications com Sonner

#### Componentes UI (shadcn/ui)
- Button, Card, Input, Label, Textarea
- Tabs, Select, Tooltip
- Accordion, Dialog, Dropdown Menu
- E mais 20+ componentes Radix UI

#### Tema e Estilos
- Paleta de cores personalizada (azul como cor primária)
- Suporte completo a dark mode
- Transições suaves entre temas
- Layout responsivo mobile-first
- Ícones lucide-react

### 🔧 Configurado

- Vite com hot reload e build otimizado
- TypeScript com configuração estrita
- Path aliases (`@/` para `src/`)
- ESLint e Prettier (implícito via Vite)
- Build para produção otimizado

### 📝 Documentado

- README.md completo com instruções de instalação e uso
- Documentação da arquitetura do projeto
- Guia de estrutura de pastas
- Notas de desenvolvimento e boas práticas

### 🎨 Design

- Interface moderna e limpa
- Padrão visual consistente em todas as páginas
- Acessibilidade via Radix UI
- Feedback visual para todas as ações do usuário

---

## Próximas Versões (Planejado)

### [1.1.0] - Futuro
- Integração com backend real (FastAPI)
- Autenticação de usuários
- Upload real de arquivos
- Gráficos no Dashboard (Chart.js ou Recharts)
- Paginação na listagem de e-mails
- Exportação de dados (CSV, PDF)

### [1.2.0] - Futuro
- Edição de categorias
- Exclusão de categorias
- Histórico completo de e-mails
- Filtros avançados
- Relatórios personalizados
