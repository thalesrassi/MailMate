import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface LoginPageProps {
  onLoginSuccess?: () => void
  onGoToRegister?: () => void
}

export default function LoginPage({ onLoginSuccess, onGoToRegister }: LoginPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha e-mail e senha.")
      return
    }

    try {
      setIsLoading(true)
      await login(email.trim(), password)
      toast.success("Login realizado com sucesso!")
      onLoginSuccess?.()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Não foi possível fazer login.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
       <CardHeader className="space-y-3 text-center">
        {/* Ícone + Marca */}
        <div className="flex items-center justify-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Mail className="w-5 h-5 text-[color:var(--primary-foreground)]" />
          </div>

          <CardTitle
            className="text-3xl font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.5px" }}
          >
            Mail<span className="font-medium text-primary">Mate</span>
          </CardTitle>
        </div>

        {/* Descrição */}
        <CardDescription className="text-sm text-muted-foreground">
          Acesse sua central inteligente de classificação e respostas automáticas.
        </CardDescription>
      </CardHeader>


        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="mt-3 text-center text-sm">
              <span className="text-muted-foreground">
                Ainda não tem conta?
              </span>{" "}
              <button
                type="button"
                onClick={() => onGoToRegister?.()}
                className="text-primary hover:underline font-medium"
              >
                Criar uma conta
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
