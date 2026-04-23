import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const subscription = event.data.object as Stripe.Subscription
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const status =
      subscription.status === 'active'
        ? 'active'
        : subscription.status === 'past_due'
        ? 'past_due'
        : 'inactive'

    await supabase
      .from('restaurants')
      .update({
        subscription_status: status,
        is_active: status === 'active',
        stripe_subscription_id: subscription.id,
      })
      .eq('stripe_customer_id', customerId)
  }

  if (event.type === 'customer.subscription.deleted') {
    await supabase
      .from('restaurants')
      .update({
        subscription_status: 'canceled',
        is_active: false,
        stripe_subscription_id: null,
      })
      .eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
