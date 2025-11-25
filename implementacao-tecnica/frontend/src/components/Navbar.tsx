import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sun, Moon, Mail, BarChart2, ListFilter, FolderOpen, Menu } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const navItems = [
  { id: "home", label: "Início", icon: Mail },
  { id: "emails", label: "E-mails", icon: ListFilter },
  { id: "categories", label: "Categorias", icon: FolderOpen },
  { id: "dashboard", label: "Dashboards", icon: BarChart2 },
]

interface NavbarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

export default function Navbar({ currentPage, setCurrentPage }: NavbarProps) {
  const { darkMode, toggle } = useTheme()

  return (
    <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Esquerda: logo + título + tagline */}
        <div className="flex items-center space-x-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Mail className="w-5 h-5 text-[color:var(--primary-foreground)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">MailMate</h1>
            <p className="text-xs text-muted-foreground">
              Classificação e respostas automáticas de e-mails
            </p>
          </div>
        </div>

        {/* Centro: Navegação desktop */}
        <nav className="hidden md:flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => setCurrentPage(item.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            )
          })}
        </nav>

        {/* Direita: Toggle de tema + Menu mobile */}
        <div className="flex items-center space-x-2">
          {/* Toggle de tema */}
          <button
            onClick={toggle}
            className="p-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Alternar tema"
            title={darkMode ? "Tema claro" : "Tema escuro"}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-foreground/70" />
            )}
          </button>

          {/* Menu mobile */}
        <div className="md:hidden">
          <DropdownMenu>
            {/* Trigger nativo do Radix, sem Button e sem asChild */}
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id

                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={isActive ? "bg-muted font-medium" : ""}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        </div>
      </div>
    </header>
  )
}
