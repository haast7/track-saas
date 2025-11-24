"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

interface PixelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PixelModal({ open, onOpenChange }: PixelModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [pixelId, setPixelId] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação - todos obrigatórios
    if (!name.trim()) {
      setError("O nome é obrigatório")
      return
    }

    if (!pixelId.trim()) {
      setError("O Pixel ID é obrigatório")
      return
    }

    if (!token.trim()) {
      setError("O token é obrigatório")
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

      // Inserir pixel na tabela
      const { error: insertError } = await supabase.from("pixels").insert({
        name: name.trim(),
        pixel_id: pixelId.trim(),
        token: token.trim(),
        user_id: user.id,
        platform: "facebook", // Default, pode ser ajustado depois
        is_active: true,
      })

      if (insertError) {
        setError(insertError.message || "Erro ao salvar pixel")
        setLoading(false)
        return
      }

      // Sucesso - limpar e fechar
      setName("")
      setPixelId("")
      setToken("")
      setError(null)
      onOpenChange(false)
      router.refresh() // Atualizar a página para mostrar o novo pixel
    } catch (err) {
      setError("Erro ao salvar pixel. Tente novamente.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setPixelId("")
      setToken("")
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
          <DialogTitle className="text-[#F1F5F9] bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            Adicionar Pixel
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Preencha os dados do pixel de rastreamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#F1F5F9]">
                Nome
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Meu Pixel Facebook"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixelId" className="text-[#F1F5F9]">
                Pixel ID
              </Label>
              <Input
                id="pixelId"
                type="text"
                placeholder="123456789012345"
                value={pixelId}
                onChange={(e) => {
                  setPixelId(e.target.value)
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="token" className="text-[#F1F5F9]">
                Token
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="EAABsbCS1iHgBO..."
                value={token}
                onChange={(e) => {
                  setToken(e.target.value)
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
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
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
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
