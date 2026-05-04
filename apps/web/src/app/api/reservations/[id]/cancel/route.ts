import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, user_id, status, date')
    .eq('id', params.id)
    .single()

  if (!reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  if (reservation.user_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (reservation.status !== 'confirmed') {
    return NextResponse.json({ error: 'Esta reserva no se puede cancelar' }, { status: 409 })
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'cancelled' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
