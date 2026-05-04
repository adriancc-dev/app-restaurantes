import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendProfileChangeOTP } from '@/lib/email'

export async function POST(): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Rate-limit: esperar 60 s entre solicitudes
  const { data: existing } = await supabase
    .from('profile_change_tokens')
    .select('created_at')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (existing) {
    const sinceCreation = Date.now() - new Date(existing.created_at).getTime()
    if (sinceCreation < 60_000) {
      return NextResponse.json(
        { error: 'Espera al menos 1 minuto antes de solicitar un nuevo código.' },
        { status: 429 }
      )
    }
  }

  // Generar código de 6 dígitos
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Intentar enviar el email ANTES de insertar el token
  // así no quedan tokens huérfanos si el email falla
  try {
    await sendProfileChangeOTP({ to: user.email, code })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[OTP] Email failed:', message)
    return NextResponse.json(
      { error: `No se pudo enviar el email de verificación. ${message}` },
      { status: 500 }
    )
  }

  // Email enviado correctamente → guardar el token
  await supabase.from('profile_change_tokens').delete().eq('user_id', user.id)

  const { error: insertErr } = await supabase
    .from('profile_change_tokens')
    .insert({ user_id: user.id, code, expires_at: expiresAt })

  if (insertErr) {
    console.error('[OTP] Token insert failed:', insertErr.message)
    return NextResponse.json({ error: 'Error al guardar el código. Inténtalo de nuevo.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
