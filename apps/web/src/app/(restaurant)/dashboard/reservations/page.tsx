import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function RestaurantReservationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user!.id)
    .single()

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: reservations } = await supabase
    .from('reservations')
    .select('*, user:profiles(full_name, phone, email)')
    .eq('restaurant_id', restaurant?.id)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .limit(100)

  const grouped = (reservations ?? []).reduce<Record<string, typeof reservations>>((acc, r) => {
    if (!acc[r!.date]) acc[r!.date] = []
    acc[r!.date]!.push(r)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Próximas reservas</h1>

      {Object.keys(grouped).length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-medium">No hay reservas próximas</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayReservations]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {format(new Date(date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              <span className="ml-2 text-primary-500">
                ({dayReservations!.length} reservas)
              </span>
            </h2>
            <div className="card divide-y divide-gray-50">
              {dayReservations!.map((r) => (
                <div key={r!.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-primary-50 rounded-xl px-3 py-2 min-w-[60px]">
                      <p className="text-lg font-bold text-primary-600">
                        {String(r!.time).slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {r!.user?.full_name ?? 'Sin nombre'} — {r!.party_size} personas
                      </p>
                      <p className="text-sm text-gray-500">
                        {r!.user?.phone ?? r!.user?.email ?? ''}
                      </p>
                      {r!.notes && (
                        <p className="text-sm text-gray-400 italic mt-0.5">
                          &ldquo;{r!.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      r!.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {r!.status === 'confirmed' ? 'Confirmada' : r!.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
