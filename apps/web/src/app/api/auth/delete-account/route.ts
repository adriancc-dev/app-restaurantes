import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch { /* server component */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Si es restaurante, cancelar suscripción Stripe antes de borrar
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('stripe_subscription_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (restaurant?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(restaurant.stripe_subscription_id)
    } catch {
      // No bloqueamos el borrado si Stripe falla — el webhook lo reconciliará
    }
  }

  // Borrar usuario con la clave de servicio (cascade en DB borra todo lo demás)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la cuenta' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
