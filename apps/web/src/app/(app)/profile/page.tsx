import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { Reservation, Restaurant, ReservationStatus } from '@repo/shared'
import DeleteAccountButton from '@/components/DeleteAccountButton'

type ReservationRow = Omit<Reservation, 'restaurant'> & {
  restaurant: Pick<Restaurant, 'name' | 'image_url'> | null
}

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, restaurant:restaurants(name, image_url)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(20)

  const rows = (reservations ?? []) as ReservationRow[]
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = rows.filter((r) => r.status === 'confirmed' && r.date >= today)
  const past = rows.filter((r) => r.status !== 'confirmed' || r.date < today)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Perfil */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {profile?.full_name ?? user.email}
            </h1>
            <p className="text-[#908fa0] text-sm">{user.email}</p>
            {profile?.phone && (
              <p className="text-[#908fa0] text-sm">📞 {profile.phone}</p>
            )}
            {profile?.location && (
              <p className="text-[#908fa0] text-sm">📍 {profile.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* Reservas próximas */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Próximas reservas ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-[#908fa0]">
            <p>No tienes reservas próximas.</p>
            <Link href="/home" className="btn-primary mt-3 inline-block">
              Hacer una reserva
            </Link>
          </div>
        )}
      </div>

      {/* Historial */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Historial</h2>
          <div className="space-y-3">
            {past.map((r) => (
              <ReservationCard key={r.id} reservation={r} />
            ))}
          </div>
        </div>
      )}

      {/* Zona de peligro */}
      <div className="card p-6 border-red-500/20">
        <h2 className="text-base font-semibold text-red-400 mb-1">Zona de peligro</h2>
        <p className="text-sm text-[#908fa0] mb-4">
          Eliminar tu cuenta borra permanentemente todos tus datos y reservas. Esta acción no se puede deshacer.
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  )
}

function ReservationCard({ reservation }: { reservation: ReservationRow }) {
  const statusColor: Record<ReservationStatus, string> = {
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    completed: 'bg-white/5 text-[#908fa0] border-white/10',
    no_show: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }
  const statusLabel: Record<ReservationStatus, string> = {
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
        <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center text-xl">
          🍽️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {reservation.restaurant?.name}
        </p>
        <p className="text-sm text-[#908fa0]">
          {format(new Date(reservation.date + 'T12:00:00'), "d 'de' MMMM yyyy", {
            locale: es,
          })}{' '}
          · {String(reservation.time).slice(0, 5)} · {reservation.party_size} pers.
        </p>
      </div>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor[reservation.status]}`}
      >
        {statusLabel[reservation.status]}
      </span>
    </div>
  )
}
