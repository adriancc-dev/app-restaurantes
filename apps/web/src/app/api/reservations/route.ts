import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation } from '@/lib/email'
import { createReservationSchema } from '@repo/shared'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = createReservationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }
  const { restaurantId, date, time, partySize, notes } = parsed.data

  const { data: hours } = await supabase
    .from('restaurant_hours')
    .select('max_capacity')
    .eq('restaurant_id', restaurantId)
    .eq('day_of_week', new Date(date + 'T12:00:00').getDay())
    .single()

  const { count } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurantId)
    .eq('date', date)
    .eq('time', time)
    .neq('status', 'cancelled')

  if ((count ?? 0) >= (hours?.max_capacity ?? 10)) {
    return NextResponse.json({ error: 'Slot completo' }, { status: 409 })
  }

  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      date,
      time,
      party_size: partySize,
      notes,
    })
    .select('*, restaurant:restaurants(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    await sendBookingConfirmation({
      to: user.email!,
      restaurantName: reservation.restaurant.name,
      date,
      time: time.slice(0, 5),
      partySize,
    })
  } catch (err) {
    console.error('Email confirmation failed:', err)
  }

  return NextResponse.json({ reservation })
}
