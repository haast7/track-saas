"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react"
import { FunnelUrlModal } from "@/components/dashboard/funnel-url-modal"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FunnelUrl {
  id: string
  url: string
  created_at: string
  updated_at: string
}

interface FunnelUrlsContentProps {
  funnelId: string
  funnelName: string
}

export function FunnelUrlsContent({ funnelId, funnelName }: FunnelUrlsContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [urls, setUrls] = useState<FunnelUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUrl, setEditingUrl] = useState<FunnelUrl | null>(null)

  const loadUrls = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from("funnel_urls")
        .select("*")
        .eq("funnel_id", funnelId)
        .order("created_at", { ascending: false })

      if (fetchError) {
        setError(fetchError.message || "Erro ao carregar URLs")
      } else {
        setUrls(data || [])
      }
    } catch (err) {
      setError("Erro ao carregar URLs. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (funnelId) {
      loadUrls()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnelId])

  const handleDelete = async (urlId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta URL?")) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from("funnel_urls")
        .delete()
        .eq("id", urlId)
        .eq("funnel_id", funnelId)

      if (deleteError) {
        setError(deleteError.message || "Erro ao excluir URL")
      } else {
        loadUrls()
      }
    } catch (err) {
      setError("Erro ao excluir URL. Tente novamente.")
    }
  }

  const handleEdit = (url: FunnelUrl) => {
    setEditingUrl(url)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingUrl(null)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingUrl(null)
    loadUrls()
  }

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/funis">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1F1F29]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              URLs do Funil
            </h1>
            <p className="text-muted-foreground">
              {funnelName}
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary hover:shadow-[0_0_15px_#A855F755] transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar URL
        </Button>
      </div>

      {/* Tabela de URLs */}
      <Card className="border-[#1F1F29] bg-[#13131A]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Lista de URLs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-[#1F1F29]/50 rounded border border-[#1F1F29] animate-pulse"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    boxShadow: `0 0 10px rgba(168, 85, 247, ${0.1 + i * 0.02})`,
                  }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUrls}
                className="mt-4 border-[#1F1F29] text-[#F1F5F9] hover:bg-[#1F1F29]"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : !urls || urls.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="mb-4">Nenhuma URL cadastrada</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="border-[#1F1F29] text-[#F1F5F9] hover:bg-[#1F1F29]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira URL
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F1F29]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      URL
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94A3B8]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((url) => (
                    <tr
                      key={url.id}
                      className="border-b border-[#1F1F29]/50 hover:bg-[#1F1F29]/30 transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                    >
                      <td className="py-3 px-4">
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#F1F5F9] hover:text-primary transition-colors break-all"
                        >
                          {url.url}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(url)}
                            className="h-8 w-8 text-secondary hover:text-secondary hover:bg-secondary/10 hover:shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(url.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <FunnelUrlModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        funnelId={funnelId}
        editingUrl={editingUrl}
      />
    </div>
  )
}

