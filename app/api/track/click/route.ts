import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendFacebookConversionEvent } from '@/lib/facebook-conversion-api'
import { executePostbacks } from '@/lib/postbacks'

/**
 * Cria cliente Supabase com service role key para operações de tracking
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
    const { funnel_id, session_id, button_id, url, ip, userAgent } = body

    // Validação dos campos obrigatórios
    if (!funnel_id || !button_id) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'funnel_id e button_id são obrigatórios',
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

    // Criar o click
    const { data: click, error: insertError } = await supabase
      .from('clicks')
      .insert({
        funnel_id,
        session_id: session_id || null,
        button_id: button_id.trim(),
        url: url ? url.trim() : null,
        ip_address: ip || null,
        user_agent: userAgent || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating click:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar click',
        },
        { status: 500 }
      )
    }

    // Enviar evento para CAPI (em background)
    if (funnel.pixel_id) {
      const { data: pixel } = await supabase
        .from('pixels')
        .select('pixel_id, token')
        .eq('id', funnel.pixel_id)
        .single()

      if (pixel && pixel.pixel_id && pixel.token) {
        sendFacebookConversionEvent('Lead', {
          pixelId: pixel.pixel_id,
          accessToken: pixel.token,
          eventId: click.id,
          eventSourceUrl: url,
          actionSource: 'website',
          userData: {
            ...(ip && { client_ip_address: ip }),
            ...(userAgent && { client_user_agent: userAgent }),
            ...(session_id && { external_id: [session_id] }),
          },
          customData: {
            button_id: button_id,
          },
        }).catch((capiError) => {
          console.error('Error sending CAPI event:', capiError)
        })
      }
    }

    // Executar postbacks (em background) - CORRIGIDO: passar userId para segurança
    executePostbacks('Clique', {
      funnel_id,
      session_id: session_id || null,
      url,
      click_id: click.id,
      button_id,
    }, funnel.user_id).catch((postbackError) => {
      console.error('Error executing postbacks:', postbackError)
    })

    return NextResponse.json(
      { success: true, data: click },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/track/click:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}


