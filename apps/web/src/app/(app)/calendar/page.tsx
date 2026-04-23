'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Restaurant } from '@repo/shared'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function CalendarPage() {
  const supabase = createClient()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableRestaurants, setAvailableRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [daysWithAvailability, setDaysWithAvailability] = useState<Set<string>>(new Set())

  const today = startOfDay(new Date())
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Día de inicio del mes (lunes=0)
  const firstDayOffset = (getDay(monthStart) + 6) % 7

  useEffect(() => {
    loadMonthAvailability()
  }, [currentMonth])

  async function loadMonthAvailability() {
    const monthStr = format(currentMonth, 'yyyy-MM')

    const { data: reservations } = await supabase
      .from('reservations')
      .select('date, restaurant_id')
      .like('date', `${monthStr}%`)
      .neq('status', 'cancelled')

    if (reservations) {
      const days = new Set(reservations.map((r) => r.date))
      setDaysWithAvailability(days)
    }
  }

  async function loadRestaurantsForDate(date: Date) {
    setLoadingRestaurants(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayOfWeek = (getDay(date) + 6) % 7 // lunes=0

    // Restaurantes que abren ese día de la semana
    const { data: openHours } = await supabase
      .from('restaurant_hours')
      .select('restaurant_id, max_capacity, slot_duration, open_time, close_time')
      .eq('day_of_week', getDay(date))
      .eq('is_open', true)

    if (!openHours || openHours.length === 0) {
      setAvailableRestaurants([])
      setLoadingRestaurants(false)
      return
    }

    const restaurantIds = openHours.map((h) => h.restaurant_id)

    // Contar reservas existentes
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('restaurant_id, time')
      .eq('date', dateStr)
      .in('restaurant_id', restaurantIds)
      .neq('status', 'cancelled')

    const reservationCounts: Record<string, number> = {}
    for (const r of existingReservations ?? []) {
      reservationCounts[r.restaurant_id] = (reservationCounts[r.restaurant_id] ?? 0) + 1
    }

    // Restaurantes con algún slot disponible
    const availableIds = openHours
      .filter((h) => {
        const totalSlots = Math.floor(
          (timeToMinutes(h.close_time) - timeToMinutes(h.open_time)) / h.slot_duration
        )
        const totalCapacity = totalSlots * h.max_capacity
        return (reservationCounts[h.restaurant_id] ?? 0) < totalCapacity
      })
      .map((h) => h.restaurant_id)

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('*, location:locations(*)')
      .in('id', availableIds)
      .eq('is_active', true)

    setAvailableRestaurants(restaurants ?? [])
    setLoadingRestaurants(false)
  }

  function handleDayClick(day: Date) {
    if (isBefore(day, today)) return
    setSelectedDate(day)
    loadRestaurantsForDate(day)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Disponibilidad</h1>
        <p className="text-gray-500 mt-1">
          Selecciona un día para ver qué restaurantes tienen mesa disponible
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Calendario */}
        <div className="card p-6">
          {/* Navegación mes */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              →
            </button>
          </div>

          {/* Cabecera días */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Días */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos inicio */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((day) => {
              const isPast = isBefore(day, today)
              const isSelected =
                selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
              const hasBookings = daysWithAvailability.has(format(day, 'yyyy-MM-dd'))

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  disabled={isPast}
                  className={`
                    relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-50'}
                    ${isSelected ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-primary-500 text-primary-600' : ''}
                  `}
                >
                  {format(day, 'd')}
                  {hasBookings && !isPast && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Panel de restaurantes */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-gray-700">
                Restaurantes disponibles el{' '}
                <span className="text-primary-600">
                  {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </span>
              </h3>

              {loadingRestaurants ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : availableRestaurants.length > 0 ? (
                <div className="space-y-3">
                  {availableRestaurants.map((r) => (
                    <Link
                      key={r.id}
                      href={`/restaurants/${r.id}?date=${format(selectedDate, 'yyyy-MM-dd')}`}
                      className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{r.name}</p>
                        <p className="text-sm text-gray-500">📍 {r.location?.name}</p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          ✓ Disponible
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-gray-400">
                  <p className="text-3xl mb-2">😔</p>
                  <p className="font-medium">Sin disponibilidad este día</p>
                  <p className="text-sm mt-1">Prueba con otra fecha</p>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-medium">Selecciona una fecha</p>
              <p className="text-sm mt-1">Verás los restaurantes disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function timeToMinutes(time: string | null): number {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
