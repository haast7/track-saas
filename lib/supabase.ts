/**
 * Re-exporta funções dos arquivos separados
 * Este arquivo serve apenas como ponto central de importação
 */

// Client-side (browser)
export { createClient } from './supabase/client'

// Server-side (não exportar diretamente para evitar importação em client components)
// Use: import { createServerSupabaseClient } from '@/lib/supabase/server'
// Use: import { createMiddlewareClient } from '@/lib/supabase/middleware'

