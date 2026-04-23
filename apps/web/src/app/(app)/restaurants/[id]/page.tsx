import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import BookingForm from '@/components/BookingForm'
import { generateTimeSlots } from '@repo/shared'

interface Props {
  params: { id: string }
  searchParams: { date?: string }
}

export default async function RestaurantDetailPage({ params, searchParams }: Props) {
  const supabase = createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*, location:locations(*)')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!restaurant) notFound()

  const selectedDate = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')
  const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay()

  const { data: hours } = await supabase
    .from('restaurant_hours')
    .select('*')
    .eq('restaurant_id', params.id)
    .eq('day_of_week', dayOfWeek)
    .single()

  // Obtener reservas existentes para ese día
  const { data: existingReservations } = await supabase
    .from('reservations')
    .select('time')
    .eq('restaurant_id', params.id)
    .eq('date', selectedDate)
    .neq('status', 'cancelled')

  const countsByTime: Record<string, number> = {}
  for (const r of existingReservations ?? []) {
    const t = String(r.time).slice(0, 5)
    countsByTime[t] = (countsByTime[t] ?? 0) + 1
  }

  const slots = hours ? generateTimeSlots(hours, countsByTime) : []

  // Fechas seleccionables (próximos 30 días)
  const availableDates = Array.from({ length: 30 }, (_, i) =>
    format(addDays(new Date(), i), 'yyyy-MM-dd')
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header del restaurante */}
      <div className="card overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-6xl">
            🍽️
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-gray-500 mt-1">
                📍 {restaurant.location?.name}
                {restaurant.address && ` — ${restaurant.address}`}
              </p>
            </div>
            <div className="flex gap-3">
              {restaurant.menu_url && (
                <a
                  href={restaurant.menu_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-sm"
                >
                  📋 Ver carta
                </a>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="btn-secondary text-sm">
                  📞 Llamar
                </a>
              )}
            </div>
          </div>
          {restaurant.description && (
            <p className="mt-4 text-gray-600">{restaurant.description}</p>
          )}
        </div>
      </div>

      {/* Formulario de reserva */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Hacer una reserva</h2>
        <BookingForm
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          selectedDate={selectedDate}
          availableDates={availableDates}
          slots={slots}
          userId={user.id}
          userEmail={user.email ?? ''}
        />
      </div>
    </div>
  )
}
