/**
 * Serviço para enviar eventos para a Meta (Facebook) Conversion API
 */

interface SendMetaEventParams {
  pixelId: string;
  accessToken: string;
  eventName: string;
  sessionId?: string;
}

interface MetaEventResponse {
  events_received?: number;
  messages?: Array<{
    code: number;
    message: string;
  }>;
  fbtrace_id?: string;
}

/**
 * Envia um evento para a Meta (Facebook) Conversion API
 * 
 * @param params - Parâmetros do evento
 * @param params.pixelId - ID do pixel do Facebook
 * @param params.accessToken - Token de acesso do Facebook
 * @param params.eventName - Nome do evento (ex: "enter_channel", "purchase", etc.)
 * @param params.sessionId - ID da sessão (opcional)
 * @returns Promise com a resposta da API
 */
export async function sendMetaEvent({
  pixelId,
  accessToken,
  eventName,
  sessionId,
}: SendMetaEventParams): Promise<MetaEventResponse> {
  const url = `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`;

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: "telegram",
        action_source: "system_generated",
        user_data: {
          client_user_agent: "telegram_bot",
          ...(sessionId && { external_id: [sessionId] }),
        },
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Meta Conversion API error: ${JSON.stringify(errorData)}`
      );
    }

    const data: MetaEventResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending Meta event:", error);
    throw error;
  }
}




