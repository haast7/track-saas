import { createServerSupabaseClient } from './supabase/server'

export interface FunnelFromSessionResult {
  funnel: {
    id: string
    name: string
    user_id: string
    pixel_id: string | null
    domain_id: string | null
    entry_request_enabled: boolean
    created_at: string
  } | null
  pixel: {
    id: string
    pixel_name: string | null
    pixel_id: string | null
    access_token: string | null
    user_id: string
    created_at: string
  } | null
  user_id: string | null
}

/**
 * Busca informações do funil, pixel e user_id a partir de um sessionId
 * 
 * @param sessionId - ID da sessão
 * @returns Objeto com funnel, pixel e user_id
 */
export async function getFunnelFromSession(
  sessionId: string
): Promise<FunnelFromSessionResult> {
  const supabase = await createServerSupabaseClient()

  // 1. SELECT último click
  const { data: click, error: clickError } = await supabase
    .from('clicks')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (clickError || !click) {
    return {
      funnel: null,
      pixel: null,
      user_id: null
    }
  }

  // 2. Com funnel_id → SELECT funil
  const { data: funnel, error: funnelError } = await supabase
    .from('funnels')
    .select('*')
    .eq('id', click.funnel_id)
    .single()

  if (funnelError || !funnel) {
    return {
      funnel: null,
      pixel: null,
      user_id: funnel?.user_id || null
    }
  }

  // 3. SELECT pixel (se existir)
  let pixel = null
  if (funnel.pixel_id) {
    const { data: pixelData, error: pixelError } = await supabase
      .from('pixels')
      .select('*')
      .eq('id', funnel.pixel_id)
      .single()

    if (!pixelError && pixelData) {
      pixel = pixelData
    }
  }

  // 4. SELECT user_id do funil
  const user_id = funnel.user_id

  return {
    funnel,
    pixel,
    user_id
  }
}


