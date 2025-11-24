import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * API: Criar postback
 * POST /api/postbacks/create
 *
 * Body: {
 *   name: string,
 *   destination_url: string,
 *   event: 'ViewPage' | 'Clique' | 'Entrada no Canal' | 'Saída do Canal',
 *   method: 'POST' | 'GET' | 'PUT'
 * }
 */
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
    const { name, destination_url, event, method } = body

    // Validação dos campos obrigatórios
    if (!name || !destination_url || !event) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Nome, URL de destino e evento são obrigatórios',
        },
        { status: 400 }
      )
    }

    // Validar evento
    const validEvents = ['ViewPage', 'Clique', 'Entrada no Canal', 'Saída do Canal']
    if (!validEvents.includes(event)) {
      return NextResponse.json(
        {
          error: 'invalid_event',
          message: `Evento inválido. Valores válidos: ${validEvents.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validar método HTTP
    const validMethods = ['POST', 'GET', 'PUT']
    const httpMethod = method || 'POST'
    if (!validMethods.includes(httpMethod)) {
      return NextResponse.json(
        {
          error: 'invalid_method',
          message: `Método inválido. Valores válidos: ${validMethods.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(destination_url)
    } catch (e) {
      return NextResponse.json(
        {
          error: 'invalid_url',
          message: 'URL de destino inválida',
        },
        { status: 400 }
      )
    }

    // Criar o postback
    const { data: postback, error: insertError } = await supabase
      .from('postbacks')
      .insert({
        name: name.trim(),
        destination_url: destination_url.trim(),
        event,
        method: httpMethod,
        user_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating postback:', insertError)
      return NextResponse.json(
        {
          error: 'creation_failed',
          message: insertError.message || 'Erro ao criar postback',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: postback },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/postbacks/create:', error)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Erro interno do servidor',
      },
      { status: 500 }
    )
  }
}
