import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

type User = {
  id: string
  name: string
  email: string
}

type AuthContextType = {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Carrega token salvo
  useEffect(() => {
    const stored = localStorage.getItem("auth_token")
    if (stored) {
      setToken(stored)
    }
  }, [])

  // Quando o token muda → buscar dados do usuário
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!token) {
        setUser(null)
        return
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }

    loadUserInfo()
  }, [token])

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams()
    body.append("username", email)
    body.append("password", password)

    const res = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || "Falha ao fazer login")
    }

    const data = await res.json()
    const accessToken = data.access_token as string

    setToken(accessToken)
    localStorage.setItem("auth_token", accessToken)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  }
  return ctx
}
