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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PostbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Regex para validar URL
const URL_REGEX = /^https?:\/\/.+\..+/

export function PostbackModal({ open, onOpenChange }: PostbackModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [destinationUrl, setDestinationUrl] = useState("")
  const [event, setEvent] = useState<string>("")
  const [method, setMethod] = useState<string>("POST")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação
    if (!name.trim()) {
      setError("O nome é obrigatório")
      return
    }

    if (!destinationUrl.trim()) {
      setError("A URL destino é obrigatória")
      return
    }

    // Validar formato da URL
    if (!URL_REGEX.test(destinationUrl.trim())) {
      setError("Formato de URL inválido. Use http:// ou https://")
      return
    }

    if (!event) {
      setError("O evento é obrigatório")
      return
    }

    if (!method) {
      setError("O método é obrigatório")
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

      // Inserir postback na tabela
      const { error: insertError } = await supabase.from("postbacks").insert({
        name: name.trim(),
        destination_url: destinationUrl.trim(),
        event: event,
        method: method,
        user_id: user.id,
        is_active: true,
      })

      if (insertError) {
        setError(insertError.message || "Erro ao salvar postback")
        setLoading(false)
        return
      }

      // Sucesso - limpar e fechar
      setName("")
      setDestinationUrl("")
      setEvent("")
      setMethod("POST")
      setError(null)
      onOpenChange(false)
      router.refresh() // Atualizar a página para mostrar o novo postback
    } catch (err) {
      setError("Erro ao salvar postback. Tente novamente.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setDestinationUrl("")
      setEvent("")
      setMethod("POST")
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
            Adicionar Postback
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Configure seu postback de rastreamento
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
                placeholder="Meu Postback"
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
              <Label htmlFor="destinationUrl" className="text-[#F1F5F9]">
                URL destino
              </Label>
              <Input
                id="destinationUrl"
                type="text"
                placeholder="https://exemplo.com/webhook"
                value={destinationUrl}
                onChange={(e) => {
                  setDestinationUrl(e.target.value)
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event" className="text-[#F1F5F9]">
                  Evento
                </Label>
                <Select
                  value={event}
                  onValueChange={(value) => {
                    setEvent(value)
                    setError(null)
                  }}
                  disabled={loading}
                >
                  <SelectTrigger
                    className={cn(
                      "border-[#A855F7] bg-[#0B0B0E] text-[#F1F5F9]",
                      "focus:border-[#A855F7] focus:ring-0",
                      "focus:shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                      error && "border-destructive"
                    )}
                    style={{
                      borderColor: error ? undefined : "#A855F7",
                    }}
                  >
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13131A] border-[#1F1F29] text-[#F1F5F9]">
                    <SelectItem
                      value="pageview"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      Pageview
                    </SelectItem>
                    <SelectItem
                      value="click"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      Click
                    </SelectItem>
                    <SelectItem
                      value="enter"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      Enter
                    </SelectItem>
                    <SelectItem
                      value="exit"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      Exit
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method" className="text-[#F1F5F9]">
                  Método
                </Label>
                <Select
                  value={method}
                  onValueChange={(value) => {
                    setMethod(value)
                    setError(null)
                  }}
                  disabled={loading}
                >
                  <SelectTrigger
                    className={cn(
                      "border-[#A855F7] bg-[#0B0B0E] text-[#F1F5F9]",
                      "focus:border-[#A855F7] focus:ring-0",
                      "focus:shadow-[0_0_10px_rgba(168,85,247,0.3)]",
                      error && "border-destructive"
                    )}
                    style={{
                      borderColor: error ? undefined : "#A855F7",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13131A] border-[#1F1F29] text-[#F1F5F9]">
                    <SelectItem
                      value="GET"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      GET
                    </SelectItem>
                    <SelectItem
                      value="POST"
                      className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                    >
                      POST
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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




