import { createServerSupabaseClient } from './supabase/server'

/**
 * Tipos para o sistema de billing
 */
export interface Plan {
  id: string
  name: string
  price: number
  limits: {
    funnels: number | null
    pixels: number | null
    pageviews: number | null
  }
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'expired' | 'incomplete'
  current_period_start: string
  current_period_end: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface Usage {
  id: string
  user_id: string
  funnels_count: number
  pixels_count: number
  pageviews_count: number
  domains_count: number
  updated_at: string
}

export interface BillingCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * Busca a assinatura ativa do usuário
 */
export async function getUserSubscription(
  userId: string
): Promise<Subscription | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return null
  }

  return data as Subscription
}

/**
 * Busca qualquer subscription do usuário (não apenas ativa)
 */
export async function getUserSubscriptionAny(
  userId: string
): Promise<Subscription | null> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data as Subscription
}

/**
 * Verifica se o usuário está bloqueado (sem plano ativo ou com plano expirado/cancelado)
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  const subscription = await getUserSubscriptionAny(userId)

  // Se não tem subscription, está bloqueado
  if (!subscription) {
    return true
  }

  // Se status é expired ou canceled, está bloqueado
  if (subscription.status === 'expired' || subscription.status === 'canceled') {
    return true
  }

  // Se status é incomplete, também está bloqueado
  if (subscription.status === 'incomplete') {
    return true
  }

  // Se status é active, não está bloqueado
  return false
}

/**
 * Busca o plano do usuário através da assinatura ativa
 * Retorna null se o usuário não tiver assinatura ativa
 */
export async function getUserPlan(userId: string): Promise<Plan | null> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return null
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', subscription.plan_id)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    limits: data.limits as Plan['limits'],
  } as Plan
}

/**
 * Busca o uso atual do usuário
 * Se não existir registro, cria um com valores zerados
 */
export async function getUsage(userId: string): Promise<Usage> {
  const supabase = await createServerSupabaseClient()

  // Tentar buscar uso existente
  const { data: existingUsage, error: fetchError } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingUsage && !fetchError) {
    return existingUsage as Usage
  }

  // Se não existir, criar registro com valores zerados
  const { data: newUsage, error: insertError } = await supabase
    .from('usage')
    .insert({
      user_id: userId,
      funnels_count: 0,
      pixels_count: 0,
      pageviews_count: 0,
      domains_count: 0,
    })
    .select()
    .single()

  if (insertError || !newUsage) {
    // Se falhar ao criar, retornar objeto padrão
    return {
      id: '',
      user_id: userId,
      funnels_count: 0,
      pixels_count: 0,
      pageviews_count: 0,
      domains_count: 0,
      updated_at: new Date().toISOString(),
    }
  }

  return newUsage as Usage
}

/**
 * Verifica se o usuário pode criar um novo funil
 */
export async function canCreateFunnel(
  userId: string
): Promise<BillingCheckResult> {
  const plan = await getUserPlan(userId)
  const usage = await getUsage(userId)

  // Se não tiver plano ativo, não permite
  if (!plan) {
    return {
      allowed: false,
      reason: 'Você precisa de uma assinatura ativa para criar funis',
    }
  }

  const limit = plan.limits.funnels

  // Se o limite for null, significa ilimitado
  if (limit === null) {
    return { allowed: true }
  }

  // Verificar se já atingiu o limite
  if (usage.funnels_count >= limit) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limit} funil(is) do plano ${plan.name}. Faça upgrade para criar mais funis.`,
    }
  }

  return { allowed: true }
}

/**
 * Verifica se o usuário pode criar um novo pixel
 */
export async function canCreatePixel(
  userId: string
): Promise<BillingCheckResult> {
  const plan = await getUserPlan(userId)
  const usage = await getUsage(userId)

  // Se não tiver plano ativo, não permite
  if (!plan) {
    return {
      allowed: false,
      reason: 'Você precisa de uma assinatura ativa para criar pixels',
    }
  }

  const limit = plan.limits.pixels

  // Se o limite for null, significa ilimitado
  if (limit === null) {
    return { allowed: true }
  }

  // Verificar se já atingiu o limite
  if (usage.pixels_count >= limit) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limit} pixel(is) do plano ${plan.name}. Faça upgrade para criar mais pixels.`,
    }
  }

  return { allowed: true }
}

/**
 * Verifica se o usuário pode rastrear pageviews
 * Para pageviews, geralmente é ilimitado, mas verificamos mesmo assim
 */
export async function canTrackPageview(
  userId: string
): Promise<BillingCheckResult> {
  const plan = await getUserPlan(userId)

  // Se não tiver plano ativo, não permite
  if (!plan) {
    return {
      allowed: false,
      reason: 'Você precisa de uma assinatura ativa para rastrear pageviews',
    }
  }

  const limit = plan.limits.pageviews

  // Se o limite for null, significa ilimitado (padrão para todos os planos)
  if (limit === null) {
    return { allowed: true }
  }

  // Se houver limite, verificar uso atual
  const usage = await getUsage(userId)

  if (usage.pageviews_count >= limit) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limit} pageview(s) do plano ${plan.name}. Faça upgrade para rastrear mais pageviews.`,
    }
  }

  return { allowed: true }
}

/**
 * Incrementa o contador de funis no usage
 */
export async function incrementFunnelsCount(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  // Buscar uso atual
  const usage = await getUsage(userId)
  
  // Incrementar contador
  const { error } = await supabase
    .from('usage')
    .update({ 
      funnels_count: usage.funnels_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error incrementing funnels count:', error)
    throw error
  }
}

/**
 * Incrementa o contador de pixels no usage
 */
export async function incrementPixelsCount(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  // Buscar uso atual
  const usage = await getUsage(userId)
  
  // Incrementar contador
  const { error } = await supabase
    .from('usage')
    .update({ 
      pixels_count: usage.pixels_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error incrementing pixels count:', error)
    throw error
  }
}

/**
 * Incrementa o contador de pageviews no usage
 */
export async function incrementPageviewsCount(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  // Buscar uso atual
  const usage = await getUsage(userId)
  
  // Incrementar contador
  const { error } = await supabase
    .from('usage')
    .update({ 
      pageviews_count: usage.pageviews_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error incrementing pageviews count:', error)
    throw error
  }
}

/**
 * Verifica se o usuário pode criar um novo domínio
 */
export async function canCreateDomain(
  userId: string
): Promise<BillingCheckResult> {
  const plan = await getUserPlan(userId)
  const usage = await getUsage(userId)

  // Se não tiver plano ativo, não permite
  if (!plan) {
    return {
      allowed: false,
      reason: 'Você precisa de uma assinatura ativa para criar domínios',
    }
  }

  // Por enquanto, domínios são ilimitados em todos os planos
  // Mas podemos adicionar limites no futuro
  // Se quiser adicionar limites, descomente abaixo:
  /*
  const limit = plan.limits.domains

  if (limit === null) {
    return { allowed: true }
  }

  if (usage.domains_count >= limit) {
    return {
      allowed: false,
      reason: `Você atingiu o limite de ${limit} domínio(s) do plano ${plan.name}. Faça upgrade para criar mais domínios.`,
    }
  }
  */

  return { allowed: true }
}

/**
 * Incrementa o contador de domínios no usage
 */
export async function incrementDomainsCount(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient()
  
  // Buscar uso atual
  const usage = await getUsage(userId)
  
  // Incrementar contador
  const { error } = await supabase
    .from('usage')
    .update({ 
      domains_count: usage.domains_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error incrementing domains count:', error)
    throw error
  }
}