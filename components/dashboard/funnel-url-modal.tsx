"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FunnelUrl {
  id: string
  url: string
}

interface FunnelUrlModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funnelId: string
  editingUrl: FunnelUrl | null
}

// Regex para validar URL
const URL_REGEX = /^https?:\/\/.+\..+/

export function FunnelUrlModal({
  open,
  onOpenChange,
  funnelId,
  editingUrl,
}: FunnelUrlModalProps) {
  const supabase = createClient()
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Resetar formulário quando o modal abrir/fechar ou editingUrl mudar
  useEffect(() => {
    if (open) {
      if (editingUrl) {
        setUrl(editingUrl.url)
      } else {
        setUrl("")
      }
      setError(null)
    }
  }, [open, editingUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação
    if (!url.trim()) {
      setError("A URL é obrigatória")
      return
    }

    // Validar formato da URL
    if (!URL_REGEX.test(url.trim())) {
      setError("Formato de URL inválido. Use http:// ou https://")
      return
    }

    setLoading(true)

    try {
      // Obter usuário autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Usuário não autenticado")
        setLoading(false)
        return
      }

      if (editingUrl) {
        // Atualizar URL existente
        const { error: updateError } = await supabase
          .from("funnel_urls")
          .update({
            url: url.trim(),
          })
          .eq("id", editingUrl.id)
          .eq("funnel_id", funnelId)
          .eq("user_id", user.id)

        if (updateError) {
          setError(updateError.message || "Erro ao atualizar URL")
          setLoading(false)
          return
        }
      } else {
        // Inserir nova URL
        const { error: insertError } = await supabase.from("funnel_urls").insert({
          url: url.trim(),
          funnel_id: funnelId,
          user_id: user.id,
        })

        if (insertError) {
          setError(insertError.message || "Erro ao salvar URL")
          setLoading(false)
          return
        }
      }

      // Sucesso - fechar modal
      setUrl("")
      setError(null)
      onOpenChange(false)
    } catch (err) {
      setError("Erro ao salvar URL. Tente novamente.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setUrl("")
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "glass border-[#1F1F29] bg-[#13131A]/95",
          "backdrop-blur-md",
          "text-[#F1F5F9]"
        )}
        style={{
          background: "rgba(19, 19, 26, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(31, 31, 41, 0.8)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.3)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#F1F5F9] bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {editingUrl ? "Editar URL" : "Adicionar URL"}
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            {editingUrl
              ? "Atualize a URL do funil"
              : "Adicione uma nova URL para rastreamento"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-[#F1F5F9]">
                URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://exemplo.com/pagina"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#A855F7] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#A855F7] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                  "focus-visible:outline-none",
                  error && "border-destructive"
                )}
                style={{
                  borderColor: error ? undefined : "#A855F7",
                }}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-[#1F1F29] text-[#F1F5F9] hover:bg-[#1F1F29]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "neon-glow-primary hover:shadow-[0_0_15px_#A855F755]",
                "transition-all duration-200"
              )}
            >
              {loading ? "Salvando..." : editingUrl ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}




