/**
 * Serviço para conectar webhook do Telegram e salvar status no Supabase
 */

import { createServerSupabaseClient } from "@/lib/supabase/server"

interface ConnectTelegramWebhookParams {
  botToken: string
  webhookUrl: string
  channelId?: string
  userId: string
}

interface TelegramWebhookResponse {
  ok: boolean
  result: boolean
  description?: string
}

interface ConnectWebhookResult {
  success: boolean
  webhookUrl?: string
  error?: string
  telegramResponse?: TelegramWebhookResponse
}

/**
 * Conecta o webhook do Telegram e salva o status no Supabase
 * 
 * @param params - Parâmetros da conexão
 * @param params.botToken - Token do bot do Telegram
 * @param params.webhookUrl - URL do webhook (ex: https://SEU_SAAS.com/api/telegram/webhook)
 * @param params.channelId - ID do canal no Supabase (opcional, para atualizar status)
 * @param params.userId - ID do usuário autenticado
 * @returns Promise com o resultado da conexão
 */
export async function connectTelegramWebhook({
  botToken,
  webhookUrl,
  channelId,
  userId,
}: ConnectTelegramWebhookParams): Promise<ConnectWebhookResult> {
  try {
    // 1. Registrar webhook no Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
      }),
    })

    const telegramData: TelegramWebhookResponse = await telegramResponse.json()

    if (!telegramResponse.ok || !telegramData.ok) {
      return {
        success: false,
        error: telegramData.description || "Erro ao registrar webhook no Telegram",
        telegramResponse: telegramData,
      }
    }

    // 2. Salvar status no Supabase
    const supabase = await createServerSupabaseClient()

    const webhookStatus = {
      webhook_url: webhookUrl,
      webhook_connected: true,
      webhook_connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let updateResult

    if (channelId) {
      // Atualizar canal existente
      const { data, error } = await supabase
        .from("telegram_channels")
        .update(webhookStatus)
        .eq("id", channelId)
        .eq("user_id", userId) // Garantir que o canal pertence ao usuário
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar status do webhook no Supabase:", error)
        // Não falha a requisição se o webhook foi registrado com sucesso
        return {
          success: true,
          webhookUrl,
          telegramResponse: telegramData,
          error: `Webhook conectado, mas erro ao salvar status: ${error.message}`,
        }
      }

      updateResult = data
    } else {
      // Criar novo registro de status (ou atualizar o primeiro canal do usuário)
      const { data: existingChannel } = await supabase
        .from("telegram_channels")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single()

      if (existingChannel) {
        const { data, error } = await supabase
          .from("telegram_channels")
          .update(webhookStatus)
          .eq("id", existingChannel.id)
          .eq("user_id", userId)
          .select()
          .single()

        if (error) {
          console.error("Erro ao atualizar status do webhook no Supabase:", error)
          return {
            success: true,
            webhookUrl,
            telegramResponse: telegramData,
            error: `Webhook conectado, mas erro ao salvar status: ${error.message}`,
          }
        }

        updateResult = data
      } else {
        // Se não houver canal, apenas retorna sucesso (o canal será criado depois)
        return {
          success: true,
          webhookUrl,
          telegramResponse: telegramData,
        }
      }
    }

    return {
      success: true,
      webhookUrl,
      telegramResponse: telegramData,
    }
  } catch (error) {
    console.error("Erro ao conectar webhook do Telegram:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao conectar webhook",
    }
  }
}


