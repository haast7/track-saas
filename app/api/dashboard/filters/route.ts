import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFunnels, getDomains, getPixels } from '@/lib/dashboard-queries'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [funnels, domains, pixels] = await Promise.all([
      getFunnels(user.id),
      getDomains(user.id),
      getPixels(user.id),
    ])

    return NextResponse.json({ funnels, domains, pixels })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

