"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "./useSupabase"
import { useUser } from "./useUser"
import { subDays, formatISO, eachDayOfInterval, format } from "date-fns"

export interface DashboardData {
  pageviews: number
  clicks: number
  entries: number
  exits: number
  ctr: number
  entryRate: number
  chartData: Array<{
    date: string
    pv: number
    cl: number
    en: number
  }>
  recentEvents: Array<{
    id: string
    type: "pageview" | "click" | "enter" | "exit"
    date: string
    url: string | null
    button: string | null
    session: string | null
  }>
}

interface UseDashboardDataParams {
  funnelId?: string
  dateRange: "7d" | "30d" | "custom"
  customStartDate?: Date
  customEndDate?: Date
}

export function useDashboardData({
  funnelId,
  dateRange,
  customStartDate,
  customEndDate,
}: UseDashboardDataParams) {
  const supabase = useSupabase()
  const { user, loading: userLoading } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (userLoading || !user) {
      setLoading(true)
      return
    }

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Calcular datas baseado no período
        let startDate: Date
        let endDate = new Date()

        if (dateRange === "7d") {
          startDate = subDays(endDate, 7)
        } else if (dateRange === "30d") {
          startDate = subDays(endDate, 30)
        } else if (customStartDate && customEndDate) {
          startDate = customStartDate
          endDate = customEndDate
        } else {
          // Fallback para 7 dias
          startDate = subDays(endDate, 7)
        }

        const startDateISO = formatISO(startDate, { representation: "date" })
        const endDateISO = formatISO(endDate, { representation: "date" })

        // Buscar funnels do usuário (RLS garante que só retorna os do user_id)
        let funnelsQuery = supabase
          .from("funnels")
          .select("id")

        if (funnelId) {
          funnelsQuery = funnelsQuery.eq("id", funnelId)
        }

        const { data: userFunnels, error: funnelsError } = await funnelsQuery

        if (funnelsError) {
          console.error('Error fetching funnels:', funnelsError)
          // Retornar dados vazios ao invés de lançar erro
          setData({
            pageviews: 0,
            clicks: 0,
            entries: 0,
            exits: 0,
            ctr: 0,
            entryRate: 0,
            chartData: [],
            recentEvents: [],
          })
          setLoading(false)
          return
        }

        const funnelIds = userFunnels?.map((f) => f.id) || []

        if (funnelIds.length === 0) {
          // Retornar dados vazios se não houver funnels
          setData({
            pageviews: 0,
            clicks: 0,
            entries: 0,
            exits: 0,
            ctr: 0,
            entryRate: 0,
            chartData: [],
            recentEvents: [],
          })
          setLoading(false)
          return
        }

        // 1. COUNT pageviews
        let pageviewsQuery = supabase
          .from("pageviews")
          .select("id, created_at", { count: "exact" })
          .in("funnel_id", funnelIds)
          .gte("created_at", `${startDateISO}T00:00:00.000Z`)
          .lte("created_at", `${endDateISO}T23:59:59.999Z`)

        const { data: pageviewsData, count: pageviewsCount, error: pageviewsError } =
          await pageviewsQuery

        if (pageviewsError) {
          console.error('Error fetching pageviews:', pageviewsError)
          // Continuar com 0 ao invés de lançar erro
        }

        // 2. COUNT clicks
        let clicksQuery = supabase
          .from("clicks")
          .select("id, created_at, url, button_id, session_id", { count: "exact" })
          .in("funnel_id", funnelIds)
          .gte("created_at", `${startDateISO}T00:00:00.000Z`)
          .lte("created_at", `${endDateISO}T23:59:59.999Z`)

        const { data: clicksData, count: clicksCount, error: clicksError } =
          await clicksQuery

        if (clicksError) {
          console.error('Error fetching clicks:', clicksError)
          // Continuar com 0 ao invés de lançar erro
        }

        // 3. COUNT entries
        let entriesQuery = supabase
          .from("telegram_events")
          .select("id, created_at", { count: "exact" })
          .in("funnel_id", funnelIds)
          .eq("event_type", "ENTER")
          .gte("created_at", `${startDateISO}T00:00:00.000Z`)
          .lte("created_at", `${endDateISO}T23:59:59.999Z`)

        const { data: entriesData, count: entriesCount, error: entriesError } =
          await entriesQuery

        if (entriesError) {
          console.error('Error fetching entries:', entriesError)
          // Continuar com 0 ao invés de lançar erro
        }

        // 4. COUNT exits
        let exitsQuery = supabase
          .from("telegram_events")
          .select("id, created_at", { count: "exact" })
          .in("funnel_id", funnelIds)
          .eq("event_type", "EXIT")
          .gte("created_at", `${startDateISO}T00:00:00.000Z`)
          .lte("created_at", `${endDateISO}T23:59:59.999Z`)

        const { data: exitsData, count: exitsCount, error: exitsError } =
          await exitsQuery

        if (exitsError) {
          console.error('Error fetching exits:', exitsError)
          // Continuar com 0 ao invés de lançar erro
        }

        // Calcular métricas
        const pageviews = pageviewsCount || 0
        const clicks = clicksCount || 0
        const entries = entriesCount || 0
        const exits = exitsCount || 0
        const ctr = pageviews > 0 ? (clicks / pageviews) * 100 : 0
        const entryRate = clicks > 0 ? (entries / clicks) * 100 : 0

        // Agrupar por dia - Pageviews
        const pageviewsByDay = new Map<string, number>()
        pageviewsData?.forEach((item) => {
          const date = format(new Date(item.created_at), "yyyy-MM-dd")
          pageviewsByDay.set(date, (pageviewsByDay.get(date) || 0) + 1)
        })

        // Agrupar por dia - Clicks
        const clicksByDay = new Map<string, number>()
        clicksData?.forEach((item) => {
          const date = format(new Date(item.created_at), "yyyy-MM-dd")
          clicksByDay.set(date, (clicksByDay.get(date) || 0) + 1)
        })

        // Agrupar por dia - Entries
        const entriesByDay = new Map<string, number>()
        entriesData?.forEach((item) => {
          const date = format(new Date(item.created_at), "yyyy-MM-dd")
          entriesByDay.set(date, (entriesByDay.get(date) || 0) + 1)
        })

        // Criar array de todos os dias no intervalo
        const allDays = eachDayOfInterval({ start: startDate, end: endDate })

        // Construir chartData - dias sem dados = zero (remove ruído mantendo estrutura)
        const chartData = allDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd")
          return {
            date: dateStr,
            pv: pageviewsByDay.get(dateStr) || 0,
            cl: clicksByDay.get(dateStr) || 0,
            en: entriesByDay.get(dateStr) || 0,
          }
        })

        // Buscar eventos recentes
        const { data: recentPageviews } = await supabase
          .from("pageviews")
          .select("id, created_at, url")
          .in("funnel_id", funnelIds)
          .order("created_at", { ascending: false })
          .limit(10)

        const { data: recentClicks } = await supabase
          .from("clicks")
          .select("id, created_at, url, button_id, session_id")
          .in("funnel_id", funnelIds)
          .order("created_at", { ascending: false })
          .limit(10)

        const { data: recentEntries } = await supabase
          .from("telegram_events")
          .select("id, created_at")
          .in("funnel_id", funnelIds)
          .eq("event_type", "ENTER")
          .order("created_at", { ascending: false })
          .limit(10)

        const { data: recentExits } = await supabase
          .from("telegram_events")
          .select("id, created_at")
          .in("funnel_id", funnelIds)
          .eq("event_type", "EXIT")
          .order("created_at", { ascending: false })
          .limit(10)

        // Combinar eventos recentes
        const recentEvents = [
          ...(recentPageviews?.map((e) => ({
            id: e.id,
            type: "pageview" as const,
            date: e.created_at,
            url: e.url,
            button: null,
            session: null,
          })) || []),
          ...(recentClicks?.map((e) => ({
            id: e.id,
            type: "click" as const,
            date: e.created_at,
            url: e.url,
            button: e.button_id,
            session: e.session_id,
          })) || []),
          ...(recentEntries?.map((e) => ({
            id: e.id,
            type: "enter" as const,
            date: e.created_at,
            url: null,
            button: null,
            session: null,
          })) || []),
          ...(recentExits?.map((e) => ({
            id: e.id,
            type: "exit" as const,
            date: e.created_at,
            url: null,
            button: null,
            session: null,
          })) || []),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 20)

        setData({
          pageviews,
          clicks,
          entries,
          exits,
          ctr,
          entryRate,
          chartData,
          recentEvents,
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Erro desconhecido"))
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, userLoading, funnelId, dateRange, customStartDate?.getTime(), customEndDate?.getTime()])

  return { data, loading, error }
}

