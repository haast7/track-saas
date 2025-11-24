import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canCreatePixel, incrementPixelsCount } from '@/lib/billing'

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
    const { name, pixel_id, token, platform } = body

    // Validação dos campos obrigatórios
    if (!name || !pixel_id || !token) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nome, Pixel ID e Token são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar plano e limites antes de criar
    const billingCheck = await canCreatePixel(user.id)

    if (!billingCheck.allowed) {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: billingCheck.reason || 'Seu plano atual não permite criar mais pixels.',
        },
        { status: 403 }
      )
    }

    // Criar o pixel
    const { data: pixel, error: insertError } = await supabase
      .from('pixels')
      .insert({
        name: name.trim(),
        pixel_id: pixel_id.trim(),
        token: token.trim(),
        user_id: user.id,
        platform: platform || 'facebook',
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating pixel:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar pixel',
        },
        { status: 500 }
      )
    }

    // Incrementar contador de uso
    try {
      await incrementPixelsCount(user.id)
    } catch (usageError) {
      console.error('Error incrementing usage:', usageError)
      // Não falha a criação se o incremento falhar, mas loga o erro
    }

    return NextResponse.json(
      { success: true, data: pixel },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/pixels/create:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}



