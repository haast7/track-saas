import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getChartData, type FilterOptions } from '@/lib/dashboard-queries'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filters: FilterOptions = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      funnelId: searchParams.get('funnelId') || undefined,
      domainId: searchParams.get('domainId') || undefined,
      pixelId: searchParams.get('pixelId') || undefined,
    }

    const chartData = await getChartData(user.id, filters)

    return NextResponse.json(chartData)
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

