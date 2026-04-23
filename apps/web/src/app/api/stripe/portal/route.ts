import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('stripe_customer_id')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant?.stripe_customer_id) {
    return NextResponse.redirect(new URL('/dashboard/subscription', req.url))
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: restaurant.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
  })

  return NextResponse.redirect(session.url, 303)
}
