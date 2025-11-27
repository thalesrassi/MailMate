import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Sun,
  Moon,
  Mail,
  BarChart2,
  ListFilter,
  FolderOpen,
  Menu,
  LogOut,
  UserCircle,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

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
  const { logout, user } = useAuth()

  const handleLogout = () => {
    setCurrentPage("home")
    logout()
  }

  return (
    <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        {/* Esquerda */}
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

        {/* Centro — Desktop */}
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

        {/* Direita */}
        <div className="flex items-center space-x-3">

          {/* Toggle tema */}
          <button
            onClick={toggle}
            className="p-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Alternar tema"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-foreground/70" />
            )}
          </button>

          {/* --- Desktop: Ícone de usuário + logout --- */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="hidden md:flex p-2 rounded-md hover:bg-muted/60 cursor-pointer"
            >
              <UserCircle className="w-6 h-6 text-foreground/80" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">{user?.name}</div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                <LogOut className="w-4 h-4 mr-1 text-red-500" />
                <span className='text-red-500'>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* --- Mobile: Apenas hambúrguer, com user + sair lá dentro --- */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted/60"
              >
                <Menu className="w-5 h-5" />
              </DropdownMenuTrigger>
                              



              <DropdownMenuContent align="end" className="w-48">

                {/* Usuário */}
                <DropdownMenuItem disabled className="opacity-70">
                  <UserCircle className="w-4 h-4 mr-2" />
                  {user?.name ?? "Usuário"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                {/* Navegação */}
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setCurrentPage(item.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </DropdownMenuItem>
                  )
                })}

                <DropdownMenuSeparator />


                {/* Logout */}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2 text-red-500" />
                  <span className='text-red-500'>Sair</span>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>

      </div>
    </header>
  )
}
