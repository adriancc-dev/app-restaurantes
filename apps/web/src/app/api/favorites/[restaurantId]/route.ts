import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { restaurantId: string } }
): Promise<NextResponse> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { restaurantId } = params

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle()

  if (existing) {
    await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('restaurant_id', restaurantId)
    return NextResponse.json({ favorited: false })
  }

  await supabase.from('user_favorites').insert({ user_id: user.id, restaurant_id: restaurantId })
  return NextResponse.json({ favorited: true })
}
