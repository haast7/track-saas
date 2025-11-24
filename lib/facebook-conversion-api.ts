/**
 * Envia eventos para Facebook Conversion API
 * 
 * @param eventName - Nome do evento (ex: 'enter_channel')
 * @param eventData - Dados do evento
 * @param userData - Dados do usuário (opcional)
 * @returns Promise com a resposta da API
 */

interface FacebookEventData {
  event_name: string;
  event_time: number;
  event_id?: string;
  event_source_url?: string;
  action_source?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  user_data?: {
    client_ip_address?: string;
    client_user_agent?: string;
    em?: string[]; // email hash
    ph?: string[]; // phone hash
    external_id?: string[];
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
  };
  custom_data?: Record<string, any>;
}

interface FacebookConversionAPIResponse {
  events_received?: number;
  messages?: Array<{
    code: number;
    message: string;
  }>;
  fbtrace_id?: string;
}

export async function sendFacebookConversionEvent(
  eventName: string,
  options: {
    pixelId: string;
    accessToken: string;
    eventId?: string;
    eventSourceUrl?: string;
    actionSource?: FacebookEventData['action_source'];
    userData?: FacebookEventData['user_data'];
    customData?: Record<string, any>;
    testEventCode?: string; // Para testar eventos
  }
): Promise<FacebookConversionAPIResponse> {
  const {
    pixelId,
    accessToken,
    eventId,
    eventSourceUrl,
    actionSource = 'website',
    userData,
    customData,
    testEventCode,
  } = options;

  const eventData: FacebookEventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: actionSource,
    ...(eventId && { event_id: eventId }),
    ...(eventSourceUrl && { event_source_url: eventSourceUrl }),
    ...(userData && { user_data: userData }),
    ...(customData && { custom_data: customData }),
  };

  const payload = {
    data: [eventData],
    ...(testEventCode && { test_event_code: testEventCode }),
  };

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Facebook Conversion API error: ${JSON.stringify(errorData)}`
      );
    }

    const data: FacebookConversionAPIResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending Facebook Conversion API event:', error);
    throw error;
  }
}

/**
 * Função específica para enviar evento 'enter_channel'
 */
export async function sendEnterChannelEvent(
  options: {
    pixelId: string;
    accessToken: string;
    sessionId?: string;
    url?: string;
    ip?: string;
    userAgent?: string;
    eventId?: string;
    testEventCode?: string;
  }
): Promise<FacebookConversionAPIResponse> {
  const { pixelId, accessToken, sessionId, url, ip, userAgent, eventId, testEventCode } = options;

  return sendFacebookConversionEvent('enter_channel', {
    pixelId,
    accessToken,
    eventId: eventId || sessionId,
    eventSourceUrl: url,
    actionSource: 'website',
    userData: {
      ...(ip && { client_ip_address: ip }),
      ...(userAgent && { client_user_agent: userAgent }),
      ...(sessionId && { external_id: [sessionId] }),
    },
    customData: {
      ...(sessionId && { session_id: sessionId }),
    },
    testEventCode,
  });
}




