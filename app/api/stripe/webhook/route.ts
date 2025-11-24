import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

/**
 * Cria cliente Supabase com service role key para webhooks
 * Necessário para atualizar dados de outros usuários
 */
function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL ou Service Role Key não configurados')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Webhook do Stripe para tratar eventos de assinatura
 * 
 * Eventos tratados:
 * - checkout.session.completed: Quando o checkout é concluído
 * - customer.subscription.created: Quando uma assinatura é criada
 * - customer.subscription.updated: Quando uma assinatura é atualizada
 * - customer.subscription.deleted: Quando uma assinatura é cancelada/expirada
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Validar assinatura do webhook
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não está configurada')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = createSupabaseAdminClient()

  try {
    // Tratar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Buscar userId e planId do metadata
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (!userId || !planId) {
          console.error('Missing userId or planId in checkout session metadata')
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          )
        }

        // Buscar subscription do Stripe
        const subscriptionId = session.subscription as string

        if (!subscriptionId) {
          console.error('Missing subscription ID in checkout session')
          return NextResponse.json(
            { error: 'Missing subscription ID' },
            { status: 400 }
          )
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Atualizar ou criar subscription no banco
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('id, current_period_start')
          .eq('user_id', userId)
          .single()

        const newPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
        const isRenewal = existingSubscription && 
          existingSubscription.current_period_start &&
          newPeriodStart !== existingSubscription.current_period_start &&
          new Date(newPeriodStart) > new Date(existingSubscription.current_period_start)

        const subscriptionData = {
          user_id: userId,
          plan_id: planId,
          status: 'active' as const,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscriptionId,
          current_period_start: newPeriodStart,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }

        if (existingSubscription) {
          // Atualizar subscription existente
          await supabase
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscription.id)

          // Se for renovação, zerar usage
          if (isRenewal) {
            await supabase
              .from('usage')
              .update({
                funnels_count: 0,
                pixels_count: 0,
                pageviews_count: 0,
                domains_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
          }
        } else {
          // Criar nova subscription
          await supabase.from('subscriptions').insert(subscriptionData)
        }

        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription

        // Buscar subscription no banco pelo stripe_subscription_id
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSubscription) {
          // Atualizar subscription existente
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              stripe_customer_id: subscription.customer as string,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', existingSubscription.id)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        // Determinar status baseado no status do Stripe
        let status: 'active' | 'canceled' | 'expired' | 'incomplete' = 'active'

        if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
          status = 'canceled'
        } else if (subscription.status === 'unpaid' || subscription.status === 'past_due') {
          status = 'expired'
        } else if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          status = 'incomplete'
        } else if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'active'
        }

        // Buscar subscription no banco pelo stripe_subscription_id
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSubscription) {
          const newPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
          const oldPeriodStart = existingSubscription.current_period_start

          // Verificar se é uma renovação (novo período iniciou)
          const isRenewal = status === 'active' && 
            newPeriodStart !== oldPeriodStart &&
            new Date(newPeriodStart) > new Date(oldPeriodStart)

          // Atualizar subscription
          await supabase
            .from('subscriptions')
            .update({
              status,
              stripe_customer_id: subscription.customer as string,
              current_period_start: newPeriodStart,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', existingSubscription.id)

          // Se for renovação, zerar usage
          if (isRenewal) {
            await supabase
              .from('usage')
              .update({
                funnels_count: 0,
                pixels_count: 0,
                pageviews_count: 0,
                domains_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', existingSubscription.user_id)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Buscar subscription no banco pelo stripe_subscription_id
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSubscription) {
          // Verificar se foi cancelada ou expirada
          // Se cancel_at_period_end era true, significa que foi cancelada
          // Caso contrário, pode ter expirado
          const now = new Date()
          const periodEnd = new Date(subscription.current_period_end * 1000)
          
          let status: 'canceled' | 'expired' = 'canceled'
          
          // Se o período já passou, consideramos como expirado
          if (periodEnd < now) {
            status = 'expired'
          }

          // Atualizar subscription
          await supabase
            .from('subscriptions')
            .update({
              status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('id', existingSubscription.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    )
  }
}

