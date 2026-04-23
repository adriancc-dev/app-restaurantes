import { NextRequest, NextResponse } from 'next/server'
import { stripe, SUBSCRIPTION_PRICE_ID } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, stripe_customer_id, name, email')
    .eq('owner_id', user.id)
    .single()

  if (!restaurant) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  let customerId = restaurant.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: restaurant.email ?? user.email,
      name: restaurant.name,
      metadata: { restaurantId: restaurant.id },
    })
    customerId = customer.id

    await supabase
      .from('restaurants')
      .update({ stripe_customer_id: customerId })
      .eq('id', restaurant.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: SUBSCRIPTION_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/dashboard/subscription`,
  })

  return NextResponse.redirect(session.url!, 303)
}
