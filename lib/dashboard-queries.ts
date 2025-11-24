import { createServerSupabaseClient } from './supabase/server'

export interface DashboardMetrics {
  pageviews: number
  clicks: number
  entradas: number // Novas sessões
  saidas: number // Sessões que saíram (última pageview há mais de 30min)
}

export interface ChartDataPoint {
  date: string
  pageviews: number
  clicks: number
  entradas: number
  saidas: number
}

export interface RetentionData {
  date: string
  day0: number
  day1: number
  day2: number
  day3: number
  day4: number
  day5: number
  day6: number
  day7: number
}

export interface FilterOptions {
  startDate?: string
  endDate?: string
  funnelId?: string
  domainId?: string
  pixelId?: string
}

/**
 * Busca métricas gerais do dashboard
 */
export async function getDashboardMetrics(
  userId: string,
  filters: FilterOptions = {}
): Promise<DashboardMetrics> {
  const supabase = await createServerSupabaseClient()

  const { startDate, endDate, funnelId, domainId, pixelId } = filters

  // Buscar funnels do usuário
  const { data: userFunnels, error: funnelsError } = await supabase
    .from('funnels')
    .select('id')
    .eq('user_id', userId)

  if (funnelsError) {
    console.error('Error fetching funnels:', funnelsError)
    return { pageviews: 0, clicks: 0, entradas: 0, saidas: 0 }
  }

  const funnelIds = userFunnels?.map(f => f.id) || []

  if (funnelIds.length === 0) {
    return { pageviews: 0, clicks: 0, entradas: 0, saidas: 0 }
  }

  // Query para pageviews
  let pageviewsQuery = supabase
    .from('pageviews')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)

  if (funnelId) pageviewsQuery = pageviewsQuery.eq('funnel_id', funnelId)
  if (domainId) pageviewsQuery = pageviewsQuery.eq('domain_id', domainId)
  if (pixelId) pageviewsQuery = pageviewsQuery.eq('pixel_id', pixelId)
  if (startDate) pageviewsQuery = pageviewsQuery.gte('created_at', startDate)
  if (endDate) pageviewsQuery = pageviewsQuery.lte('created_at', endDate)

  const { count: pageviewsCount } = await pageviewsQuery

  // Query para clicks
  let clicksQuery = supabase
    .from('clicks')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)

  if (funnelId) clicksQuery = clicksQuery.eq('funnel_id', funnelId)
  if (domainId) clicksQuery = clicksQuery.eq('domain_id', domainId)
  if (pixelId) clicksQuery = clicksQuery.eq('pixel_id', pixelId)
  if (startDate) clicksQuery = clicksQuery.gte('created_at', startDate)
  if (endDate) clicksQuery = clicksQuery.lte('created_at', endDate)

  const { count: clicksCount } = await clicksQuery

  // Query para entradas (eventos ENTER do Telegram)
  let entradasQuery = supabase
    .from('telegram_events')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .eq('event_type', 'ENTER')

  if (funnelId) entradasQuery = entradasQuery.eq('funnel_id', funnelId)
  if (startDate) entradasQuery = entradasQuery.gte('created_at', startDate)
  if (endDate) entradasQuery = entradasQuery.lte('created_at', endDate)

  const { count: entradasCount } = await entradasQuery

  // Query para saídas (eventos EXIT do Telegram)
  let saidasQuery = supabase
    .from('telegram_events')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .eq('event_type', 'EXIT')

  if (funnelId) saidasQuery = saidasQuery.eq('funnel_id', funnelId)
  if (startDate) saidasQuery = saidasQuery.gte('created_at', startDate)
  if (endDate) saidasQuery = saidasQuery.lte('created_at', endDate)

  const { count: saidasCount } = await saidasQuery

  return {
    pageviews: pageviewsCount || 0,
    clicks: clicksCount || 0,
    entradas: entradasCount || 0,
    saidas: saidasCount || 0,
  }
}

/**
 * Busca dados para o gráfico de linha
 */
export async function getChartData(
  userId: string,
  filters: FilterOptions = {}
): Promise<ChartDataPoint[]> {
  const supabase = await createServerSupabaseClient()

  const { startDate, endDate, funnelId, domainId, pixelId } = filters

  // Buscar funnels do usuário
  const { data: userFunnels, error: funnelsError } = await supabase
    .from('funnels')
    .select('id')
    .eq('user_id', userId)

  if (funnelsError) {
    console.error('Error fetching funnels:', funnelsError)
    return []
  }

  const funnelIds = userFunnels?.map(f => f.id) || []

  if (funnelIds.length === 0) {
    return []
  }

  // Buscar pageviews agrupados por data
  let pageviewsQuery = supabase
    .from('pageviews')
    .select('id, created_at, session_id, funnel_id')
    .in('funnel_id', funnelIds)

  if (funnelId) pageviewsQuery = pageviewsQuery.eq('funnel_id', funnelId)
  if (domainId) pageviewsQuery = pageviewsQuery.eq('domain_id', domainId)
  if (pixelId) pageviewsQuery = pageviewsQuery.eq('pixel_id', pixelId)
  if (startDate) pageviewsQuery = pageviewsQuery.gte('created_at', startDate)
  if (endDate) pageviewsQuery = pageviewsQuery.lte('created_at', endDate)

  const { data: pageviews } = await pageviewsQuery

  // Buscar clicks
  let clicksQuery = supabase
    .from('clicks')
    .select('id, created_at, session_id, funnel_id')
    .in('funnel_id', funnelIds)

  if (funnelId) clicksQuery = clicksQuery.eq('funnel_id', funnelId)
  if (domainId) clicksQuery = clicksQuery.eq('domain_id', domainId)
  if (pixelId) clicksQuery = clicksQuery.eq('pixel_id', pixelId)
  if (startDate) clicksQuery = clicksQuery.gte('created_at', startDate)
  if (endDate) clicksQuery = clicksQuery.lte('created_at', endDate)

  const { data: clicks } = await clicksQuery

  // Buscar sessões
  let sessionsQuery = supabase
    .from('sessions')
    .select('id, created_at, funnel_id')
    .in('funnel_id', funnelIds)

  if (funnelId) entriesQuery = entriesQuery.eq('funnel_id', funnelId)
  if (startDate) entriesQuery = entriesQuery.gte('created_at', startDate)
  if (endDate) entriesQuery = entriesQuery.lte('created_at', endDate)

  const { data: entries } = await entriesQuery

  // Buscar saídas (telegram_events EXIT)
  let exitsQuery = supabase
    .from('telegram_events')
    .select('id, created_at, funnel_id')
    .in('funnel_id', funnelIds)
    .eq('event_type', 'EXIT')

  if (funnelId) exitsQuery = exitsQuery.eq('funnel_id', funnelId)
  if (startDate) exitsQuery = exitsQuery.gte('created_at', startDate)
  if (endDate) exitsQuery = exitsQuery.lte('created_at', endDate)

  const { data: exits } = await exitsQuery

  // Agrupar por data
  const dataMap = new Map<string, ChartDataPoint>()

  // Processar pageviews
  pageviews?.forEach(pv => {
    const date = new Date(pv.created_at).toISOString().split('T')[0]
    if (!dataMap.has(date)) {
      dataMap.set(date, {
        date,
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
      })
    }
    const point = dataMap.get(date)!
    point.pageviews++
  })

  // Processar clicks
  clicks?.forEach(click => {
    const date = new Date(click.created_at).toISOString().split('T')[0]
    if (!dataMap.has(date)) {
      dataMap.set(date, {
        date,
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
      })
    }
    const point = dataMap.get(date)!
    point.clicks++
  })

  // Processar entradas (eventos ENTER)
  entries?.forEach(entry => {
    const date = new Date(entry.created_at).toISOString().split('T')[0]
    if (!dataMap.has(date)) {
      dataMap.set(date, {
        date,
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
      })
    }
    const point = dataMap.get(date)!
    point.entradas++
  })

  // Processar saídas (eventos EXIT)
  exits?.forEach(exit => {
    const date = new Date(exit.created_at).toISOString().split('T')[0]
    if (!dataMap.has(date)) {
      dataMap.set(date, {
        date,
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
      })
    }
    const point = dataMap.get(date)!
    point.saidas++
  })

  return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Busca dados de retenção diária (simplificado)
 */
export async function getRetentionData(
  userId: string,
  filters: FilterOptions = {}
): Promise<RetentionData[]> {
  const supabase = await createServerSupabaseClient()

  const { startDate, endDate, funnelId, domainId, pixelId } = filters

  // Buscar funnels do usuário
  const { data: userFunnels, error: funnelsError } = await supabase
    .from('funnels')
    .select('id')
    .eq('user_id', userId)

  if (funnelsError) {
    console.error('Error fetching funnels:', funnelsError)
    return []
  }

  const funnelIds = userFunnels?.map(f => f.id) || []

  if (funnelIds.length === 0) {
    return []
  }

  // Buscar eventos ENTER (entradas)
  let entriesQuery = supabase
    .from('telegram_events')
    .select('id, created_at, funnel_id, session_id')
    .in('funnel_id', funnelIds)
    .eq('event_type', 'ENTER')

  if (funnelId) entriesQuery = entriesQuery.eq('funnel_id', funnelId)
  if (startDate) entriesQuery = entriesQuery.gte('created_at', startDate)
  if (endDate) entriesQuery = entriesQuery.lte('created_at', endDate)

  const { data: entries } = await entriesQuery

  if (!entries || entries.length === 0) {
    return []
  }

  // Agrupar entradas por data de criação (cohort)
  const cohortMap = new Map<string, string[]>() // date -> session_ids

  entries.forEach(entry => {
    if (!entry.session_id) return
    const date = new Date(entry.created_at).toISOString().split('T')[0]
    if (!cohortMap.has(date)) {
      cohortMap.set(date, [])
    }
    cohortMap.get(date)!.push(entry.session_id)
  })

  // Para cada cohort, verificar atividade nos próximos 7 dias
  const retentionData: RetentionData[] = []

  for (const [cohortDate, sessionIds] of cohortMap.entries()) {
    const cohortDateObj = new Date(cohortDate)
    const days = [0, 1, 2, 3, 4, 5, 6, 7]
    const dayCounts: number[] = []

    for (const dayOffset of days) {
      const targetDate = new Date(cohortDateObj)
      targetDate.setDate(targetDate.getDate() + dayOffset)
      const targetDateStr = targetDate.toISOString().split('T')[0]

      // Contar sessões com pageviews na data alvo
      let count = 0
      for (const sessionId of sessionIds) {
        if (!sessionId) continue
        const { data: pageviews } = await supabase
          .from('pageviews')
          .select('id')
          .eq('session_id', sessionId)
          .gte('created_at', `${targetDateStr}T00:00:00Z`)
          .lt('created_at', `${targetDateStr}T23:59:59Z`)
          .limit(1)

        if (pageviews && pageviews.length > 0) {
          count++
        }
      }
      dayCounts.push(count)
    }

    retentionData.push({
      date: cohortDate,
      day0: dayCounts[0],
      day1: dayCounts[1],
      day2: dayCounts[2],
      day3: dayCounts[3],
      day4: dayCounts[4],
      day5: dayCounts[5],
      day6: dayCounts[6],
      day7: dayCounts[7],
    })
  }

  return retentionData.sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Busca lista de funnels do usuário
 */
export async function getFunnels(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('funnels')
    .select('id, name')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    console.error('Error fetching funnels:', error)
    return []
  }

  return data || []
}

/**
 * Busca lista de domínios do usuário
 */
export async function getDomains(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('domains')
    .select('id, name, domain')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    console.error('Error fetching domains:', error)
    return []
  }

  return data || []
}

/**
 * Busca lista de pixels do usuário
 */
export async function getPixels(userId: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('pixels')
    .select('id, name, pixel_id, platform')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    console.error('Error fetching pixels:', error)
    return []
  }

  return data || []
}
