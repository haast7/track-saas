"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Radio, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChannelFormProps {
  initialData: {
    id?: string
    channel_name?: string
    channel_id?: number
    bot_username?: string
    bot_token?: string
  } | null
}

export function ChannelForm({ initialData }: ChannelFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [channelName, setChannelName] = useState(initialData?.channel_name || "")
  const [channelId, setChannelId] = useState(initialData?.channel_id?.toString() || "")
  const [botUsername, setBotUsername] = useState(initialData?.bot_username || "")
  const [botToken, setBotToken] = useState(initialData?.bot_token || "")
  const [loading, setLoading] = useState(false)
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "success" | "error">("idle")

  // Obter URL do Supabase do cliente
  const getSupabaseUrl = () => {
    if (typeof window !== "undefined") {
      // No client, podemos usar a URL do cliente Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      return supabaseUrl || ""
    }
    return ""
  }

  const supabaseUrl = getSupabaseUrl()
  const webhookUrl = `${supabaseUrl}/functions/v1/telegramWebhook`

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validação básica
    if (!channelName.trim() || !botUsername.trim() || !botToken.trim()) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setError("Usuário não autenticado")
        setLoading(false)
        return
      }

      const channelData: any = {
        channel_name: channelName.trim(),
        bot_username: botUsername.trim(),
        bot_token: botToken.trim(),
        user_id: user.id,
      }

      if (channelId.trim()) {
        channelData.channel_id = parseInt(channelId.trim())
      }

      // Insert ou Update
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from("telegram_channels")
          .update(channelData)
          .eq("id", initialData.id)

        if (updateError) {
          setError(updateError.message || "Erro ao atualizar canal")
          setLoading(false)
          return
        }
      } else {
        const { error: insertError } = await supabase
          .from("telegram_channels")
          .insert(channelData)

        if (insertError) {
          setError(insertError.message || "Erro ao salvar canal")
          setLoading(false)
          return
        }
      }

      setSuccess("Canal salvo com sucesso!")
      router.refresh()
    } catch (err) {
      setError("Erro ao salvar canal. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleConnectWebhook = async () => {
    if (!botToken.trim()) {
      setError("Bot Token é necessário para conectar o webhook")
      return
    }

    setWebhookLoading(true)
    setError(null)
    setWebhookStatus("idle")

    try {
      // Obter token de autenticação
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError("Usuário não autenticado")
        setWebhookLoading(false)
        return
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/register-telegram-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          botToken: botToken.trim(),
          webhookUrl: webhookUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.details || data.error || "Erro ao conectar webhook")
        setWebhookStatus("error")
        setWebhookLoading(false)
        return
      }

      setSuccess("Webhook conectado com sucesso!")
      setWebhookStatus("success")
    } catch (err) {
      setError("Erro ao conectar webhook. Tente novamente.")
      setWebhookStatus("error")
    } finally {
      setWebhookLoading(false)
    }
  }

  return (
    <Card
      className={cn(
        "border-[#1F1F29] bg-[#13131A]",
        "relative overflow-hidden",
        "shadow-lg shadow-primary/10"
      )}
    >
      {/* Gradiente de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <CardHeader className="relative z-10">
        <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Configuração do Canal
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="channelName" className="text-[#F1F5F9]">
                Nome do Canal
              </Label>
              <Input
                id="channelName"
                type="text"
                placeholder="Meu Canal"
                value={channelName}
                onChange={(e) => {
                  setChannelName(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#22D3EE] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#22D3EE] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                  "focus-visible:outline-none"
                )}
                style={{
                  borderColor: "#22D3EE",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelId" className="text-[#F1F5F9]">
                Channel ID (opcional)
              </Label>
              <Input
                id="channelId"
                type="text"
                placeholder="1234567890"
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#22D3EE] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#22D3EE] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                  "focus-visible:outline-none"
                )}
                style={{
                  borderColor: "#22D3EE",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="botUsername" className="text-[#F1F5F9]">
                Bot Username
              </Label>
              <Input
                id="botUsername"
                type="text"
                placeholder="@meubot"
                value={botUsername}
                onChange={(e) => {
                  setBotUsername(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#22D3EE] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#22D3EE] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                  "focus-visible:outline-none"
                )}
                style={{
                  borderColor: "#22D3EE",
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-[#F1F5F9]">
                Bot Token
              </Label>
              <Input
                id="botToken"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={botToken}
                onChange={(e) => {
                  setBotToken(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className={cn(
                  "border-[#22D3EE] bg-[#0B0B0E] text-[#F1F5F9]",
                  "focus-visible:border-[#22D3EE] focus-visible:ring-0",
                  "focus-visible:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
                  "focus-visible:outline-none"
                )}
                style={{
                  borderColor: "#22D3EE",
                }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          <div className="flex items-center gap-4 pt-4 border-t border-[#1F1F29]">
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Canal"
              )}
            </Button>

            <Button
              type="button"
              onClick={handleConnectWebhook}
              disabled={webhookLoading || !botToken.trim()}
              variant="secondary"
              className={cn(
                "bg-secondary text-secondary-foreground",
                "hover:bg-secondary/80",
                "neon-glow-secondary hover:shadow-[0_0_15px_#22D3EE55]",
                "transition-all duration-200"
              )}
            >
              {webhookLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : webhookStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Webhook Conectado
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 mr-2" />
                  Conectar Webhook
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

