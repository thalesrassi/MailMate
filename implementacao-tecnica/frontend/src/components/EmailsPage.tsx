import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Search,
  Filter,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Trash2, // ⬅ novo
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { toast } from "sonner"
import { useApi } from "@/lib/api"

type EmailItem = {
  id: string
  assunto: string | null
  conteudo: string | null
  resposta: string | null
  categoria_id: string | null
  score_id: string | null
  created_at: string
}

type Category = {
  id: string
  nome: string
  cor: string 
}

type Score = {
  id: string
  classificacao: string
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterScore, setFilterScore] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [totalEmails, setTotalEmails] = useState<number>(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [emailToDelete, setEmailToDelete] = useState<EmailItem | null>(null)


  const baseUrl =
    (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8000"
  const { apiFetch } = useApi()

  const categoriesMap = categories.reduce<
    Record<string, { nome: string; cor: string }>
  >((acc, cat) => {
    acc[cat.id] = { nome: cat.nome, cor: cat.cor }
    return acc
  }, {})

  const scoresMap = scores.reduce<Record<string, string>>((acc, sc) => {
    acc[sc.id] = sc.classificacao
    return acc
  }, {})

  // -------- Helpers de cor --------

  const getScoreColor = (label: string) => {
    if (label === "Excelente")
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"

    if (label === "Satisfatório")
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"

    if (label === "Insatisfatório")
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"

    return "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }

  const renderCategoryBadge = (categoriaId?: string | null) => {
    if (!categoriaId) return null
    const cat = categoriesMap[categoriaId]
    if (!cat) return null

    return (
      <span
        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{ backgroundColor: cat.cor, color: '#fff' }}
      >
        {cat.nome}
      </span>
    )
  }
  const orderedCategories = [...categories].sort((a, b) => {
    if (a.id === "7") return 1   // "Outros" vai para o fim
    if (b.id === "7") return -1
    return a.nome.localeCompare(b.nome)
  })


  // -------- Fetchers --------

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
        cor: cat.cor ?? '#6366F1', // fallback se vier nulo
      }))

      setCategories(mapped)
      return mapped
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao carregar categorias")
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
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao carregar scores do backend")
      return []
    }
  }

  const fetchEmails = async (): Promise<EmailItem[]> => {
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "50",
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

      const totalFromApi =
        !Array.isArray(data) && typeof data.total === "number"
          ? data.total
          : mapped.length

      setTotalEmails(totalFromApi)
      return mapped
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao carregar e-mails")
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

  const handleDeleteEmail = async () => {
    if (!emailToDelete) return

    const emailId = emailToDelete.id

    try {
      setIsLoading(true)

      const res = await apiFetch(`/emails/${emailId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || "Falha ao excluir e-mail")
      }

      // Remove do estado
      setEmails((prev) => prev.filter((e) => e.id !== emailId))
      setTotalEmails((prev) => Math.max(prev - 1, 0))

      toast.success("E-mail excluído com sucesso!")
    } catch (err: any) {
      console.error(err)
    toast.error(err.message || "Erro ao excluir e-mail")
  } finally {
    setIsLoading(false)
    setDeleteOpen(false)
    setEmailToDelete(null)
  }
}




  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------- Interações --------

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // -------- Filtro --------

  const filteredEmails = emails.filter((email) => {
    const matchesCategory =
      filterCategory === "all" ||
      (email.categoria_id && email.categoria_id == filterCategory)

    const matchesScore =
      filterScore === "all" ||
      (email.score_id && email.score_id == filterScore)

    const assunto = (email.assunto ?? "").toLowerCase()
    const conteudo = (email.conteudo ?? "").toLowerCase()
    const resposta = (email.resposta ?? "").toLowerCase()
    const term = searchTerm.toLowerCase()

    const matchesSearch =
      term === "" ||
      assunto.includes(term) ||
      conteudo.includes(term) ||
      resposta.includes(term)

    return matchesCategory && matchesScore && matchesSearch
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Listagem de E-mails</CardTitle>
              <CardDescription className="mt-1">
                Visualize e filtre todos os e-mails processados pelo sistema.
              </CardDescription>
            </div>

            {/* bloco com contadores */}
            <div className="text-xs sm:text-sm text-muted-foreground">
              {filterCategory === "all" &&
              filterScore === "all" &&
              searchTerm.trim() === "" ? (
                <>
                  Total de e-mails:{" "}
                  <span className="font-semibold text-foreground">
                    {totalEmails}
                  </span>
                </>
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-semibold text-foreground">
                    {filteredEmails.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-foreground">
                    {totalEmails}
                  </span>{" "}
                  e-mails
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca com botão de limpar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por assunto, conteúdo ou resposta..."
                className="pl-10 pr-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro categoria */}
            <Select
              value={filterCategory}
              onValueChange={(value) => setFilterCategory(value)}
            >
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {orderedCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro score */}
            <Select
              value={filterScore}
              onValueChange={(value) => setFilterScore(value)}
            >
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os scores</SelectItem>
                {scores.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id}>
                    {sc.classificacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Listagem */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <p>Carregando e-mails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <p>Nenhum e-mail encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEmails.map((email) => {
                const open = expandedIds.has(email.id)

                const scoreLabel = email.score_id
                  ? scoresMap[email.score_id] ?? "Sem avaliação"
                  : "Sem avaliação"

                const scoreColor = getScoreColor(scoreLabel)

                return (
                  <Card
                    key={email.id}
                    className="border-border hover:shadow-md transition-shadow"
                  >
                    {/* Cabeçalho: expand + botão apagar */}
                    <div className="flex items-center justify-between gap-2 p-4">
                      {/* Botão que abre/fecha o conteúdo */}
                      <button
                        onClick={() => toggleExpand(email.id)}
                        className="flex-1 text-left rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1 pr-4">
                            <CardTitle
                              className="text-base break-words whitespace-normal"
                              style={{ maxHeight: "4.5rem", overflowY: "auto" }}
                              title={email.assunto || "Sem assunto"}
                            >
                              {email.assunto || "Sem assunto"}
                            </CardTitle>

                            <div className="flex items-center flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                              {/* Score badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${scoreColor}`}
                              >
                                {scoreLabel}
                              </span>

                              {/* Categoria badge */}
                              {renderCategoryBadge(email.categoria_id)}

                              {/* Data */}
                              <span className="flex items-center text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(email.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {open ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                          

                        </div>
                      </button>

                      {/* Botão de excluir (abre o AlertDialog) */}
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation() // não dispara o toggleExpand
                          setEmailToDelete(email)
                          setDeleteOpen(true)
                        }}
                        aria-label="Excluir e-mail"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Corpo expandido */}
                    {open && (
                      <CardContent className="pt-0 border-t mt-2">
                        <div className="mt-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Conteúdo do E-mail</p>
                            <div className="p-3 bg-muted rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                                {email.conteudo || "-"}
                              </pre>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">
                              Resposta gerada pela IA
                            </p>
                            <div className="p-3 bg-muted rounded-lg">
                              <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                                {email.resposta || "-"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )

              })}
            </div>
          )}
          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open)
              if (!open) setEmailToDelete(null)
            }}
          >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir e-mail?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é permanente e removerá o e-mail{" "}
                <span className="font-semibold">
                  {emailToDelete?.assunto || "sem assunto"}
                </span>{" "}
                do histórico.
                <br />
                <br />
                Deseja realmente continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteEmail}
                disabled={isLoading}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
