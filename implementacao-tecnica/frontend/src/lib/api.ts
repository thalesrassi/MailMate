import { useAuth } from "@/hooks/useAuth"

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"

export function useApi() {
  const { token } = useAuth()

  async function apiFetch(input: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers || {})

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    // Detecta FormData e NÃO seta Content-Type manualmente
    const isFormData =
      typeof FormData !== "undefined" && init.body instanceof FormData

    if (!headers.has("Content-Type") && init.body && !isFormData) {
      headers.set("Content-Type", "application/json")
    }

    const res = await fetch(`${API_BASE_URL}${input}`, {
      ...init,
      headers,
    })

    return res
  }

  return { apiFetch, API_BASE_URL }
}
