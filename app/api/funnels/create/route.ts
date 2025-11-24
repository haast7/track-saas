import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canCreateFunnel, incrementFunnelsCount } from '@/lib/billing'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, domain_id, pixel_id, request_entry, urls } = body

    // Validação dos campos obrigatórios
    if (!name || !domain_id || !pixel_id) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nome, domínio e pixel são obrigatórios',
        },
        { status: 400 }
      )
    }

    // CORREÇÃO: Validar se domain_id pertence ao usuário (segurança multi-tenant)
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('id', domain_id)
      .eq('user_id', user.id)
      .single()

    if (domainError || !domain) {
      return NextResponse.json(
        {
          error: 'invalid_domain',
          message: 'Domínio não encontrado ou não pertence a você',
        },
        { status: 403 }
      )
    }

    // CORREÇÃO: Validar se pixel_id pertence ao usuário (segurança multi-tenant)
    const { data: pixel, error: pixelError } = await supabase
      .from('pixels')
      .select('id')
      .eq('id', pixel_id)
      .eq('user_id', user.id)
      .single()

    if (pixelError || !pixel) {
      return NextResponse.json(
        {
          error: 'invalid_pixel',
          message: 'Pixel não encontrado ou não pertence a você',
        },
        { status: 403 }
      )
    }

    // Validar plano e limites antes de criar
    const billingCheck = await canCreateFunnel(user.id)

    if (!billingCheck.allowed) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: billingCheck.reason || 'Seu plano atual não permite criar mais funis.',
        },
        { status: 403 }
      )
    }

    // Criar o funil
    const { data: funnel, error: insertError } = await supabase
      .from('funnels')
      .insert({
        name: name.trim(),
        domain_id,
        pixel_id,
        request_entry: request_entry || false,
        user_id: user.id,
        urls: urls || [],
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating funnel:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar funil',
        },
        { status: 500 }
      )
    }

    // Incrementar contador de uso
    try {
      await incrementFunnelsCount(user.id)
    } catch (usageError) {
      console.error('Error incrementing usage:', usageError)
      // Não falha a criação se o incremento falhar, mas loga o erro
    }

    return NextResponse.json(
      { success: true, data: funnel },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/funnels/create:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}



