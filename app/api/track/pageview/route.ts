import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canTrackPageview, incrementPageviewsCount } from '@/lib/billing'
import { sendFacebookConversionEvent } from '@/lib/facebook-conversion-api'
import { executePostbacks } from '@/lib/postbacks'

/**
 * Cria cliente Supabase com service role key para operações de tracking
 * Necessário porque tracking é público (sem autenticação de usuário)
 */
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL ou Service Role Key não configurados')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()
    const body = await request.json()
    const { funnel_id, session_id, url, ip, userAgent } = body

    // Validação dos campos obrigatórios
    if (!funnel_id || !url) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'funnel_id e url são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar se o funil existe e está ativo
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, user_id, is_active, pixel_id')
      .eq('id', funnel_id)
      .single()

    if (funnelError || !funnel) {
      return NextResponse.json(
        {
          error: 'funnel_not_found',
          message: 'Funil não encontrado',
        },
        { status: 404 }
      )
    }

    if (!funnel.is_active) {
      return NextResponse.json(
        {
          error: 'funnel_inactive',
          message: 'Este funil está inativo',
        },
        { status: 400 }
      )
    }

    // Validar plano e limites antes de criar pageview
    const billingCheck = await canTrackPageview(funnel.user_id)

    if (!billingCheck.allowed) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: billingCheck.reason || 'Limite de pageviews atingido.',
        },
        { status: 403 }
      )
    }

    // Criar ou buscar sessão
    let finalSessionId = session_id
    if (session_id) {
      // Verificar se sessão existe
      const { data: existingSession } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', session_id)
        .single()

      if (!existingSession) {
        // Criar nova sessão
        const { data: newSession } = await supabase
          .from('sessions')
          .insert({
            id: session_id,
            funnel_id,
            fingerprint: null,
            ip_address: ip || null,
            user_agent: userAgent || null,
          })
          .select('id')
          .single()

        if (newSession) {
          finalSessionId = newSession.id
        }
      }
    }

    // Criar o pageview
    const { data: pageview, error: insertError } = await supabase
      .from('pageviews')
      .insert({
        funnel_id,
        session_id: finalSessionId || null,
        url: url.trim(),
        ip_address: ip || null,
        user_agent: userAgent || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating pageview:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar pageview',
        },
        { status: 500 }
      )
    }

    // Incrementar contador de uso (em background, não bloqueia resposta)
    incrementPageviewsCount(funnel.user_id).catch((usageError) => {
      console.error('Error incrementing usage:', usageError)
    })

    // Enviar evento para CAPI (em background)
    if (funnel.pixel_id) {
      const { data: pixel } = await supabase
        .from('pixels')
        .select('pixel_id, token')
        .eq('id', funnel.pixel_id)
        .single()

      if (pixel && pixel.pixel_id && pixel.token) {
        sendFacebookConversionEvent('PageView', {
          pixelId: pixel.pixel_id,
          accessToken: pixel.token,
          eventId: pageview.id,
          eventSourceUrl: url,
          actionSource: 'website',
          userData: {
            ...(ip && { client_ip_address: ip }),
            ...(userAgent && { client_user_agent: userAgent }),
            ...(finalSessionId && { external_id: [finalSessionId] }),
          },
        }).catch((capiError) => {
          console.error('Error sending CAPI event:', capiError)
        })
      }
    }

    // Executar postbacks (em background) - CORRIGIDO: passar userId para segurança
    executePostbacks('ViewPage', {
      funnel_id,
      session_id: finalSessionId,
      url,
      pageview_id: pageview.id,
    }, funnel.user_id).catch((postbackError) => {
      console.error('Error executing postbacks:', postbackError)
    })

    return NextResponse.json(
      { success: true, data: pageview },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/track/pageview:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}

