import { Suspense } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan, getUserSubscription, type Subscription } from '@/lib/billing'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Zap, Infinity, Crown, CreditCard } from 'lucide-react'
import { SubscriptionContent } from '@/components/dashboard/subscription-content'

async function SubscriptionPageContent() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Buscar plano atual e subscription
  const currentPlan = await getUserPlan(user.id)
  
  // Buscar subscription (pode não estar ativa)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Buscar todos os planos disponíveis
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .order('price', { ascending: true })

  if (plansError) {
    console.error('Error fetching plans:', plansError)
  }

  return (
    <SubscriptionContent
      currentPlan={currentPlan}
      subscription={subscription as Subscription | null}
      plans={plans || []}
      userId={user.id}
    />
  )
}

export default function SubscriptionPage() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Assinatura
        </h1>
        <p className="text-muted-foreground">
          Gerencie seu plano e faça upgrade para desbloquear mais recursos
        </p>
      </div>

      <Suspense fallback={<SubscriptionLoadingSkeleton />}>
        <SubscriptionPageContent />
      </Suspense>
    </div>
  )
}

function SubscriptionLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 bg-card rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-card rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

