import { createServerSupabaseClient } from './supabase/server'
import { redirect } from 'next/navigation'

/**
 * Verifica se o usuário está autenticado no servidor
 * Redireciona para /login se não estiver autenticado
 * Retorna o usuário se estiver autenticado
 */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return { user, supabase }
}

/**
 * Obtém o usuário atual sem redirecionar
 * Retorna null se não estiver autenticado
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

