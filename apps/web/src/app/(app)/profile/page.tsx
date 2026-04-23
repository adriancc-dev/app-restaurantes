import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, restaurant:restaurants(name, image_url)')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })
    .limit(20)

  const upcoming = reservations?.filter(
    (r) => r.status === 'confirmed' && r.date >= format(new Date(), 'yyyy-MM-dd')
  )
  const past = reservations?.filter(
    (r) => r.status !== 'confirmed' || r.date < format(new Date(), 'yyyy-MM-dd')
  )

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Perfil */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {profile?.full_name ?? user!.email}
            </h1>
            <p className="text-gray-500 text-sm">{user!.email}</p>
            {profile?.phone && (
              <p className="text-gray-500 text-sm">📞 {profile.phone}</p>
            )}
            {profile?.location && (
              <p className="text-gray-500 text-sm">📍 {profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Reservas próximas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Próximas reservas ({upcoming?.length ?? 0})
        </h2>
        {upcoming && upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-gray-400">
            <p>No tienes reservas próximas.</p>
            <Link href="/home" className="btn-primary mt-3 inline-block">
              Hacer una reserva
            </Link>
          </div>
        )}
      </div>

      {/* Historial */}
      {past && past.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historial</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReservationCard({ reservation }: { reservation: any }) {
  const statusColor: Record<string, string> = {
    confirmed: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
    completed: 'text-gray-600 bg-gray-50',
    no_show: 'text-orange-600 bg-orange-50',
  }
  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    no_show: 'No presentado',
  }

  return (
    <div className="card p-4 flex items-center gap-4">
      {reservation.restaurant?.image_url ? (
        <img
          src={reservation.restaurant.image_url}
          alt={reservation.restaurant.name}
          className="w-14 h-14 rounded-xl object-cover"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">
          {reservation.restaurant?.name}
        </p>
        <p className="text-sm text-gray-500">
          {format(new Date(reservation.date + 'T12:00:00'), "d 'de' MMMM yyyy", {
            locale: es,
          })}{' '}
          · {String(reservation.time).slice(0, 5)} · {reservation.party_size} pers.
        </p>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full ${
          statusColor[reservation.status]
        }`}
      >
        {statusLabel[reservation.status]}
      </span>
    </div>
  )
}
