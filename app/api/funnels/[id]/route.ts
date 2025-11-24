import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Validar ownership de pixel_id e domain_id se fornecidos
    if (body.pixel_id) {
      const { data: pixel } = await supabase
        .from('pixels')
        .select('id')
        .eq('id', body.pixel_id)
        .eq('user_id', user.id)
        .single()

      if (!pixel) {
        return NextResponse.json(
          { error: 'Pixel não encontrado ou não pertence a você' },
          { status: 403 }
        )
      }
    }

    if (body.domain_id) {
      const { data: domain } = await supabase
        .from('domains')
        .select('id')
        .eq('id', body.domain_id)
        .eq('user_id', user.id)
        .single()

      if (!domain) {
        return NextResponse.json(
          { error: 'Domínio não encontrado ou não pertence a você' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('funnels')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { error } = await supabase
      .from('funnels')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Decrementar usage
    await supabase.rpc('decrement_usage_funnels', { p_user_id: user.id })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
