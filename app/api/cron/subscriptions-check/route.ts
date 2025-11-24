import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cria cliente Supabase com service role key para operações administrativas
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
 * Mock de envio de e-mail
 * Em produção, substitua por serviço real (SendGrid, Resend, etc.)
 */
async function sendExpirationEmail(userEmail: string, planName: string) {
  // Mock - em produção, usar serviço de e-mail real
  console.log(`[MOCK EMAIL] Enviando e-mail para ${userEmail}`)
  console.log(`Assunto: Sua assinatura do plano ${planName} expirou`)
  console.log(`Corpo: Sua assinatura expirou. Faça upgrade para continuar usando o Track SaaS.`)
  
  // Exemplo de implementação real:
  // await resend.emails.send({
  //   from: 'noreply@track-saas.com',
  //   to: userEmail,
  //   subject: `Sua assinatura do plano ${planName} expirou`,
  //   html: `<p>Sua assinatura expirou. Faça upgrade para continuar usando o Track SaaS.</p>`
  // })
  
  return { success: true }
}

/**
 * CRON Job: Verifica e atualiza assinaturas expiradas
 * 
 * Deve ser chamado periodicamente (ex: diariamente às 00:00)
 * Pode ser configurado via:
 * - Vercel Cron Jobs
 * - GitHub Actions
 * - Supabase Edge Functions (cron)
 * - Serviços externos (cron-job.org, etc.)
 * 
 * Proteção: Use header Authorization com token secreto
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do CRON (opcional mas recomendado)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token de autenticação inválido' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseAdminClient()
    const now = new Date().toISOString()

    // 1. Buscar todas as assinaturas com current_period_end < now() e status = 'active'
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('current_period_end', now)

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError)
      return NextResponse.json(
        {
          error: 'fetch_error',
          message: 'Erro ao buscar assinaturas expiradas',
          details: fetchError.message,
        },
        { status: 500 }
      )
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma assinatura expirada encontrada',
        expiredCount: 0,
        updated: [],
      })
    }

    console.log(`[CRON] Encontradas ${expiredSubscriptions.length} assinatura(s) expirada(s)`)

    const updatedSubscriptions = []
    const errors = []

    // 2. Atualizar cada assinatura expirada
    for (const subscription of expiredSubscriptions) {
      try {
        // Atualizar status para expired
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          errors.push({
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            error: updateError.message,
          })
          continue
        }

        // 3. Resetar usage para zero quando expirar
        const { error: usageError } = await supabase
          .from('usage')
          .update({
            funnels_count: 0,
            pixels_count: 0,
            pageviews_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', subscription.user_id)

        if (usageError) {
          console.error(`Error resetting usage for user ${subscription.user_id}:`, usageError)
          // Não falha a atualização da subscription se o reset de usage falhar
        }

        // 4. Buscar nome do plano
        let planName = 'desconhecido'
        try {
          const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', subscription.plan_id)
            .single()
          
          if (plan) {
            planName = plan.name
          }
        } catch (planError) {
          console.error(`Error fetching plan ${subscription.plan_id}:`, planError)
        }

        // 5. Enviar e-mail (mock)
        // Em produção, buscar email do usuário através da API Admin do Supabase
        // Exemplo: const { data: user } = await supabase.auth.admin.getUserById(subscription.user_id)
        await sendExpirationEmail(`user-${subscription.user_id}@example.com`, planName)

        updatedSubscriptions.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          planName,
          expiredAt: subscription.current_period_end,
        })

        console.log(
          `[CRON] Assinatura ${subscription.id} atualizada para expired (usuário: ${subscription.user_id})`
        )
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        errors.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          error: error.message,
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processadas ${expiredSubscriptions.length} assinatura(s) expirada(s)`,
        expiredCount: expiredSubscriptions.length,
        updated: updatedSubscriptions,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in CRON subscriptions-check:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno ao processar assinaturas expiradas',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Também suporta POST para compatibilidade com alguns serviços de CRON
 */
export async function POST(request: NextRequest) {
  return GET(request)
}

