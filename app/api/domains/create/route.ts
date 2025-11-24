import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canCreateDomain, incrementDomainsCount } from '@/lib/billing'

/**
 * API: Criar domínio
 * POST /api/domains/create
 *
 * Body: { name: string, domain: string }
 *
 * Validações:
 * - Usuário autenticado
 * - Nome e domínio obrigatórios
 * - Domínio puro (sem https://, sem path)
 * - Respeitar limites do plano
 */
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
    const { name, domain } = body

    // Validação dos campos obrigatórios
    if (!name || !domain) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nome e domínio são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar formato do domínio (apenas domínio puro, sem https://, sem path)
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i
    if (!domainRegex.test(domain.trim())) {
      return NextResponse.json(
        {
          error: 'invalid_domain',
          message: 'Domínio inválido. Use apenas o domínio puro (ex: exemplo.com, subdominio.exemplo.com)',
        },
        { status: 400 }
      )
    }

    // Validar plano e limites antes de criar
    const billingCheck = await canCreateDomain(user.id)

    if (!billingCheck.allowed) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: billingCheck.reason || 'Seu plano atual não permite criar mais domínios.',
        },
        { status: 403 }
      )
    }

    // Verificar se domínio já existe para este usuário
    const { data: existingDomain } = await supabase
      .from('domains')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain.trim().toLowerCase())
      .single()

    if (existingDomain) {
      return NextResponse.json(
        {
          error: 'domain_exists',
          message: 'Você já possui um domínio com este nome',
        },
        { status: 409 }
      )
    }

    // Criar o domínio
    const { data: newDomain, error: insertError } = await supabase
      .from('domains')
      .insert({
        name: name.trim(),
        domain: domain.trim().toLowerCase(),
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating domain:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar domínio',
        },
        { status: 500 }
      )
    }

    // Incrementar contador de uso
    try {
      await incrementDomainsCount(user.id)
    } catch (usageError) {
      console.error('Error incrementing usage:', usageError)
      // Não falha a criação se o incremento falhar, mas loga o erro
    }

    return NextResponse.json(
      { success: true, data: newDomain },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/domains/create:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}
