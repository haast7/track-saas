import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/billing'

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
    const { planId } = body

    // Validação dos campos obrigatórios
    if (!planId) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'planId é obrigatório',
        },
        { status: 400 }
      )
    }

    // Buscar plano no banco de dados
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        {
          error: 'plan_not_found',
          message: 'Plano não encontrado',
        },
        { status: 404 }
      )
    }

    // Buscar ou criar customer no Stripe
    let customerId: string

    // Verificar se já existe subscription com stripe_customer_id
    const subscription = await getUserSubscription(user.id)

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      // Buscar email do usuário (já temos o user do início)
      const email = user.email

      if (!email) {
        return NextResponse.json(
          {
            error: 'email_not_found',
            message: 'Email do usuário não encontrado',
          },
          { status: 400 }
        )
      }

      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: user.id,
        },
      })

      customerId = customer.id

      // Atualizar subscription existente ou criar nova com stripe_customer_id
      const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingSubscription) {
        // Atualizar subscription existente
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('id', existingSubscription.id)
      } else {
        // Criar subscription inicial (será atualizada pelo webhook)
        await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan_id: planId,
          status: 'incomplete',
          stripe_customer_id: customerId,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        })
      }
    }

    // Criar checkout session
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${plan.name}`,
              description: `Assinatura do plano ${plan.name}`,
            },
            unit_amount: plan.price, // Já está em centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/assinatura?success=true`,
      cancel_url: `${baseUrl}/dashboard/assinatura?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/stripe/create-session:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: error.message || 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}

