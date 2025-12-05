import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Plus, Trash2, Mail, MessageSquare, FolderOpen, Edit, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { IconButtonWithTooltip } from './IconButtonWithTooltip'
import { useApi } from "@/lib/api"

type Example = {
  id: string
  conteudo: string
  resposta: string
}

type Category = {
  id: string
  nome: string
  descricao: string
  cor: string
  examples: Example[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [newExample, setNewExample] = useState<Example>({ id: '', conteudo: '', resposta: '' })
  const [descExpanded, setDescExpanded] = useState(false)
  const [expandedExamples, setExpandedExamples] = useState<Record<string, boolean>>({})
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteExampleOpen, setDeleteExampleOpen] = useState<string | null>(null)

  // edição de categoria
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const baseUrl = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8000'
  const { apiFetch } = useApi()

  const toggleExampleExpand = (id: string) => {
    setExpandedExamples(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  useEffect(() => {
    fetchCategories()
  }, [])
  
  // reset description expand when switching category
  useEffect(() => {
    setDescExpanded(false)
  }, [selectedCategory])

  useEffect(() => {
    if (selectedCategory) {
      setEditName(selectedCategory.nome)
      setEditDescription(selectedCategory.descricao ?? '')
    } else {
      setEditName('')
      setEditDescription('')
    }
  }, [selectedCategory])

  const fetchCategoryExamples = async (categoryId: string): Promise<Example[]> => {
    const url = `/examples/?categoria_id=${encodeURIComponent(categoryId)}`
    const res = await apiFetch(url)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || 'Falha ao carregar exemplos')
    }

    const data = await res.json()
    const items = Array.isArray(data) ? data : (data.items ?? [])

    const examples: Example[] = items.map((ex: any) => ({
      id: String(ex.id),
      conteudo: ex.conteudo,
      resposta: ex.resposta,
      // created_at: ex.created_at,
      // updated_at: ex.updated_at,
    }))

    return examples
  }


  const fetchCategories = async () => {
    try {
      setIsLoading(true)

      const res = await apiFetch("/categories/")
      if (!res.ok) {
        throw new Error('Falha ao carregar categorias')
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.items ?? [])

      // Normaliza categorias sem exemplos ainda
      let normalized: Category[] = items.map((cat: any) => ({
        id: String(cat.id),
        nome: cat.nome,
        descricao: cat.descricao ?? '',
        cor: cat.cor ?? '#6366F1',
        examples: [],
      }))

      if (normalized.length === 0) {
        setCategories([])
        setSelectedCategory(null)
        return
      }

      // Carrega exemplos de TODAS as categorias em paralelo
      const withExamples: Category[] = await Promise.all(
        normalized.map(async (cat) => {
          try {
            const examples = await fetchCategoryExamples(cat.id)
            return { ...cat, examples }
          } catch (err: any) {
            console.error(err)
            toast.error(
              err.message ||
                `Erro ao carregar exemplos da categoria "${cat.nome}"`
            )
            return cat // volta sem exemplos se der erro
          }
        })
      )

      setCategories(withExamples)
      // Seleciona a primeira categoria já com exemplos carregados
      setSelectedCategory(withExamples[0] ?? null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }




  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.")
      return
    }
    try {
      setIsLoading(true)
      const res = await apiFetch("/categories/", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newCategoryName.trim(), descricao: newCategoryDescription.trim() }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || 'Falha ao criar categoria')
      }

      const created = await res.json()


      const newCat: Category = {
        id: String(created.id),
        nome: created.nome ?? newCategoryName.trim(),
        descricao: created.descricao ?? newCategoryDescription.trim(),
        cor: created.cor ?? '#6366F1',
        examples: [],
      }

      setCategories(prev => [...prev, newCat])
      setSelectedCategory(newCat)
      setNewCategoryName('')
      setNewCategoryDescription('')
      toast.success(`Categoria "${newCat.nome}" criada com sucesso!`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }

  }

  const handleAddExample = async () => {
    if (!selectedCategory) return

    if (!newExample.conteudo.trim() || !newExample.resposta.trim()) {
      toast.error("Conteúdo do e-mail e resposta ideal não podem ser vazios.")
      return
    }

    try {
      setIsLoading(true)

      const res = await apiFetch("/examples/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria_id: selectedCategory.id,
          conteudo: newExample.conteudo.trim(),
          resposta: newExample.resposta.trim(),
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || "Falha ao adicionar exemplo")
      }

      const created = await res.json()

      const example: Example = {
        id: String(created.id),
        conteudo: created.conteudo,
        resposta: created.resposta,
      }

      // Atualiza lista de categorias
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? { ...cat, examples: [...cat.examples, example] }
            : cat
        )
      )

      // Atualiza categoria selecionada (com guarda de null)
      setSelectedCategory((prev) =>
        prev
          ? { ...prev, examples: [...prev.examples, example] }
          : prev
      )

      setNewExample({ id: "", conteudo: "", resposta: "" })

      toast.success(`Exemplo adicionado à categoria "${selectedCategory.nome}"!`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao adicionar exemplo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string | undefined) => {
    if (!categoryId) return

    try {
      setIsLoading(true)

      const res = await apiFetch(`/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || "Falha ao excluir categoria")
      }

      // Remove do estado
      setCategories(prev => prev.filter(cat => cat.id !== categoryId))
      setSelectedCategory(null)

      toast.success("Categoria excluída com sucesso!")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao excluir categoria")
    } finally {
      setIsLoading(false)
    }
  }


  const handleDeleteExample = async (exampleId: string) => {
    if (!selectedCategory) return

    try {
      setIsLoading(true)

      const res = await apiFetch(`/examples/${exampleId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || "Falha ao remover exemplo")
      }

      // Atualiza lista de categorias
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? { ...cat, examples: cat.examples.filter((ex) => ex.id !== exampleId) }
            : cat
        )
      )

      // Atualiza categoria selecionada
      setSelectedCategory((prev) =>
        prev
          ? { ...prev, examples: prev.examples.filter((ex) => ex.id !== exampleId) }
        : prev
      )

      toast.info("Exemplo removido.")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Erro ao remover exemplo")
    } finally {
      setIsLoading(false)
    }
  }

  // salvar edição da categoria
  const handleSaveCategory = async () => {
    if (!selectedCategory) return
    if (!editName.trim()) {
      toast.error("O nome da categoria não pode ser vazio.")
      return
    }
    try {
      setIsLoading(true)
      const res = await apiFetch(`/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editName.trim(), descricao: editDescription.trim() }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.detail || 'Falha ao atualizar categoria')
      }
      const updated = await res.json()

      // atualiza lista e seleção localmente
      setCategories(prev => prev.map(cat => cat.id === selectedCategory.id ? { ...cat, nome: updated.nome ?? editName.trim(), descricao: updated.descricao ?? editDescription.trim() } : cat))
      setSelectedCategory(prev => prev ? { ...prev, nome: updated.nome ?? editName.trim(), descricao: updated.descricao ?? editDescription.trim() } : prev)
      setEditMode(false)
      toast.success('Categoria atualizada com sucesso.')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao atualizar categoria')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectCategory = async (cat: Category) => {
    setSelectedCategory(cat)
    setDescExpanded(false)
    setEditMode(false)
    setExpandedExamples({}) // reseta expansão dos exemplos
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    if (selectedCategory) {
      setEditName(selectedCategory.nome)
      setEditDescription(selectedCategory.descricao ?? '')
    }
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
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                placeholder="Ex: Cobrança, Suporte, Vendas"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                placeholder="Descreva brevemente o tipo de e-mails que pertencem a esta categoria."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                disabled={isLoading}
                className="h-30"
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
            ) : categories.filter(cat => cat.id !== '7').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categories
                  .filter(cat => cat.id !== '7') // não exibe categoria com id '7' => Outros
                  .map(cat => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory?.id === cat.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => handleSelectCategory(cat)}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {cat.nome} ({cat.examples.length})
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
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">
                      {editMode ? (
                        <input
                          className="w-full bg-transparent border-b border-border px-1 py-1 text-lg font-semibold focus:outline-none"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={isLoading}
                        />
                      ) : (
                        <>Adicionar Exemplo para "{selectedCategory.nome}"</>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Use exemplos para treinar a IA a responder e-mails desta categoria. Quanto mais exemplos, melhor!
                    </CardDescription>
                  </div>

                  {/* BOTÕES — versão responsiva */}
                    <div className="flex items-center justify-end gap-2">
                    {editMode ? (
                      <>
                        {/* SALVAR */}
                        <IconButtonWithTooltip
                          size="icon"
                          variant="default"
                          onClick={handleSaveCategory}
                          disabled={isLoading}
                          tooltip="Salvar alterações"
                          aria-label="Salvar alterações"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </IconButtonWithTooltip>

                        {/* CANCELAR */}
                        <IconButtonWithTooltip
                          size="icon"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isLoading}
                          tooltip="Cancelar edição"
                          aria-label="Cancelar edição"
                        >
                          <X className="w-4 h-4" />
                        </IconButtonWithTooltip>
                      </>
                    ) : (
                      <>
                        {/* EDITAR */}
                        <IconButtonWithTooltip
                          size="icon"
                          variant="outline"
                          onClick={() => setEditMode(true)}
                          aria-label="Editar categoria"
                          tooltip="Editar categoria"
                        >
                          <Edit className="w-4 h-4" />
                        </IconButtonWithTooltip>

                        {/* EXCLUIR CATEGORIA */}
                        <IconButtonWithTooltip
                          size="icon"
                          variant="outline"
                          onClick={() => setDeleteOpen(true)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Excluir categoria"
                          tooltip="Excluir categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </IconButtonWithTooltip>
                      </>
                    )}
                  </div>

                  <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação é permanente e removerá a categoria{" "}
                          <span className="font-semibold">{selectedCategory?.nome}</span> e todos os
                          e-mails e exemplos vinculados.
                          <br />
                          <br />
                          Deseja realmente continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            handleDeleteCategory(selectedCategory?.id)
                            setDeleteOpen(false)
                          }}
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                </div>

                {selectedCategory.descricao && (
                <div className="mt-3">
                  <div className="p-3 bg-muted rounded-md border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 w-full">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Descrição da Categoria:</span>
                        </div>
                          {editMode ? (
                            <Textarea
                              id="edit-description"
                              placeholder="Atualize a descrição da categoria..."
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={6}   // controle de altura
                              disabled={isLoading}
                              className="mt-2"
                            />
                          ) : (
                            <p
                              className={`mt-2 text-sm text-muted-foreground leading-relaxed min-w-0 ${
                                descExpanded ? '' : 'line-clamp-3'
                              }`}
                              title={selectedCategory.descricao}
                            >
                              {selectedCategory.descricao}
                            </p>
                          )}
                      </div>

                      {(!editMode && selectedCategory.descricao.length > 180) && (
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setDescExpanded(prev => !prev)}
                            className="text-xs text-primary hover:underline ml-3"
                          >
                            {descExpanded ? 'Ver menos' : 'Ver mais'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-content">Conteúdo do E-mail (Exemplo)</Label>
                  <Textarea
                    id="email-content"
                    placeholder="Cole aqui o conteúdo de um e-mail real desta categoria."
                    value={newExample.conteudo}
                    onChange={(e) => setNewExample(prev => ({ ...prev, conteudo: e.target.value }))}
                    rows={4}
                    disabled={isLoading || editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ideal-response">Resposta Ideal</Label>
                  <Textarea
                    id="ideal-response"
                    placeholder="Digite a resposta que a IA deve gerar para este tipo de e-mail."
                    value={newExample.resposta}
                    onChange={(e) => setNewExample(prev => ({ ...prev, resposta: e.target.value }))}
                    rows={4}
                    disabled={isLoading || editMode}
                  />
                </div>
                <Button 
                  onClick={handleAddExample} 
                  disabled={isLoading || !newExample.conteudo.trim() || !newExample.resposta.trim()}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Adicionar Exemplo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Exemplos Cadastrados ({selectedCategory.examples.length})
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {selectedCategory.examples.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum exemplo cadastrado para esta categoria.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedCategory.examples.map((example) => {
                      const isConteudoExpanded = expandedExamples[example.id + "-conteudo"] ?? false
                      const isRespostaExpanded = expandedExamples[example.id + "-resposta"] ?? false

                      const conteudo = example.conteudo || ""
                      const resposta = example.resposta || ""

                      const shouldClampConteudo = conteudo.length > 180
                      const shouldClampResposta = resposta.length > 180

                      return (
                        <div key={example.id} className="border p-4 rounded-lg space-y-3">
                          {/* Cabeçalho + botão deletar */}
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm flex items-center">
                              <Mail className="w-4 h-4 mr-2 text-primary" />
                              Conteúdo do E-mail
                            </h4>

                            {/* Botão abre modal */}
                            <IconButtonWithTooltip
                              tooltip="Excluir exemplo"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteExampleOpen(example.id)  // abre o modal para ESTE exemplo
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButtonWithTooltip>
                          </div>

                          {/* ========== Modal de exclusão ========== */}
                          <AlertDialog
                            open={deleteExampleOpen === example.id}
                            onOpenChange={(open) => {
                              if (!open) setDeleteExampleOpen(null)
                            }}
                          >
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir exemplo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é permanente e removerá o exemplo selecionado.
                                  <br /><br />
                                  Deseja realmente continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>

                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={() => {
                                    handleDeleteExample(example.id)
                                    setDeleteExampleOpen(null)
                                  }}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>


                          {/* Conteúdo + Resposta */}
                          <div className="mt-3 space-y-3">
                            {/* Conteúdo do e-mail */}
                            <div>
                              <Label className="text-sm font-medium text-foreground">
                                Conteúdo do E-mail
                              </Label>
                              <div className="p-2 sm:p-3 bg-muted rounded-lg mt-1">
                                <pre
                                  className={[
                                    "text-sm whitespace-pre-wrap break-words font-sans text-muted-foreground",
                                    shouldClampConteudo && !isConteudoExpanded ? "line-clamp-3" : "",
                                  ].join(" ")}
                                >
                                  {conteudo || "-"}
                                </pre>
                              </div>

                              {shouldClampConteudo && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleExampleExpand(example.id + "-conteudo")
                                  }
                                  className="mt-1 text-xs text-primary hover:underline"
                                >
                                  {isConteudoExpanded ? "Ver menos" : "Ver mais"}
                                </button>
                              )}
                            </div>

                            {/* Resposta ideal */}
                            <div>
                              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Resposta Ideal
                              </Label>
                              <div className="p-2 sm:p-3 bg-muted rounded-lg mt-1">
                                <pre
                                  className={[
                                    "text-sm whitespace-pre-wrap break-words font-sans text-muted-foreground",
                                    shouldClampResposta && !isRespostaExpanded ? "line-clamp-3" : "",
                                  ].join(" ")}
                                >
                                  {resposta || "-"}
                                </pre>
                              </div>

                              {shouldClampResposta && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleExampleExpand(example.id + "-resposta")
                                  }
                                  className="mt-1 text-xs text-primary hover:underline"
                                >
                                  {isRespostaExpanded ? "Ver menos" : "Ver mais"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

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
