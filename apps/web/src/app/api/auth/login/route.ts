import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface LoginBody {
  email?: string
  password?: string
}

export async function POST(request: Request) {
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

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
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

  return NextResponse.json({ ok: true })
}
