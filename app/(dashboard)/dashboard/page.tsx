import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { loadDashboardData } from "@/lib/dashboard-data"
import { MetricCard } from "@/components/dashboard/metric-card"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"
import { RecentEventsTable } from "@/components/dashboard/recent-events-table"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardSkeleton } from "@/components/dashboard/loading-skeleton"
import {
  Eye,
  MousePointerClick,
  LogIn,
  LogOut,
  TrendingUp,
  Target,
} from "lucide-react"
import { subDays, formatISO } from "date-fns"

interface DashboardPageProps {
  searchParams: {
    domainId?: string
    funnelId?: string
    dateRange?: "7d" | "30d" | "custom"
  }
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabaseClient()
  
  // Obter o user diretamente (o middleware já protege essa rota)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Calcular datas baseado no período
  const dateRange = searchParams.dateRange || "7d"
  let startDate: Date
  let endDate = new Date()

  if (dateRange === "7d") {
    startDate = subDays(endDate, 7)
  } else if (dateRange === "30d") {
    startDate = subDays(endDate, 30)
  } else {
    // Custom - usar últimos 7 dias como padrão
    startDate = subDays(endDate, 7)
  }

  const filters = {
    funnelId: searchParams.funnelId,
    domainId: searchParams.domainId,
    startDate: formatISO(startDate),
    endDate: formatISO(endDate),
  }

  const data = await loadDashboardData(user.id, filters)

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral das métricas de tracking
        </p>
      </div>

      {/* Filtros */}
      <Suspense fallback={<div className="h-20 bg-muted/20 rounded animate-pulse" />}>
        <DashboardFilters />
      </Suspense>

      {/* Cards de Métricas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Pageviews"
          value={data.metrics.pageviews}
          icon={Eye}
          color="primary"
          description="Últimos 7 dias"
        />
        <MetricCard
          title="Clicks"
          value={data.metrics.clicks}
          icon={MousePointerClick}
          color="secondary"
        />
        <MetricCard
          title="Entradas no Telegram"
          value={data.metrics.entradas}
          icon={LogIn}
          color="primary"
        />
        <MetricCard
          title="Saídas"
          value={data.metrics.saidas}
          icon={LogOut}
          color="secondary"
        />
        <MetricCard
          title="CTR"
          value={`${data.metrics.ctr.toFixed(2)}%`}
          icon={Target}
          color="primary"
          description="Clicks / Pageviews"
        />
        <MetricCard
          title="Taxa de Entrada"
          value={`${data.metrics.taxaEntrada.toFixed(2)}%`}
          icon={TrendingUp}
          color="secondary"
          description="Entradas / Clicks"
        />
      </div>

      {/* Gráfico Principal */}
      <DashboardChart data={data.chartData} />

      {/* Tabela de Eventos Recentes */}
      <RecentEventsTable events={data.recentEvents} />
    </div>
  )
}


export default function DashboardPage(props: DashboardPageProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent {...props} />
    </Suspense>
  )
}
