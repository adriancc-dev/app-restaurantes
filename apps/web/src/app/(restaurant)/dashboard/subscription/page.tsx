import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function SubscriptionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('subscription_status, stripe_subscription_id, name')
    .eq('owner_id', user!.id)
    .single()

  const isActive = restaurant?.subscription_status === 'active'

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={`font-semibold ${isActive ? 'text-green-700' : 'text-red-700'}`}>
            {isActive ? 'Suscripción activa' : 'Suscripción inactiva'}
          </span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">100€ <span className="text-base font-normal text-gray-500">/ mes</span></p>
          <p className="text-sm text-gray-500 mt-1">
            Incluye perfil de restaurante visible, gestión de reservas ilimitadas y notificaciones automáticas.
          </p>
        </div>

        {isActive ? (
          <form action="/api/stripe/portal" method="POST">
            <button type="submit" className="btn-secondary w-full">
              Gestionar suscripción →
            </button>
          </form>
        ) : (
          <form action="/api/stripe/checkout" method="POST">
            <input type="hidden" name="restaurantId" value={restaurant?.name ?? ''} />
            <button type="submit" className="btn-primary w-full text-base py-3">
              💳 Activar suscripción — 100€/mes
            </button>
          </form>
        )}

        {!isActive && (
          <p className="text-xs text-gray-400 text-center">
            Tu restaurante solo aparece visible para los usuarios cuando la suscripción está activa.
          </p>
        )}
      </div>
    </div>
  )
}
