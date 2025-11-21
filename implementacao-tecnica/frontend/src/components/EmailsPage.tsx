import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Filter, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

// Mock de dados
const mockEmails = [
  { id: '1', assunto: 'Confirmação de Pedido #12345', categoria: 'Produtivo', score: 0.95, conteudo: 'Prezado cliente, seu pedido foi confirmado e será enviado em breve...', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', assunto: 'Dúvida sobre o produto X', categoria: 'Improdutivo', score: 0.45, conteudo: 'Gostaria de saber se o produto X tem a cor azul...', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', assunto: 'Obrigado pelo feedback!', categoria: 'Produtivo', score: 0.88, conteudo: 'Recebemos seu feedback e agradecemos a sua contribuição...', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '4', assunto: 'Newsletter Semanal', categoria: 'Improdutivo', score: 0.20, conteudo: 'Confira as novidades da semana no nosso blog...', created_at: new Date(Date.now() - 345600000).toISOString() },
]

export default function EmailsPage() {
  const [emails, setEmails] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterScore, setFilterScore] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    setIsLoading(true)
    // Simulação de chamada de API (GET /emails)
    await new Promise(resolve => setTimeout(resolve, 500))
    setEmails(mockEmails)
    setIsLoading(false)
  }

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredEmails = emails.filter(email => {
    const matchesCategory = filterCategory === 'all' || email.categoria === filterCategory
    const matchesScore = filterScore === 'all' || (filterScore === 'high' ? email.score >= 0.7 : email.score < 0.7)
    const matchesSearch = searchTerm === '' || 
                          email.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesScore && matchesSearch
  })

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Listagem de E-mails</CardTitle>
          <CardDescription>Visualize e filtre todos os e-mails processados pelo sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por assunto ou conteúdo..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="Produtivo">Produtivo</SelectItem>
                <SelectItem value="Improdutivo">Improdutivo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterScore} onValueChange={setFilterScore}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Scores</SelectItem>
                <SelectItem value="high">Score Alto (maior ou igual a 0.7)</SelectItem>
                <SelectItem value="low">Score Baixo (menor que 0.7)</SelectItem>
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
              {filteredEmails.map(email => {
                const open = expandedIds.has(email.id)
                const scoreColor = getScoreColor(email.score)
                
                return (
                  <Card key={email.id} className="border-border hover:shadow-md transition-shadow">
                    <button
                      onClick={() => toggleExpand(email.id)}
                      className="w-full text-left p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1 pr-4">
                          <CardTitle className="text-base truncate">{email.assunto}</CardTitle>
                          <div className="flex items-center space-x-3 mt-1 text-sm text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${scoreColor}`}>
                              Score: {(email.score * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs">{email.categoria}</span>
                            <span className="flex items-center text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(email.created_at).toLocaleDateString()}
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
                    
                    {open && (
                      <CardContent className="pt-0 border-t mt-2">
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium">Preview do Conteúdo:</p>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm line-clamp-3">{email.conteudo}</p>
                          </div>
                        </div>
                        {/* Aqui poderia ter mais detalhes ou ações */}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
