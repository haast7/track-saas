import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/billing'

export async function GET(request: NextRequest) {
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

    // Buscar subscription do usuário
    const subscription = await getUserSubscription(user.id)

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        {
          error: 'no_subscription',
          message: 'Você não possui uma assinatura ativa',
        },
        { status: 404 }
      )
    }

    // Criar sessão do portal do Stripe
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/assinatura`,
    })

    return NextResponse.json(
      {
        success: true,
        url: portalSession.url,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/stripe/portal:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error.message || 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}



