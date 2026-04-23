import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user!.id)
    .single()

  const today = format(new Date(), 'yyyy-MM-dd')

  let todayCount = 0
  let totalCount = 0

  if (restaurant) {
    const { count: tc } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('date', today)
      .neq('status', 'cancelled')

    const { count: ac } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .neq('status', 'cancelled')

    todayCount = tc ?? 0
    totalCount = ac ?? 0
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {restaurant?.name ?? 'Mi Restaurante'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${
                restaurant?.subscription_status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  restaurant?.subscription_status === 'active'
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              {restaurant?.subscription_status === 'active'
                ? 'Suscripción activa'
                : 'Suscripción inactiva'}
            </span>
          </div>
        </div>

        {restaurant?.subscription_status !== 'active' && (
          <Link href="/dashboard/subscription" className="btn-primary">
            Activar suscripción →
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon="📅"
          label="Reservas hoy"
          value={String(todayCount)}
          color="bg-blue-50"
        />
        <StatCard
          icon="📊"
          label="Total reservas"
          value={String(totalCount)}
          color="bg-green-50"
        />
        <StatCard
          icon="💳"
          label="Suscripción"
          value={restaurant?.subscription_status === 'active' ? 'Activa' : 'Inactiva'}
          color="bg-orange-50"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            href: '/dashboard/edit',
            icon: '✏️',
            title: 'Editar perfil',
            desc: 'Nombre, descripción, menú',
          },
          {
            href: '/dashboard/hours',
            icon: '🕐',
            title: 'Horarios',
            desc: 'Gestiona tus franjas de reserva',
          },
          {
            href: '/dashboard/reservations',
            icon: '📋',
            title: 'Reservas',
            desc: 'Ver todas las reservas',
          },
          {
            href: '/dashboard/subscription',
            icon: '💳',
            title: 'Suscripción',
            desc: 'Gestionar pago mensual',
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card p-5 hover:shadow-md transition-shadow group"
          >
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}) {
  return (
    <div className={`card p-5 ${color}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
