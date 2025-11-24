import { createServerSupabaseClient } from './supabase/server'

export interface DashboardData {
  metrics: {
    pageviews: number
    clicks: number
    entradas: number
    saidas: number
    ctr: number
    taxaEntrada: number
  }
  chartData: Array<{
    date: string
    pageviews: number
    clicks: number
    entradas: number
  }>
  recentEvents: Array<{
    id: string
    type: 'pageview' | 'click' | 'enter' | 'exit'
    date: string
    url: string | null
    button: string | null
    session: string | null
  }>
}

export interface DashboardFilters {
  funnelId?: string
  domainId?: string
  startDate: string
  endDate: string
}

/**
 * Carrega dados do dashboard
 */
export async function loadDashboardData(
  userId: string,
  filters: DashboardFilters
): Promise<DashboardData> {
  const supabase = await createServerSupabaseClient()

  // Buscar funnels do usuário
  let funnelsQuery = supabase
    .from('funnels')
    .select('id')
    .eq('user_id', userId)

  if (filters.funnelId) {
    funnelsQuery = funnelsQuery.eq('id', filters.funnelId)
  }

  const { data: userFunnels, error: funnelsError } = await funnelsQuery
  
  if (funnelsError) {
    console.error('Error fetching funnels:', funnelsError)
    return {
      metrics: {
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
        ctr: 0,
        taxaEntrada: 0,
      },
      chartData: [],
      recentEvents: [],
    }
  }
  
  const funnelIds = userFunnels?.map(f => f.id) || []

  if (funnelIds.length === 0) {
    return {
      metrics: {
        pageviews: 0,
        clicks: 0,
        entradas: 0,
        saidas: 0,
        ctr: 0,
        taxaEntrada: 0,
      },
      chartData: [],
      recentEvents: [],
    }
  }

  // 1. SELECT count(*) FROM pageviews
  let pageviewsQuery = supabase
    .from('pageviews')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)

  if (filters.domainId) {
    // Buscar funnels do domínio
    const { data: domainFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain_id', filters.domainId)
      .in('id', funnelIds)

    const domainFunnelIds = domainFunnels?.map(f => f.id) || []
    pageviewsQuery = pageviewsQuery.in('funnel_id', domainFunnelIds)
  }

  const { count: pageviewsCount } = await pageviewsQuery

  // 2. SELECT count(*) FROM clicks
  let clicksQuery = supabase
    .from('clicks')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)

  if (filters.domainId) {
    const { data: domainFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain_id', filters.domainId)
      .in('id', funnelIds)

    const domainFunnelIds = domainFunnels?.map(f => f.id) || []
    clicksQuery = clicksQuery.in('funnel_id', domainFunnelIds)
  }

  const { count: clicksCount } = await clicksQuery

  // 3. SELECT count(*) FROM telegram_events WHERE event_type = 'ENTER'
  let entriesQuery = supabase
    .from('telegram_events')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .eq('event_type', 'ENTER')
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)

  if (filters.domainId) {
    const { data: domainFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain_id', filters.domainId)
      .in('id', funnelIds)

    const domainFunnelIds = domainFunnels?.map(f => f.id) || []
    entriesQuery = entriesQuery.in('funnel_id', domainFunnelIds)
  }

  const { count: entriesCount } = await entriesQuery

  // 4. SELECT count(*) FROM telegram_events WHERE event_type = 'EXIT'
  let exitsQuery = supabase
    .from('telegram_events')
    .select('id', { count: 'exact', head: true })
    .in('funnel_id', funnelIds)
    .eq('event_type', 'EXIT')
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)

  if (filters.domainId) {
    const { data: domainFunnels } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain_id', filters.domainId)
      .in('id', funnelIds)

    const domainFunnelIds = domainFunnels?.map(f => f.id) || []
    exitsQuery = exitsQuery.in('funnel_id', domainFunnelIds)
  }

  const { count: exitsCount } = await exitsQuery

  // Calcular métricas derivadas
  const pageviews = pageviewsCount || 0
  const clicks = clicksCount || 0
  const entradas = entriesCount || 0
  const saidas = exitsCount || 0
  const ctr = pageviews > 0 ? (clicks / pageviews) * 100 : 0
  const taxaEntrada = clicks > 0 ? (entradas / clicks) * 100 : 0

  // 5. SELECT pageviews grouped by day
  const { data: pageviewsByDay } = await supabase
    .from('pageviews')
    .select('created_at')
    .in('funnel_id', funnelIds)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: true })

  // 6. SELECT clicks grouped by day
  const { data: clicksByDay } = await supabase
    .from('clicks')
    .select('created_at')
    .in('funnel_id', funnelIds)
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: true })

  // 7. SELECT entries grouped by day
  const { data: entriesByDay } = await supabase
    .from('telegram_events')
    .select('created_at')
    .in('funnel_id', funnelIds)
    .eq('event_type', 'ENTER')
    .gte('created_at', filters.startDate)
    .lte('created_at', filters.endDate)
    .order('created_at', { ascending: true })

  // Agrupar por dia
  const chartDataMap = new Map<string, { pageviews: number; clicks: number; entradas: number }>()

  // Processar pageviews
  pageviewsByDay?.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    const existing = chartDataMap.get(date) || { pageviews: 0, clicks: 0, entradas: 0 }
    chartDataMap.set(date, { ...existing, pageviews: existing.pageviews + 1 })
  })

  // Processar clicks
  clicksByDay?.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    const existing = chartDataMap.get(date) || { pageviews: 0, clicks: 0, entradas: 0 }
    chartDataMap.set(date, { ...existing, clicks: existing.clicks + 1 })
  })

  // Processar entries
  entriesByDay?.forEach((item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    const existing = chartDataMap.get(date) || { pageviews: 0, clicks: 0, entradas: 0 }
    chartDataMap.set(date, { ...existing, entradas: existing.entradas + 1 })
  })

  // Converter para array e ordenar
  const chartData = Array.from(chartDataMap.entries())
    .map(([date, values]) => ({
      date,
      ...values,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Buscar eventos recentes
  const { data: recentPageviews } = await supabase
    .from('pageviews')
    .select('id, created_at, url, funnel_id')
    .in('funnel_id', funnelIds)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentClicks } = await supabase
    .from('clicks')
    .select('id, created_at, url, button_id, session_id, funnel_id')
    .in('funnel_id', funnelIds)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentEntries } = await supabase
    .from('telegram_events')
    .select('id, created_at, funnel_id')
    .in('funnel_id', funnelIds)
    .eq('event_type', 'ENTER')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentExits } = await supabase
    .from('telegram_events')
    .select('id, created_at, funnel_id')
    .in('funnel_id', funnelIds)
    .eq('event_type', 'EXIT')
    .order('created_at', { ascending: false })
    .limit(10)

  // Combinar e ordenar eventos recentes
  const recentEvents = [
    ...(recentPageviews?.map((e) => ({
      id: e.id,
      type: 'pageview' as const,
      date: e.created_at,
      url: e.url,
      button: null,
      session: null,
    })) || []),
    ...(recentClicks?.map((e) => ({
      id: e.id,
      type: 'click' as const,
      date: e.created_at,
      url: e.url,
      button: e.button_id,
      session: e.session_id,
    })) || []),
    ...(recentEntries?.map((e) => ({
      id: e.id,
      type: 'enter' as const,
      date: e.created_at,
      url: null,
      button: null,
      session: null,
    })) || []),
    ...(recentExits?.map((e) => ({
      id: e.id,
      type: 'exit' as const,
      date: e.created_at,
      url: null,
      button: null,
      session: null,
    })) || []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)

  return {
    metrics: {
      pageviews,
      clicks,
      entradas,
      saidas,
      ctr,
      taxaEntrada,
    },
    chartData,
    recentEvents,
  }
}


