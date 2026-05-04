import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const dietarySchema = z.object({
  vegetarian:       z.boolean(),
  vegan:            z.boolean(),
  glutenFree:       z.boolean(),
  lactoseFree:      z.boolean(),
  nutAllergy:       z.boolean(),
  shellfishAllergy: z.boolean(),
  other:            z.string().max(200),
}).partial()

const notificationSchema = z.object({
  reservation_confirmed: z.boolean(),
  reminder_24h:          z.boolean(),
  reminder_1h:           z.boolean(),
  restaurant_news:       z.boolean(),
}).partial()

const updateProfileSchema = z.object({
  // Campos sensibles — requieren OTP cuando están presentes
  full_name: z.string().min(2).max(100).optional(),
  phone:     z.string().max(30).nullable().optional(),
  // Campos libres — no requieren OTP
  location:                  z.string().max(100).nullable().optional(),
  birthday:                  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  dietary_preferences:       dietarySchema.optional(),
  notification_preferences:  notificationSchema.optional(),
  // Token de verificación (requerido cuando se cambian campos sensibles)
  otp: z.string().length(6).regex(/^\d{6}$/).optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      ?? parsed.error.flatten().formErrors[0]
      ?? 'Datos inválidos'
    return NextResponse.json({ error: firstError }, { status: 422 })
  }

  const { otp, ...fields } = parsed.data
  const hasSensitiveField = 'full_name' in fields || 'phone' in fields

  // Verificar OTP cuando se modifican datos sensibles
  if (hasSensitiveField) {
    if (!otp) {
      return NextResponse.json({ error: 'Se requiere código de verificación para cambiar nombre o teléfono.' }, { status: 422 })
    }

    const { data: token } = await supabase
      .from('profile_change_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('code', otp)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (!token) {
      return NextResponse.json({ error: 'Código incorrecto o caducado. Solicita uno nuevo.' }, { status: 401 })
    }

    // Invalidar el token
    await supabase.from('profile_change_tokens').delete().eq('id', token.id)
  }

  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
