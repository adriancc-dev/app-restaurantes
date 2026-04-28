import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            pendingCookies.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            pendingCookies.push({ name, value: '', options })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const meta = data.user.user_metadata
      const fullName = meta?.full_name as string | undefined
      const phone = meta?.phone as string | undefined

      // Sincronizar metadatos del usuario con la tabla de perfiles
      if (fullName ?? phone) {
        await supabase
          .from('profiles')
          .update({
            ...(fullName ? { full_name: fullName } : {}),
            ...(phone ? { phone } : {}),
          })
          .eq('id', data.user.id)
      }

      // Flujo de recuperación de contraseña → pantalla de nueva contraseña
      if (type === 'recovery') {
        const response = NextResponse.redirect(new URL('/auth/reset-password', origin))
        pendingCookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        return response
      }

      // Flujo de cambio de email → confirmar y redirigir al perfil
      if (type === 'email_change') {
        const response = NextResponse.redirect(new URL('/profile?email_updated=1', origin))
        pendingCookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        return response
      }

      // Login / registro por email — redirigir según rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const redirectUrl = profile?.role === 'restaurant' ? '/dashboard' : '/home'
      const response = NextResponse.redirect(new URL(redirectUrl, origin))
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }
  }

  return NextResponse.redirect(new URL('/?error=auth_error', origin))
}
