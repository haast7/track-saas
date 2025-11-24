import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Cria resposta mutável
  let res = NextResponse.next({
    request: { headers: req.headers }
  })

  // Cria supabase server client (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Atualizar tanto na resposta quanto na requisição
          req.cookies.set(name, value)
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          req.cookies.delete(name)
          res.cookies.delete({ name, ...options })
        }
      }
    }
  )

  // IMPORTANTE: getSession() atualiza os cookies automaticamente
  // Isso garante que a sessão seja refrescada se necessário
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  const isAuthPage = pathname.startsWith('/auth')
  const isDashboardPage = pathname.startsWith('/dashboard')

  // Se NÃO logado e tentando acessar /dashboard → manda para login
  if (!session && isDashboardPage) {
    const redirectUrl = new URL('/auth/login', req.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Preservar TODOS os cookies atualizados na resposta de redirect
    res.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        ...(cookie.domain && { domain: cookie.domain }),
        ...(cookie.maxAge && { maxAge: cookie.maxAge }),
        ...(cookie.sameSite && { sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' }),
        ...(cookie.secure && { secure: true }),
        ...(cookie.httpOnly && { httpOnly: true }),
      })
    })
    return redirectResponse
  }

  // Se JÁ logado e está no /auth → mandar para /dashboard
  if (session && isAuthPage) {
    const redirectUrl = new URL('/dashboard', req.url)
    // Criar redirect e copiar TODOS os cookies atualizados
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Copiar todos os cookies da resposta atualizada (res) para o redirect
    res.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        ...(cookie.domain && { domain: cookie.domain }),
        ...(cookie.maxAge && { maxAge: cookie.maxAge }),
        ...(cookie.sameSite && { sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' }),
        ...(cookie.secure && { secure: true }),
        ...(cookie.httpOnly && { httpOnly: true }),
      })
    })
    
    // Também copiar cookies da requisição original (caso não tenham sido atualizados)
    req.cookies.getAll().forEach((cookie) => {
      if (!redirectResponse.cookies.get(cookie.name)) {
        redirectResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path || '/',
        })
      }
    })
    
    return redirectResponse
  }

  // Retornar a resposta com os cookies atualizados
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}


