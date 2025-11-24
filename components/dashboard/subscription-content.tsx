'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Zap, Infinity, Crown, CreditCard, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Plan, Subscription } from '@/lib/billing'

interface SubscriptionContentProps {
  currentPlan: Plan | null
  subscription: Subscription | null
  plans: Plan[]
  userId: string
}

export function SubscriptionContent({
  currentPlan,
  subscription,
  plans,
  userId,
}: SubscriptionContentProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    try {
      const response = await fetch('/api/stripe/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar sessão de checkout')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error)
      alert(error.message || 'Erro ao processar assinatura')
      setLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao acessar portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error accessing portal:', error)
      alert(error.message || 'Erro ao acessar portal de assinatura')
      setPortalLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price / 100)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: {
        label: 'Ativa',
        className: 'bg-green-500/20 text-green-400 border-green-500/50',
      },
      canceled: {
        label: 'Cancelada',
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      },
      expired: {
        label: 'Expirada',
        className: 'bg-red-500/20 text-red-400 border-red-500/50',
      },
      incomplete: {
        label: 'Incompleta',
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      },
    }

    const statusInfo = statusMap[status] || statusMap.incomplete

    return (
      <span
        className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold border',
          statusInfo.className
        )}
      >
        {statusInfo.label}
      </span>
    )
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Sparkles className="w-6 h-6" />
      case 'pro':
        return <Zap className="w-6 h-6" />
      case 'premium':
        return <Crown className="w-6 h-6" />
      default:
        return <CreditCard className="w-6 h-6" />
    }
  }

  const getPlanGradient = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
      case 'pro':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
      case 'premium':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-8">
      {/* Card do Plano Atual */}
      {currentPlan && subscription ? (
        <Card
          className={cn(
            'glass border-[#1F1F29] bg-gradient-to-br from-primary/5 via-background to-secondary/5',
            'backdrop-blur-md relative overflow-hidden'
          )}
          style={{
            background: 'rgba(19, 19, 26, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.2)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex items-center gap-2">
                  {getPlanIcon(currentPlan.name)}
                  Plano {currentPlan.name}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Seu plano atual de assinatura
                </CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Próxima Renovação</p>
                <p className="text-lg font-semibold text-foreground">
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Período Atual</p>
                <p className="text-lg font-semibold text-foreground">
                  {format(new Date(subscription.current_period_start), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}{' '}
                  -{' '}
                  {format(new Date(subscription.current_period_end), "dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-lg font-semibold text-foreground">
                  {formatPrice(currentPlan.price)}
                </p>
              </div>
            </div>

            {subscription.status === 'active' && (
              <Button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                variant="outline"
                className="w-full md:w-auto neon-border-secondary"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gerenciar Assinatura
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            'glass border-[#1F1F29] bg-gradient-to-br from-muted/10 via-background to-muted/5',
            'backdrop-blur-md'
          )}
          style={{
            background: 'rgba(19, 19, 26, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(31, 31, 41, 0.8)',
          }}
        >
          <CardHeader>
            <CardTitle className="text-2xl">Nenhum Plano Ativo</CardTitle>
            <CardDescription>
              Escolha um plano abaixo para começar a usar o Track SaaS
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Cards de Upgrade */}
      <div>
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Escolha seu Plano
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id
            const limits = plan.limits as {
              funnels: number | null
              pixels: number | null
              pageviews: number | null
            }

            return (
              <Card
                key={plan.id}
                className={cn(
                  'glass border-[#1F1F29] bg-gradient-to-br backdrop-blur-md relative overflow-hidden transition-all duration-300',
                  isCurrentPlan
                    ? 'border-primary/50 shadow-[0_0_30px_rgba(168,85,247,0.3)] scale-105'
                    : 'hover:border-primary/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:scale-[1.02]',
                  getPlanGradient(plan.name)
                )}
                style={{
                  background: 'rgba(19, 19, 26, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: isCurrentPlan
                    ? '1px solid rgba(168, 85, 247, 0.5)'
                    : '1px solid rgba(31, 31, 41, 0.8)',
                }}
              >
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/50">
                      Plano Atual
                    </span>
                  </div>
                )}

                <CardHeader className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm ml-2">/mês</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Funis:</span>{' '}
                        {limits.funnels === null ? (
                          <span className="text-primary flex items-center gap-1">
                            <Infinity className="w-4 h-4" />
                            Ilimitados
                          </span>
                        ) : (
                          <span>{limits.funnels}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Pixels:</span>{' '}
                        {limits.pixels === null ? (
                          <span className="text-primary flex items-center gap-1">
                            <Infinity className="w-4 h-4" />
                            Ilimitados
                          </span>
                        ) : (
                          <span>{limits.pixels}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Pageviews:</span>{' '}
                        {limits.pageviews === null ? (
                          <span className="text-primary flex items-center gap-1">
                            <Infinity className="w-4 h-4" />
                            Ilimitados
                          </span>
                        ) : (
                          <span>{limits.pageviews.toLocaleString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || loading === plan.id}
                    className={cn(
                      'w-full',
                      isCurrentPlan
                        ? 'opacity-50 cursor-not-allowed'
                        : 'neon-glow-primary hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]'
                    )}
                    variant={isCurrentPlan ? 'outline' : 'default'}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plano Atual'
                    ) : (
                      'Assinar'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

