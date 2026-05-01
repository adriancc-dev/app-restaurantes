import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@15'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  // Verify user identity via their JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401,
      headers: corsHeaders,
    })
  }

  // Cancel Stripe subscription if restaurant owner
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('stripe_subscription_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (restaurant?.stripe_subscription_id) {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeKey) {
      const stripe = new Stripe(stripeKey)
      try {
        await stripe.subscriptions.cancel(restaurant.stripe_subscription_id)
      } catch {
        // Don't block deletion if Stripe fails — webhook will reconcile
      }
    }
  }

  // Delete user with service role (cascades all related data)
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return new Response(JSON.stringify({ error: 'No se pudo eliminar la cuenta' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
})
