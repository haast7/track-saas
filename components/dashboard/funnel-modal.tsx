"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FunnelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Domain {
  id: string
  domain: string
  name?: string
}

interface Pixel {
  id: string
  pixel_id: string
  name: string
}

export function FunnelModal({ open, onOpenChange }: FunnelModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState("")
  const [domainId, setDomainId] = useState<string>("")
  const [pixelId, setPixelId] = useState<string>("")
  const [requestEntry, setRequestEntry] = useState(false)
  const [domains, setDomains] = useState<Domain[]>([])
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const [loadingPixels, setLoadingPixels] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Carregar domínios e pixels ao abrir o modal
  useEffect(() => {
    if (open) {
      loadDomains()
      loadPixels()
    }
  }, [open])

  const loadDomains = async () => {
    setLoadingDomains(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("domains")
        .select("id, domain, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading domains:", error)
      } else {
        setDomains(data || [])
      }
    } catch (err) {
      console.error("Error loading domains:", err)
    } finally {
      setLoadingDomains(false)
    }
  }

  const loadPixels = async () => {
    setLoadingPixels(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("pixels")
        .select("id, pixel_id, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading pixels:", error)
      } else {
        setPixels(data || [])
      }
    } catch (err) {
      console.error("Error loading pixels:", err)
    } finally {
      setLoadingPixels(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validação
    if (!name.trim()) {
      setError("O nome é obrigatório")
      return
    }

    if (!domainId) {
      setError("O domínio é obrigatório")
      return
    }

    if (!pixelId) {
      setError("O pixel é obrigatório")
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

      // Inserir funil na tabela
      const { error: insertError } = await supabase.from("funnels").insert({
        name: name.trim(),
        domain_id: domainId,
        pixel_id: pixelId,
        request_entry: requestEntry,
        user_id: user.id,
        urls: [], // Array vazio inicialmente
        is_active: true,
      })

      if (insertError) {
        setError(insertError.message || "Erro ao salvar funil")
        setLoading(false)
        return
      }

      // Sucesso - limpar e fechar
      setName("")
      setDomainId("")
      setPixelId("")
      setRequestEntry(false)
      setError(null)
      onOpenChange(false)
      router.refresh() // Atualizar a página para mostrar o novo funil
    } catch (err) {
      setError("Erro ao salvar funil. Tente novamente.")
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setDomainId("")
      setPixelId("")
      setRequestEntry(false)
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
            Criar Funil
          </DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Configure seu funil de conversão
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
                placeholder="Meu Funil de Vendas"
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
              <Label htmlFor="domainId" className="text-[#F1F5F9]">
                Domínio
              </Label>
              <Select
                value={domainId}
                onValueChange={(value) => {
                  setDomainId(value)
                  setError(null)
                }}
                disabled={loading || loadingDomains}
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
                  <SelectValue placeholder="Selecione um domínio" />
                </SelectTrigger>
                <SelectContent className="bg-[#13131A] border-[#1F1F29] text-[#F1F5F9]">
                  {domains.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-[#94A3B8]">
                      Nenhum domínio cadastrado
                    </div>
                  ) : (
                    domains.map((domain) => (
                      <SelectItem
                        key={domain.id}
                        value={domain.id}
                        className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                      >
                        {domain.domain || domain.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixelId" className="text-[#F1F5F9]">
                Pixel
              </Label>
              <Select
                value={pixelId}
                onValueChange={(value) => {
                  setPixelId(value)
                  setError(null)
                }}
                disabled={loading || loadingPixels}
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
                  <SelectValue placeholder="Selecione um pixel" />
                </SelectTrigger>
                <SelectContent className="bg-[#13131A] border-[#1F1F29] text-[#F1F5F9]">
                  {pixels.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-[#94A3B8]">
                      Nenhum pixel cadastrado
                    </div>
                  ) : (
                    pixels.map((pixel) => (
                      <SelectItem
                        key={pixel.id}
                        value={pixel.id}
                        className="focus:bg-[#1F1F29] focus:text-[#F1F5F9]"
                      >
                        {pixel.name} ({pixel.pixel_id})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="requestEntry"
                checked={requestEntry}
                onCheckedChange={(checked) => {
                  setRequestEntry(checked === true)
                }}
                disabled={loading}
                className="border-[#A855F7] data-[state=checked]:bg-[#A855F7] data-[state=checked]:border-[#A855F7]"
              />
              <Label
                htmlFor="requestEntry"
                className="text-sm font-medium text-[#F1F5F9] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Requer entrada no canal
              </Label>
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
              disabled={loading || domains.length === 0 || pixels.length === 0}
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




