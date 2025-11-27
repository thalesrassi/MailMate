// src/components/RegisterPage.tsx (ou onde você preferir)

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Mail, Lock, UserPlus, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

interface RegisterPageProps {
  onRegisterSuccess?: () => void
  onGoToLogin?: () => void
}

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"

export default function RegisterPage({
  onRegisterSuccess,
  onGoToLogin,
}: RegisterPageProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("Preencha todos os campos.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    try {
      setIsLoading(true)

      // 1) Criar usuário
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Não foi possível criar a conta.")
      }

      toast.success("Conta criada com sucesso! Entrando...")

      // 2) Login automático após registro
      await login(email.trim(), password)

      onRegisterSuccess?.()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao criar conta.")
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
            <UserPlus className="w-5 h-5 text-[color:var(--primary-foreground)]" />
          </div>

          <CardTitle
            className="text-3xl font-extrabold tracking-tight"
            style={{ letterSpacing: "-0.5px" }}
          >
            Mail<span className="font-medium text-primary">Mate</span>
          </CardTitle>
        </div>

        {/* Descrição nova */}
        <CardDescription className="text-sm text-muted-foreground">
          Crie sua conta para começar a organizar e automatizar seus e-mails.
        </CardDescription>
      </CardHeader>



        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  className="pl-9"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  className="pl-9"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>

            <div className="mt-3 text-center text-sm">
              <span className="text-muted-foreground">
                Já tem uma conta?
              </span>{" "}
              <button
                type="button"
                onClick={() => onGoToLogin?.()}
                className="text-primary hover:underline font-medium"
              >
                Entrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
