import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

export async function updateSession(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request)

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it so that users
  // have to sign in again every time they visit a page.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')
  const isDashboardPage = pathname.startsWith('/dashboard')

  // Debug temporário
  if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware]', {
      pathname, 
      hasUser: !!user, 
      isAuthPage, 
      isDashboardPage,
      cookies: request.cookies.getAll().map(c => c.name)
    })
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    // Criar redirect preservando os cookies do supabaseResponse
    const redirectResponse = NextResponse.redirect(url)
    // Copiar todos os cookies do supabaseResponse (que já foram atualizados pelo Supabase)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
      })
    })
    return redirectResponse
  }

  // Protect dashboard routes - redirect unauthenticated users to login
  if (!user && isDashboardPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Criar redirect preservando os cookies do supabaseResponse
    const redirectResponse = NextResponse.redirect(url)
    // Copiar todos os cookies do supabaseResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
      })
    })
    return redirectResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

