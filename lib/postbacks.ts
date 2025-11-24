import { createClient } from '@supabase/supabase-js'

/**
 * Cria cliente Supabase com service role key para operações de postbacks
 */
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL ou Service Role Key não configurados')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface PostbackEventData {
  funnel_id?: string
  session_id?: string
  url?: string
  pageview_id?: string
  click_id?: string
  button_id?: string
  telegram_user_id?: string
  event_type?: string
}

/**
 * Executa postbacks ativos para um evento específico
 * 
 * @param eventType - Tipo do evento ('ViewPage', 'Clique', 'Entrada no Canal', 'Saída do Canal')
 * @param eventData - Dados do evento para enviar no postback
 */
export async function executePostbacks(
  eventType: 'ViewPage' | 'Clique' | 'Entrada no Canal' | 'Saída do Canal',
  eventData: PostbackEventData
): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient()

    // Buscar todos os postbacks ativos para este evento
    const { data: postbacks, error } = await supabase
      .from('postbacks')
      .select('*')
      .eq('event', eventType)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching postbacks:', error)
      return
    }

    if (!postbacks || postbacks.length === 0) {
      return // Nenhum postback configurado
    }

    // Executar cada postback em paralelo (não bloqueia se um falhar)
    const promises = postbacks.map(async (postback) => {
      try {
        const payload = {
          event: eventType,
          timestamp: new Date().toISOString(),
          ...eventData,
        }

        const requestOptions: RequestInit = {
          method: postback.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }

        // Se for POST ou PUT, incluir body
        if (postback.method === 'POST' || postback.method === 'PUT') {
          requestOptions.body = JSON.stringify(payload)
        } else if (postback.method === 'GET') {
          // Para GET, adicionar dados como query params
          const url = new URL(postback.destination_url)
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.append(key, String(value))
            }
          })
          postback.destination_url = url.toString()
        }

        const response = await fetch(postback.destination_url, {
          ...requestOptions,
          // Timeout de 5 segundos
          signal: AbortSignal.timeout(5000),
        })

        if (!response.ok) {
          console.error(
            `Postback failed for ${postback.name}: ${response.status} ${response.statusText}`
          )
        }
      } catch (error: any) {
        console.error(`Error executing postback ${postback.name}:`, error.message)
        // Não lança erro para não bloquear outros postbacks
      }
    })

    // Aguardar todos os postbacks (mas não falhar se algum falhar)
    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Error in executePostbacks:', error)
    // Não lança erro para não bloquear o fluxo principal
  }
}


