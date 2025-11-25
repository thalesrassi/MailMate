import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, Send, Loader2, CheckCircle, ChevronDown, ChevronUp, Clock, XCircle, Copy as CopyIcon, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/useTheme'

type EmailResult = {
  id: string
  assunto: string
  conteudo: string
  resposta: string
  created_at: string
  categoria_id: string | null
  score_id: string | null
}

type HistoryItem = {
  id: string
  assunto: string
  conteudo: string
  resposta: string
  created_at: string
  categoria_id: string | null
  score_id: string | null
}


// Assets estão em /public/dark_logo.png e /public/light_logo.png
const darkLogo = '/dark_logo.png'
const lightLogo = '/light_logo.png'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('submission')
  const [emailText, setEmailText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)
  const [inputMethod, setInputMethod] = useState('text') // 'text' ou 'file'
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({})
  const [scores, setScores] = useState<Array<{ id: string; classificacao: string }>>([])
  const [scoresMap, setScoresMap] = useState<Record<string, { id: string; classificacao: string }>>({})
  const [ratingEmailId, setRatingEmailId] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set()) // controle de “abrir/fechar” card
  const baseUrl = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000'
  // API desabilitada temporariamente — usar mock/localStorage
  const MOCK_MODE = true
  const { darkMode } = useTheme()


  const palette = [
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    "bg-gray-200 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
  ]

  const renderCategoryBadge = (categoriaId: any) => {
    // categoriaId pode vir como: null, número, uuid, string…
    const strId = String(categoriaId || "outros")

    const nome = categoriesMap[strId] || "Outros"

    const index = strId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const color = palette[index % palette.length]

    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${color}`}>
        {nome}
      </span>
    )
  }



  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  )

  // Detecta troca de tema em tempo real
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    loadHistory()
    loadCategories()
    loadScores()
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }


  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyItemResponse(item: any) {
    const content = `Assunto: ${item.assunto || ''}\n\n${item.resposta || ''}`
    navigator.clipboard.writeText(content)
    toast("Conteúdo copiado para a área de transferência!", {
      duration: 2500,
      icon: <CheckCircle className="text-green-500" />,
    })
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${baseUrl}/categories/`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Falha ao carregar categorias')
      }

      const data = await res.json()
      const itemsRaw = Array.isArray(data) ? data : (data.items ?? [])

      const map: Record<string, string> = {}
      itemsRaw.forEach((cat: any) => {
        if (cat.id) {
          map[String(cat.id)] = cat.nome ?? String(cat.id)
        }
      })

      setCategoriesMap(map)
    } catch (e: any) {
      console.error(e)
      toast(e.message || 'Falha ao carregar categorias', {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    }
  }

  async function loadScores() {
    try {
      const res = await fetch(`${baseUrl}/scores/`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Falha ao carregar scores')
      }

      const data = await res.json()
      const itemsRaw = Array.isArray(data) ? data : (data.items ?? [])

      const list = itemsRaw.map((s: any) => ({
        id: String(s.id),
        classificacao: s.classificacao,
      }))

      const map: Record<string, { id: string; classificacao: string }> = {}
      list.forEach((s) => {
        map[s.id] = s
      })

      setScores(list)
      setScoresMap(map)
    } catch (e: any) {
      console.error(e)
      toast(e.message || 'Falha ao carregar scores', {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    }
  }


  async function loadHistory() {
    try {
      setIsLoadingHistory(true)

      const params = new URLSearchParams({
        page: "1",
        page_size: "20",
      })

      const res = await fetch(`${baseUrl}/emails/?${params.toString()}`)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Falha ao carregar histórico de e-mails")
      }

      const data = await res.json()
      const itemsRaw = Array.isArray(data) ? data : (data.items ?? [])

      const mapped: HistoryItem[] = itemsRaw.map((item: any) => ({
        id: String(item.id),
        assunto: item.assunto,
        conteudo: item.conteudo,
        resposta: item.resposta,
        created_at: item.created_at,
        categoria_id: item.categoria_id ?? null,
        score_id: item.score_id ?? null,
      }))

      setHistory(mapped)
    } catch (e: any) {
      console.error(e)
      toast(e.message || "Falha ao carregar histórico de e-mails", {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }


  const callApi = async () => {
    setIsLoading(true)
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL ?? "http://localhost:8000"

      const form = new FormData()

      if (inputMethod === "text") {
        form.append("conteudo", emailText)
      } else if (inputMethod === "file" && uploadedFile) {
        form.append("file", uploadedFile)
      }

      const res = await fetch(`${baseUrl}/emails/`, {
        method: "POST",
        body: form,
      })


      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Falha ao processar e-mail")
      }
      const data = await res.json()

      const mapped: EmailResult = {
        id: String(data.id),
        assunto: data.assunto,
        conteudo: data.conteudo,
        resposta: data.resposta,
        created_at: data.created_at,
        categoria_id: data.categoria_id ?? null,
        score_id: data.score_id ?? null,
      }

      // atualiza resultado e histórico local
      setResult(mapped)
      setActiveTab('result')

      toast("E-mail processado com sucesso!", {
        duration: 2500,
        icon: <CheckCircle className="text-green-500" />,
      })
    } catch (e) {
      console.error(e)
      toast(e.message || "Erro ao enviar para API", {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRateEmail(emailId: string, scoreId: string) {
    try {
      setRatingEmailId(emailId)

      const res = await fetch(`${baseUrl}/emails/${emailId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score_id: scoreId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Falha ao registrar avaliação")
      }

      const updated = await res.json()

      // atualiza histórico
      setHistory(prev =>
        prev.map(item =>
          item.id === emailId ? { ...item, score_id: updated.score_id ?? scoreId } : item
        )
      )

      // atualiza result atual, se for o mesmo e-mail
      setResult(prev =>
        prev && prev.id === emailId
          ? { ...prev, score_id: updated.score_id ?? scoreId }
          : prev
      )

      toast("Avaliação registrada!", {
        duration: 2500,
        icon: <CheckCircle className="text-green-500" />,
      })
    } catch (e: any) {
      console.error(e)
      toast(e.message || "Erro ao registrar avaliação", {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    } finally {
      setRatingEmailId(null)
    }
  }


  const handleSubmit = () => {
    if ((inputMethod === 'text' && emailText.trim()) || (inputMethod === 'file' && uploadedFile)) {
      callApi()
    }
  }

  const copyToClipboard = () => {
    if (result) {
      const content = `Assunto: ${result.assunto}\n\n${result.resposta}`
      navigator.clipboard.writeText(content)
      toast("Conteúdo copiado para a área de transferência!", {
        duration: 2500,
        icon: <CheckCircle className="text-green-500" />,
      })
    }
  }

  const sendEmail = () => {
    if (result) {
      const subject = encodeURIComponent(result.assunto)
      const body = encodeURIComponent(result.resposta)
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Info */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automatização de E-mails</CardTitle>
            <CardDescription>
              Otimize a rotina: a IA lê, classifica e responde seus e-mails em segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <img
                  src={isDark ? darkLogo : lightLogo}
                  alt={isDark ? "Logo (dark)" : "Logo (light)"}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p>• Ganho de eficiência</p>
              <p>• Classificação de e-mails</p>
              <p>• Geração de respostas automatizadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Tabs */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1">
            <TabsTrigger
              value="submission"
              disabled={isLoading}
              className={`flex items-center space-x-2 cursor-pointer transition-all ${
                activeTab === 'submission'
                  ? `font-semibold rounded-md shadow-md ${darkMode ? 'ring-2 ring-primary/25' : 'ring-1 ring-primary/25'}`
                  : ''
              }`}
              style={!darkMode ? { backgroundColor: "var(--card)", color: "var(--card-foreground)" } : undefined}
            >
              <Upload className="w-4 h-4" />
              <span>Submissão</span>
            </TabsTrigger>

            <TabsTrigger
              value="result"
              disabled={!result && !isLoading}
              className={`flex items-center space-x-2 cursor-pointer transition-all ${
                activeTab === 'result'
                  ? `font-semibold rounded-md shadow-md ${darkMode ? 'ring-2 ring-primary/25' : 'ring-1 ring-primary/25'}`
                  : ''
              }`}
              style={!darkMode ? { backgroundColor: "var(--card)", color: "var(--card-foreground)" } : undefined}
            >
              <Mail className="w-4 h-4" />
              <span>Resultado</span>
            </TabsTrigger>
          </TabsList>

          {/* Submission Tab */}
          <TabsContent value="submission" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Solicitação</CardTitle>
                <CardDescription>
                  Insira o conteúdo do e-mail ou faça upload de um arquivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Method Selection */}
                <div className="flex space-x-4">
                  <Button
                    variant={inputMethod === 'text' ? 'default' : 'outline'}
                    onClick={() => setInputMethod('text')}
                    className="flex-1 cursor-pointer"
                  >
                    Texto
                  </Button>
                  <Button
                    variant={inputMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setInputMethod('file')}
                    className="flex-1 cursor-pointer"
                  >
                    Upload de Arquivo
                  </Button>
                </div>

                {/* Text Input */}
                {inputMethod === 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="email-text">Conteúdo do E-mail</Label>
                    <Textarea
                      id="email-text"
                      placeholder="Digite o conteúdo do e-mail que deseja processar..."
                      value={emailText}
                      onChange={(e) => setEmailText(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                )}

                {/* File Upload */}
                {inputMethod === 'file' && (
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Upload de Arquivo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".txt,.pdf"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {uploadedFile ? uploadedFile.name : 'Clique para selecionar um arquivo'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Formatos aceitos: TXT, PDF
                        </p>
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || (inputMethod === 'text' && !emailText.trim()) || (inputMethod === 'file' && !uploadedFile)}
                  className="w-full cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Gerar E-mail'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Result Tab */}
          <TabsContent value="result" className="mt-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Resultado Gerado</CardTitle>
                <CardDescription className="text-muted-foreground">
                  E-mail processado pela IA
                </CardDescription>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: "var(--primary)" }} />
                      <p className="text-muted-foreground">Processando com IA...</p>
                    </div>
                  </div>
                ) : result ? (
                  <div className="space-y-6">
                    {/* Categoria */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">Categoria:</span>
                      {renderCategoryBadge(result.categoria_id)}
                    </div>

                    {/* Assunto */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Assunto</Label>
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        <p className="text-sm text-foreground break-words">{result.assunto}</p>
                      </div>
                    </div>

                    {/* Corpo do e-mail */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Corpo do E-mail</Label>
                      <div className="p-3 sm:p-4 bg-muted rounded-lg">
                        {/* Safari-iOS: quebra segura de linha/palavra */}
                        <pre className="text-sm whitespace-pre-wrap break-words font-sans text-foreground">
                          {result.resposta}
                        </pre>
                      </div>
                    </div>

                    {/* Avaliação (Score) */}
        
                    {scores.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Avaliar resposta</Label>
                        <div className="flex flex-wrap gap-2">
                          {scores.map((score) => {
                            const isSelected = result.score_id == score.id
                            const alreadyRated = Boolean(result.score_id)
                            const isLoadingRating = ratingEmailId == result.id

                            return (
                              <Button
                                key={score.id}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                disabled={isLoadingRating || alreadyRated}
                                onClick={() => handleRateEmail(result.id, score.id)}
                                className={
                                  "cursor-pointer " +
                                  (isSelected
                                    ? "bg-green-500 text-white hover:bg-green-500 dark:bg-green-600 dark:text-white border-green-500"
                                    : "")
                                }
                              >
                                {isLoadingRating && !alreadyRated && (
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                )}
                                {score.classificacao}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    )}


                    {/* Ações */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="w-full sm:w-auto cursor-pointer"
                        aria-label="Copiar conteúdo gerado"
                      >
                        <CopyIcon className="w-4 h-4 mr-2" />
                        Copiar Conteúdo
                      </Button>

                      <Button
                        onClick={sendEmail}
                        className="w-full sm:w-auto cursor-pointer"
                        aria-label="Enviar e-mail"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar por E-mail
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-60" />
                    <p>Nenhum resultado ainda. Faça uma submissão primeiro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* History List */}
      <div className="lg:col-span-3 mt-5">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Respostas recentes</CardTitle>
              <CardDescription className="mt-1">Últimos E-mails Processados</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={isLoadingHistory}
              className="self-stretch sm:self-auto cursor-pointer"
            >
              {isLoadingHistory ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Atualizando...</span>
                  <span className="sm:hidden">Atualizando</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Recarregar</span>
                  <span className="sm:hidden">Recarregar</span>
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingHistory && history.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Carregando histórico...
              </div>
            )}

            {!isLoadingHistory && history.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Nenhuma resposta gerada ainda.
              </div>
            )}

            {history.map((item: any) => {
              const open = expandedIds.has(item.id)
              const categoriaNome =
                (item.categoria_id && categoriesMap[item.categoria_id]) || "Outros"

              const score = item.score_id ? scoresMap[item.score_id] : null
              let clsColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"

              if (score?.classificacao?.toLowerCase() === "excelente") {
                clsColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              } else if (score?.classificacao?.toLowerCase().startsWith("insatisf")) {
                clsColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }

              return (
                <div key={item.id} className="border border-border rounded-lg bg-card">
                  {/* Cabeçalho do card */}
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left px-3 py-3 sm:px-4 sm:py-3 rounded-t-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      {/* Assunto + badge (esquerda) */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
                        <span
                          className="
                            font-medium text-foreground text-base sm:text-[15px]
                            min-w-0
                            break-words
                            line-clamp-2      /* mobile: até 2 linhas */
                            sm:line-clamp-1   /* desktop: 1 linha */
                            sm:truncate
                          "
                          title={item.assunto || 'Sem assunto'}
                        >
                          {item.assunto || 'Sem assunto'}
                        </span>

                        <span
                          className="shrink-0"
                        >
                          {renderCategoryBadge(item.categoria_id)}
                        </span>
                      </div>

                      {/* Data + chevron (direita) */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                        {open ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>


                  {/* Corpo expandido */}
                  {open && (
                    <div className="px-3 sm:px-4 pb-4">
                    
                      <div className="mt-2 sm:mt-3">
                        <Label className="text-sm font-medium text-foreground">Conteúdo</Label>
                        <div className="p-2 sm:p-3 bg-muted rounded-lg mt-1">
                          {/* quebra segura no iOS */}
                          <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                            {item.conteudo || '-'}
                          </pre>
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-3">
                        <Label className="text-sm font-medium text-foreground">Resposta</Label>
                        <div className="p-2 sm:p-3 bg-muted rounded-lg mt-1">
                          {/* quebra segura no iOS */}
                          <pre className="text-sm whitespace-pre-wrap break-words font-sans">
                            {item.resposta || '-'}
                          </pre>
                        </div>
                      </div>

                     {/* Avaliação */}
                      <div className="mt-3 space-y-2">
                      {scores.length > 0 && (
                        <>
                          <Label className="text-sm font-medium text-foreground">
                            Avaliar resposta
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {scores.map((score) => {
                              const isSelected = item.score_id == score.id
                              const alreadyRated = Boolean(item.score_id)
                              const isLoadingRating = ratingEmailId == item.id

                              return (
                                <Button
                                  key={score.id}  
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  disabled={isLoadingRating || alreadyRated}
                                  onClick={() => handleRateEmail(item.id, score.id)}
                                  className={
                                    "cursor-pointer " +
                                    (isSelected
                                      ? "bg-green-500 text-white hover:bg-green-500 dark:bg-green-600 dark:text-white border-green-500"
                                      : "")
                                  }
                                >
                                  {isLoadingRating && !alreadyRated && (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  )}
                                  {score.classificacao}
                                </Button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>


                      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyItemResponse(item)}
                          className="w-full sm:w-auto cursor-pointer"
                        >
                          <CopyIcon className="w-4 h-4 mr-2" />
                          Copiar resposta
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const subject = encodeURIComponent(item.assunto || '')
                            const body = encodeURIComponent(item.resposta || '')
                            window.location.href = `mailto:?subject=${subject}&body=${body}`
                          }}
                          className="w-full sm:w-auto cursor-pointer"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar e-mail
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </CardContent>

        </Card>
      </div>


    </div>
  )
}
