import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * API: Atualizar domínio
 * PATCH /api/domains/[id]
 *
 * Body: { name?: string, domain?: string, is_active?: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()
    const { name, domain, is_active } = body

    // Verificar se domínio pertence ao usuário
    const { data: existingDomain, error: fetchError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDomain) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Domínio não encontrado',
        },
        { status: 404 }
      )
    }

    // Preparar campos para atualização
    const updates: any = {}

    if (name !== undefined) {
      updates.name = name.trim()
    }

    if (domain !== undefined) {
      // Validar formato do domínio
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
      if (!domainRegex.test(domain.trim())) {
        return NextResponse.json(
          {
            error: 'invalid_domain',
            message: 'Domínio inválido. Use apenas o domínio puro (ex: exemplo.com)',
          },
          { status: 400 }
        )
      }
      updates.domain = domain.trim().toLowerCase()
    }

    if (is_active !== undefined) {
      updates.is_active = is_active
    }

    // Se não há nada para atualizar
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nenhum campo para atualizar',
        },
        { status: 400 }
      )
    }

    // Atualizar domínio
    const { data: updatedDomain, error: updateError } = await supabase
      .from('domains')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating domain:', updateError)
      return NextResponse.json(
        {
          error: 'update_failed',
          message: updateError.message || 'Erro ao atualizar domínio',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: updatedDomain },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in PATCH /api/domains/[id]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}

/**
 * API: Deletar domínio
 * DELETE /api/domains/[id]
 *
 * NOTA: Não decrementa usage porque o RLS já impede que outros usuários
 * acessem domínios que não são seus. Decremento pode ser feito via trigger.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verificar se domínio pertence ao usuário
    const { data: existingDomain, error: fetchError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDomain) {
      return NextResponse.json(
        {
          error: 'not_found',
          message: 'Domínio não encontrado',
        },
        { status: 404 }
      )
    }

    // Verificar se há funis usando este domínio
    const { data: funnels, error: funnelsError } = await supabase
      .from('funnels')
      .select('id')
      .eq('domain_id', id)
      .limit(1)

    if (!funnelsError && funnels && funnels.length > 0) {
      return NextResponse.json(
        {
          error: 'domain_in_use',
          message: 'Não é possível deletar este domínio pois ele está sendo usado por funis',
        },
        { status: 409 }
      )
    }

    // Deletar domínio
    const { error: deleteError } = await supabase
      .from('domains')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting domain:', deleteError)
      return NextResponse.json(
        {
          error: 'delete_failed',
          message: deleteError.message || 'Erro ao deletar domínio',
        },
        { status: 500 }
      )
    }

    // Decrementar contador de uso (usando RPC function)
    try {
      await supabase.rpc('decrement_usage_domains', {
        p_user_id: user.id
      })
    } catch (usageError) {
      console.error('Error decrementing usage:', usageError)
      // Não falha a deleção se o decremento falhar
    }

    return NextResponse.json(
      { success: true, message: 'Domínio deletado com sucesso' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/domains/[id]:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}
