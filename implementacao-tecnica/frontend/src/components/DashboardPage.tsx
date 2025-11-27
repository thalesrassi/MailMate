import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Loader2, Mail, FolderOpen, Star } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { useApi } from "@/lib/api"

type EmailItem = {
  id: string
  assunto: string
  conteudo: string
  resposta: string
  categoria_id: string | null
  score_id: string | null
  created_at: string
}

type Category = {
  id: string
  nome: string
  cor?: string | null
}

type Score = {
  id: string
  classificacao: string
}

export default function DashboardPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl =
    (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"
  const { apiFetch } = useApi()

  // ---------- MAPAS DE APOIO ----------

  const categoriesMap = useMemo(
    () =>
      categories.reduce<Record<string, Category>>((acc, cat) => {
        acc[cat.id] = cat
        return acc
      }, {}),
    [categories]
  )

  const scoresMap = useMemo(
    () =>
      scores.reduce<Record<string, string>>((acc, sc) => {
        acc[sc.id] = sc.classificacao
        return acc
      }, {}),
    [scores]
  )

  // Agrupamento por mês: "11/25", "12/25", ...
  const emailsByMonth = useMemo(() => {
    // key interno para ordenar: "2025-11", "2025-12"
    const counts = new Map<string, { label: string; count: number }>()

    emails.forEach((email) => {
      if (!email.created_at) return

      const d = new Date(email.created_at)
      if (isNaN(d.getTime())) return

      const yearFull = d.getFullYear()
      const month = d.getMonth() + 1

      const yearShort = String(yearFull % 100).padStart(2, "0") // "25"
      const monthStr = String(month).padStart(2, "0")           // "11"
      const label = `${monthStr}/${yearShort}`                  // "11/25"

      const key = `${yearFull}-${monthStr}`                     // para ordenar

      const current = counts.get(key)
      if (current) {
        current.count += 1
      } else {
        counts.set(key, { label, count: 1 })
      }
    })

    // Ordena por ano-mês crescente
    return Array.from(counts.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([_, value]) => value) // [{ label: "11/25", count: 3 }, ...]
  }, [emails])


  // ---------- CORES ----------

  const SCORE_COLORS: Record<string, string> = {
    Excelente: "#16a34a", // verde
    "Satisfatório": "#f59e0b", // amarelo
    "Insatisfatório": "#dc2626", // vermelho
  }

  const FALLBACK_COLORS = [
    "#6366F1", // indigo
    "#EC4899", // rosa
    "#10B981", // verde
    "#F59E0B", // amarelo
    "#3B82F6", // azul
    "#8B5CF6", // roxo
    "#EF4444", // vermelho
    "#14B8A6", // teal
  ]

  const getCategoryColor = (catId: string, index: number): string => {
    const cat = categoriesMap[catId]
    if (cat?.cor) return cat.cor
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
  }

  const getScoreColor = (label: string): string => {
    return SCORE_COLORS[label] ?? "#6b7280"
  }

  // ---------- FETCHERS ----------

  const fetchCategories = async (): Promise<Category[]> => {
    try {
      const res = await apiFetch("/categories/")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Falha ao carregar categorias")
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : data.items ?? []

      const mapped: Category[] = items.map((cat: any) => ({
        id: String(cat.id),
        nome: cat.nome,
        cor: cat.cor ?? null,
      }))

      setCategories(mapped)
      return mapped
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const fetchScores = async (): Promise<Score[]> => {
    try {
      const res = await apiFetch("/scores/")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Falha ao carregar scores")
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : data.items ?? []

      const mapped: Score[] = items.map((sc: any) => ({
        id: String(sc.id),
        classificacao: sc.classificacao,
      }))

      setScores(mapped)
      return mapped
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const fetchEmails = async (): Promise<EmailItem[]> => {
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "100", // dashboard aguenta um volume bom
      })

      const res = await apiFetch(`/emails/?${params.toString()}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Falha ao carregar e-mails")
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : data.items ?? []

      const mapped: EmailItem[] = items.map((item: any) => ({
        id: String(item.id),
        assunto: item.assunto ?? "",
        conteudo: item.conteudo ?? "",
        resposta: item.resposta ?? "",
        categoria_id: item.categoria_id ?? null,
        score_id: item.score_id ?? null,
        created_at: item.created_at,
      }))

      setEmails(mapped)
      return mapped
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const fetchAll = async () => {
    try {
      setIsLoading(true)
      await Promise.all([fetchCategories(), fetchScores(), fetchEmails()])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- AGREGAÇÕES PARA OS GRÁFICOS ----------

  // 1) Emails por categoria (para gráfico de barras)
  const emailsByCategory = useMemo(() => {
    const counter: Record<string, number> = {}

    for (const email of emails) {
      if (!email.categoria_id) continue
      counter[email.categoria_id] = (counter[email.categoria_id] || 0) + 1
    }

    const entries = Object.entries(counter).map(([catId, count], idx) => {
      const cat = categoriesMap[catId]
      return {
        categoriaId: catId,
        categoriaNome: cat?.nome ?? `Categoria ${catId}`,
        count,
        color: getCategoryColor(catId, idx),
      }
    })

    // Ordena por quantidade desc
    entries.sort((a, b) => b.count - a.count)
    return entries
  }, [emails, categoriesMap])

  // 2) Emails por score (para gráfico de pizza)
  const emailsByScore = useMemo(() => {
    const counter: Record<string, number> = {}

    for (const email of emails) {
      if (!email.score_id) continue
      const label = scoresMap[email.score_id] ?? "Sem avaliação"
      counter[label] = (counter[label] || 0) + 1
    }

    const entries = Object.entries(counter).map(([label, count]) => ({
      label,
      count,
      color: getScoreColor(label),
    }))

    return entries
  }, [emails, scoresMap])

  // 3) Emails por semana (gráfico de linha)
  const getWeekKey = (dateStr: string) => {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return "Data inválida"

    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    )
    return `${date.getUTCFullYear()}-S${String(weekNo).padStart(2, "0")}`
  }

  const emailsByWeek = useMemo(() => {
    const counter: Record<string, number> = {}

    for (const email of emails) {
      if (!email.created_at) continue
      const key = getWeekKey(email.created_at)
      counter[key] = (counter[key] || 0) + 1
    }

    const entries = Object.entries(counter).map(([week, count]) => ({
      week,
      count,
    }))

    // Ordena por semana (string já fica em ordem cronológica por ano + SNN)
    entries.sort((a, b) => (a.week < b.week ? -1 : a.week > b.week ? 1 : 0))

    return entries
  }, [emails])

  // ---------- MÉTRICAS DE TOPO ----------

  const totalEmails = emails.length
  const totalCategories = categories.length
  const totalScores = scores.length

  const categoriaMaisUsada =
    emailsByCategory.length > 0 ? emailsByCategory[0].categoriaNome : "—"

  const mediaScore = useMemo(() => {
    if (!emails.length) return "—"

    let sum = 0
    let count = 0

    for (const email of emails) {
      if (!email.score_id) continue
      const label = scoresMap[email.score_id]
      if (label === "Excelente") {
        sum += 3
      } else if (label === "Satisfatório") {
        sum += 2
      } else if (label === "Insatisfatório") {
        sum += 1
      } else {
        continue
      }
      count += 1
    }

    if (!count) return "—"
    const avg = sum / count
    return avg.toFixed(1).replace(".", ",")
  }, [emails, scoresMap])

  // ---------- RENDER ----------

  if (isLoading && !emails.length && !categories.length) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando dados do dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">
              E-mails processados
            </CardTitle>
            <Mail className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEmails.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de e-mails processados pela IA.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Categorias Ativas
            </CardTitle>
            <FolderOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCategories.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Grupos de classificação configurados.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Categoria Mais Usada
            </CardTitle>
            <FolderOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold truncate">
              {categoriaMaisUsada}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Com maior volume de e-mails.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Média de Score (0-3)
            </CardTitle>
            <Star className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado nas avaliações registradas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Emails por categoria - BARRAS */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              E-mails por categoria
            </CardTitle>
            <CardDescription>
              Distribuição do volume de e-mails por categoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {emailsByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Ainda não há dados suficientes para este gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emailsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="categoriaNome"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="count" name="Qtd. de e-mails">
                    {emailsByCategory.map((entry, index) => (
                      <Cell key={entry.categoriaId} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Emails por score - PIZZA */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              E-mails por avaliação
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Como os usuários têm avaliado as respostas da IA.
            </p>
          </CardHeader>
          <CardContent className="h-72">
            {emailsByScore.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Ainda não há avaliações suficientes para este gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emailsByScore}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    labelLine={false}        // remove aquelas linhas estranhas
                  >
                    {emailsByScore.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        stroke="#0f172a"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>

                  <RechartsTooltip
                    formatter={(value: any, _name: any, props: any) => [
                      `${value} e-mail(s)`,
                      props.payload?.label ?? "",
                    ]}
                  />

                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    formatter={(value: any) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>


        {/* Emails por semana - LINHA */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              E-mails processados por mês
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Evolução do número de e-mails ao longo dos meses.
            </p>
          </CardHeader>

          <CardContent className="h-72">
            {emailsByMonth.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Ainda não há dados suficientes para este gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={emailsByMonth}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: -20, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  {/* eixo X: quantidade */}
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                  />
                  {/* eixo Y: "11/25", "12/25"... */}
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={60}
                    tick={{ fontSize: 11 }}
                  />

                  <Tooltip
                    formatter={(value: any) => [`${value} e-mail(s)`, "Quantidade"]}
                    labelFormatter={(label: any) => `Mês ${label}`}
                  />

                  <Bar
                    dataKey="count"
                    radius={[0, 6, 6, 0]}
                    fill="#e879f9" // dentro da sua paleta (primary/rosa)
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  )
}
