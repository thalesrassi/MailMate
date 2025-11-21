import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Mail, MessageSquare, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'

// Mock de dados
const mockCategories = [
  { id: 'cat-1', name: 'Vendas', examples: [
    { id: 'ex-1', email_content: 'Gostaria de saber o preço do produto X.', ideal_response: 'Olá! O preço do produto X é R$ 199,00. Posso te ajudar com mais detalhes?' },
    { id: 'ex-2', email_content: 'Quais as formas de pagamento?', ideal_response: 'Aceitamos cartão de crédito, boleto e PIX.' },
  ]},
  { id: 'cat-2', name: 'Suporte', examples: [
    { id: 'ex-3', email_content: 'Meu produto chegou quebrado.', ideal_response: 'Lamentamos o ocorrido. Por favor, envie fotos do produto e da embalagem para iniciarmos a troca.' },
  ]},
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [newExample, setNewExample] = useState({ email_content: '', ideal_response: '' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    // Simulação de chamada de API (GET /categorias)
    await new Promise(resolve => setTimeout(resolve, 500))
    setCategories(mockCategories)
    setSelectedCategory(mockCategories[0] || null)
    setIsLoading(false)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.")
      return
    }
    setIsLoading(true)
    // Simulação de chamada de API (POST /categorias)
    await new Promise(resolve => setTimeout(resolve, 500))
    const newCat = { id: `cat-${Date.now()}`, name: newCategoryName.trim(), examples: [] }
    setCategories(prev => [...prev, newCat])
    setSelectedCategory(newCat)
    setNewCategoryName('')
    toast.success(`Categoria "${newCat.name}" criada com sucesso!`)
    setIsLoading(false)
  }

  const handleAddExample = async () => {
    if (!selectedCategory) return
    if (!newExample.email_content.trim() || !newExample.ideal_response.trim()) {
      toast.error("Conteúdo do e-mail e resposta ideal não podem ser vazios.")
      return
    }
    setIsLoading(true)
    // Simulação de chamada de API (POST /examples)
    await new Promise(resolve => setTimeout(resolve, 500))
    const example = { id: `ex-${Date.now()}`, ...newExample }
    
    setCategories(prev => prev.map(cat => 
      cat.id === selectedCategory.id 
        ? { ...cat, examples: [...cat.examples, example] } 
        : cat
    ))
    setSelectedCategory(prev => ({ ...prev, examples: [...prev.examples, example] }))
    setNewExample({ email_content: '', ideal_response: '' })
    toast.success(`Exemplo adicionado à categoria "${selectedCategory.name}"!`)
    setIsLoading(false)
  }

  const handleDeleteExample = (exampleId) => {
    if (!selectedCategory) return
    
    setCategories(prev => prev.map(cat => 
      cat.id === selectedCategory.id 
        ? { ...cat, examples: cat.examples.filter(ex => ex.id !== exampleId) } 
        : cat
    ))
    setSelectedCategory(prev => ({ ...prev, examples: prev.examples.filter(ex => ex.id !== exampleId) }))
    toast.info("Exemplo removido.")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna da Esquerda: Gerenciamento de Categorias */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Adicionar Nova Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome da Categoria</Label>
              <Input
                id="category-name"
                placeholder="Ex: Cobrança, Suporte, Vendas"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleAddCategory} 
              disabled={isLoading || !newCategoryName.trim()}
              className="w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Categoria
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorias Existentes</CardTitle>
            <CardDescription>Selecione uma categoria para gerenciar exemplos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory?.id === cat.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {cat.name} ({cat.examples.length})
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coluna da Direita: Gerenciamento de Exemplos */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCategory ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Exemplo para "{selectedCategory.name}"</CardTitle>
                <CardDescription>Use exemplos para treinar a IA a responder e-mails desta categoria.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-content">Conteúdo do E-mail (Exemplo)</Label>
                  <Textarea
                    id="email-content"
                    placeholder="Cole aqui o conteúdo de um e-mail real desta categoria."
                    value={newExample.email_content}
                    onChange={(e) => setNewExample(prev => ({ ...prev, email_content: e.target.value }))}
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ideal-response">Resposta Ideal</Label>
                  <Textarea
                    id="ideal-response"
                    placeholder="Digite a resposta que a IA deve gerar para este tipo de e-mail."
                    value={newExample.ideal_response}
                    onChange={(e) => setNewExample(prev => ({ ...prev, ideal_response: e.target.value }))}
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  onClick={handleAddExample} 
                  disabled={isLoading || !newExample.email_content.trim() || !newExample.ideal_response.trim()}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Adicionar Exemplo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exemplos Cadastrados ({selectedCategory.examples.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCategory.examples.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum exemplo cadastrado para esta categoria.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCategory.examples.map(example => (
                      <div key={example.id} className="border p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-primary" />
                            Conteúdo do E-mail
                          </h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteExample(example.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">{example.email_content}</p>
                        
                        <h4 className="font-semibold text-sm flex items-center mt-3">
                          <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                          Resposta Ideal
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">{example.ideal_response}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <p>Selecione uma categoria na coluna ao lado para gerenciar seus exemplos.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
