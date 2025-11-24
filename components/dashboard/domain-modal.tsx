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

interface DomainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Regex para validar domínio (sem protocolo)
const DOMAIN_REGEX = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i

export function DomainModal({ open, onOpenChange }: DomainModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [domain, setDomain] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação
    if (!domain.trim()) {
      setError("O domínio é obrigatório")
      return
    }

    // Validar formato do domínio
    if (!DOMAIN_REGEX.test(domain.trim())) {
      setError("Formato de domínio inválido. Exemplo: exemplo.com")
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

      // Inserir domínio na tabela
      const { error: insertError } = await supabase.from("domains").insert({
        domain: domain.trim(),
        name: domain.trim(), // Usar domain como name também
        user_id: user.id,
        is_active: true,
      })

      if (insertError) {
        setError(insertError.message || "Erro ao salvar domínio")
        setLoading(false)
        return
      }

      // Sucesso - limpar e fechar
      setDomain("")
      setError(null)
      onOpenChange(false)
      router.refresh() // Atualizar a página para mostrar o novo domínio
    } catch (err) {
      setError("Erro ao salvar domínio. Tente novamente.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setDomain("")
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
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(168, 85, 247, 0.2)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-[#F1F5F9] bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Adicionar Domínio
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Digite o domínio sem protocolo (ex: exemplo.com)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-[#F1F5F9]">
                Domínio
              </Label>
              <Input
                id="domain"
                type="text"
                placeholder="exemplo.com"
                value={domain}
                onChange={(e) => {
                  setDomain(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#22D3EE] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#22D3EE] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                  "focus-visible:outline-none",
                  error && "border-destructive"
                )}
                style={{
                  borderColor: error ? undefined : "#22D3EE",
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
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

