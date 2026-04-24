import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

interface LoginBody {
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  let body: LoginBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 })
  }

  const email = body.email?.trim()
  const password = body.password

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    const message = error?.message?.toLowerCase().includes('email not confirmed')
      ? 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
      : 'Credenciales incorrectas. Inténtalo de nuevo.'
    return NextResponse.json({ error: message }, { status: 401 })
  }

  if (!data.session) {
    return NextResponse.json({ error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' }, { status: 500 })
  }

  return response
}
