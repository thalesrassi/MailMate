import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Upload, Send, Loader2, CheckCircle,ChevronDown, ChevronUp, Clock, XCircle, Copy as CopyIcon, Sun, Moon, Mail, Menu } from 'lucide-react'
import './App.css'
import { Toaster, toast } from 'sonner'
import darkLogo from '@/assets/dark_logo.png'
import lightLogo from '@/assets/light_logo.png'


function App() {
  const [activeTab, setActiveTab] = useState('submission')
  const [emailText, setEmailText] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [inputMethod, setInputMethod] = useState('text') // 'text' ou 'file'
  const [history, setHistory] = useState([])            // lista de e-mails do backend
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [expandedIds, setExpandedIds] = useState(new Set()) // controle de “abrir/fechar” card
  // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  // API desabilitada temporariamente — usar mock/localStorage
  const MOCK_MODE = true
  const { darkMode, toggle } = useTheme()

  useEffect(() => {
    loadHistory()
  }, [])

  function useTheme() {
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  function buildSubject(classification, original) {
    // Heurística simples só pra ter um assunto "ok"
    if (classification === 'Produtivo') return 'Retorno AutoU Invest — seu atendimento'
    if (classification === 'Improdutivo') return 'Agradecimento — AutoU Invest'
    // fallback: usa trecho do original
    const base = (original || '').replace(/\s+/g, ' ').slice(0, 60)
    return base ? `Re: ${base}` : 'Retorno — AutoU Invest'
  }

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyItemResponse(item) {
    const content = `Assunto: ${item.assunto || ''}\n\n${item.resposta || ''}`
    navigator.clipboard.writeText(content)
    toast("Conteúdo copiado para a área de transferência!", {
      duration: 2500,
      icon: <CheckCircle className="text-green-500" />,
    })
  }

  async function loadHistory() {
    try {
      setIsLoadingHistory(true)
      // Carrega histórico do localStorage (mock)
      const raw = localStorage.getItem('mailmate_history')
      const items = raw ? JSON.parse(raw) : []
      setHistory(Array.isArray(items) ? items : [])
    } catch (e) {
      console.error(e)
      toast("Falha ao carregar histórico local", {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const callApi = async () => {
    // Mock local: simula processamento sem chamar backend
    setIsLoading(true)
    try {
      // simula tempo de processamento
      await new Promise((resolve) => setTimeout(resolve, 700))

      // heurística simples para classificação
      const classificacaoGuess = (() => {
        const text = (inputMethod === 'text' ? emailText : (uploadedFile?.name || '')).toLowerCase()
        if (!text.trim()) return 'Improdutivo'
        if (text.includes('obrig') || text.includes('parab') || text.includes('sucesso') || text.includes('confirm')) return 'Produtivo'
        return Math.random() > 0.5 ? 'Produtivo' : 'Improdutivo'
      })()

      const assunto = buildSubject(classificacaoGuess, inputMethod === 'text' ? emailText : uploadedFile?.name)
      const resposta = `Olá,\n\nObrigado pelo contato. ${classificacaoGuess === 'Produtivo' ? 'Encaminharemos o atendimento o mais breve possível.' : 'Agradecemos sua mensagem e registramos a solicitação.'}\n\nAtenciosamente,\nEquipe AutoU`

      const now = new Date().toISOString()
      const item = {
        id: String(Date.now()),
        assunto,
        classificacao: classificacaoGuess,
        resposta,
        conteudo: inputMethod === 'text' ? emailText : uploadedFile?.name || '',
        created_at: now,
      }

      const mapped = {
        subject: item.assunto,
        body: item.resposta,
        classification: item.classificacao,
        originalContent: item.conteudo,
        id: item.id,
        createdAt: item.created_at,
      }

      // atualiza resultado e histórico local
      setResult(mapped)
      setActiveTab('result')
      setHistory((prev) => {
        const next = [item, ...prev].slice(0, 10)
        try {
          localStorage.setItem('mailmate_history', JSON.stringify(next))
        } catch (e) {
          console.error('Falha ao salvar histórico local', e)
        }
        return next
      })

      toast("E-mail processado com sucesso (mock)!", {
        duration: 2500,
        icon: <CheckCircle className="text-green-500" />,
      })
    } catch (e) {
      console.error(e)
      toast(e.message || "Falha ao processar (mock)", {
        duration: 3000,
        icon: <XCircle className="text-red-500" />,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if ((inputMethod === 'text' && emailText.trim()) || (inputMethod === 'file' && uploadedFile)) {
      callApi()
    }
  }

  const copyToClipboard = () => {
    if (result) {
      const content = `Assunto: ${result.subject}\n\n${result.body}`
      navigator.clipboard.writeText(content)
      toast("Conteúdo copiado para a área de transferência!", {
        duration: 2500,
        icon: <CheckCircle className="text-green-500" />,
      })
    }
  }

  const sendEmail = () => {
    if (result) {
      const subject = encodeURIComponent(result.subject)
      const body = encodeURIComponent(result.body)
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
    <header className="bg-card border-b border-border px-4 py-4">
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
            <h1 className="text-xl font-semibold text-foreground">SmartMail AutoU</h1>
            <p className="text-xs text-muted-foreground">
              Classificação e respostas automáticas de e-mails
            </p>
          </div>
        </div>

        {/* Direita: status, CTA, tema, menu mobile */}
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

          {/* Menu mobile (mantido) */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>


      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
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
                      src={darkMode ? darkLogo : lightLogo}
                      alt={darkMode ? "Logo (dark)" : "Logo (light)"}
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
              <TabsList className="grid w-full grid-cols-2 ">
                <TabsTrigger
                  value="submission"
                  disabled={isLoading}
                  className="flex items-center space-x-2 cursor-pointer"
                  style={!darkMode ? { backgroundColor: "var(--card)", color: "var(--card-foreground)" } : undefined}
                >
                  <Upload className="w-4 h-4" />
                  <span>Submissão</span>
                </TabsTrigger>

                <TabsTrigger
                  value="result"
                  disabled={!result && !isLoading}
                  className="flex items-center space-x-2 cursor-pointer"
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
                        {/* Classificação */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Classificação:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${
                              result.classification === 'Produtivo'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {result.classification}
                          </span>
                        </div>

                        {/* Assunto */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Assunto</Label>
                          <div className="p-3 sm:p-4 bg-muted rounded-lg">
                            <p className="text-sm text-foreground break-words">{result.subject}</p>
                          </div>
                        </div>

                        {/* Corpo do e-mail */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-foreground">Corpo do E-mail</Label>
                          <div className="p-3 sm:p-4 bg-muted rounded-lg">
                            {/* Safari-iOS: quebra segura de linha/palavra */}
                            <pre className="text-sm whitespace-pre-wrap break-words font-sans text-foreground">
                              {result.body}
                            </pre>
                          </div>
                        </div>

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

              {history.map((item) => {
                const open = expandedIds.has(item.id)
                const clsColor =
                  item.classificacao === 'Produtivo'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'

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
                            className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${clsColor}`}
                          >
                            {item.classificacao || '—'}
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
                        <div className="mt-1 sm:mt-2">
                          <Label className="text-sm font-medium text-foreground">Classificação</Label>
                          <div className={`inline-block ml-2 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-medium ${clsColor}`}>
                            {item.classificacao}
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
      </main>
      <Toaster position="bottom-center" richColors />
    </div>
  )
}

export default App

