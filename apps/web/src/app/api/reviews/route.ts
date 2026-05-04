import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reviewSchema = z.object({
  reservation_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: reservation } = await supabase
    .from('reservations')
    .select('status, user_id')
    .eq('id', parsed.data.reservation_id)
    .single()

  if (!reservation || reservation.user_id !== user.id) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }
  if (reservation.status !== 'completed') {
    return NextResponse.json({ error: 'Solo puedes valorar reservas completadas' }, { status: 409 })
  }

  const { error } = await supabase.from('restaurant_reviews').upsert(
    { user_id: user.id, ...parsed.data },
    { onConflict: 'reservation_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
