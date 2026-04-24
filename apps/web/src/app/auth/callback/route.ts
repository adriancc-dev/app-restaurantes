import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    // Capturar las cookies que Supabase quiere establecer para ponerlas en la respuesta
    const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
            pendingCookies.push(...cookiesToSet)
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const fullName = data.user.user_metadata?.full_name as string | undefined
      if (fullName) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName })
          .eq('id', data.user.id)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const redirectUrl = profile?.role === 'restaurant' ? '/dashboard' : '/home'
      const response = NextResponse.redirect(new URL(redirectUrl, origin))

      // Escribir las cookies de sesión en la respuesta de redirección
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })

      return response
    }
  }

  return NextResponse.redirect(new URL('/?error=auth_error', origin))
}
