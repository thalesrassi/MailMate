import { useState, useEffect } from 'react'

export function useTheme() {
  const [darkMode, setDarkMode] = useState(false)

  // 1) Carrega preferência salva ou do SO
  useEffect(() => {
    const saved = localStorage.getItem("theme") // "dark" | "light" | null
    if (saved) {
      const isDark = saved === "dark"
      setDarkMode(isDark)
      document.documentElement.classList.toggle("dark", isDark)
    } else {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(prefers)
      document.documentElement.classList.toggle("dark", prefers)
    }
  }, [])

  // 2) Aplica e persiste ao mudar
  const toggle = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return { darkMode, toggle }
}
