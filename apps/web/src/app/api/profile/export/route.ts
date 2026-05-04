import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [{ data: profile }, { data: reservations }, { data: favorites }, { data: reviews }] =
    await Promise.all([
      supabase.from('profiles').select('full_name, email, phone, location, birthday, dietary_preferences, created_at').eq('id', user.id).single(),
      supabase.from('reservations').select('date, time, party_size, status, notes, created_at, restaurant:restaurants(name, address)').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('user_favorites').select('created_at, restaurant:restaurants(name, address)').eq('user_id', user.id),
      supabase.from('restaurant_reviews').select('rating, comment, created_at, restaurant:restaurants(name)').eq('user_id', user.id),
    ])

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    reservations: reservations ?? [],
    favorites: favorites ?? [],
    reviews: reviews ?? [],
  }

  const filename = `mis-datos-${format(new Date(), 'yyyy-MM-dd')}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
