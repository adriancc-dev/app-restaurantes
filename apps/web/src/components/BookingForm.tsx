'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TimeSlot } from '@repo/shared'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  restaurantId: string
  restaurantName: string
  selectedDate: string
  availableDates: string[]
  slots: TimeSlot[]
  userId: string
  userEmail: string
}

export default function BookingForm({
  restaurantId,
  restaurantName,
  selectedDate,
  availableDates,
  slots,
  userId,
  userEmail,
}: Props) {
  const router = useRouter()

  const [date, setDate] = useState(selectedDate)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTime) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        date,
        time: selectedTime,
        partySize,
        notes,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al hacer la reserva')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-900">¡Reserva confirmada!</h3>
        <p className="text-gray-500 mt-2">
          Recibirás un email de confirmación en {userEmail}.
        </p>
        <p className="text-gray-500 mt-1">
          <strong>{restaurantName}</strong> · {format(new Date(date + 'T12:00:00'), "d 'de' MMMM", { locale: es })} · {selectedTime} · {partySize} personas
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="btn-primary mt-6"
        >
          Ver mis reservas
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Selector de fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDates.slice(0, 14).map((d) => {
            const dateObj = new Date(d + 'T12:00:00')
            return (
              <button
                key={d}
                type="button"
                onClick={() => { setDate(d); setSelectedTime(null) }}
                className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all ${
                  date === d
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xs font-medium uppercase">
                  {format(dateObj, 'EEE', { locale: es })}
                </span>
                <span className="text-lg font-bold">{format(dateObj, 'd')}</span>
                <span className="text-xs">{format(dateObj, 'MMM', { locale: es })}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selector de hora */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>
        {slots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedTime === slot.time
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : slot.available
                    ? 'border-gray-200 text-gray-700 hover:border-gray-300'
                    : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                }`}
              >
                {slot.time}
                {slot.available && (
                  <span className="ml-1.5 text-xs text-gray-400">
                    ({slot.remaining} libres)
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Restaurante cerrado este día</p>
        )}
      </div>

      {/* Número de personas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de personas
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPartySize((p) => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
          >
            −
          </button>
          <span className="text-xl font-bold text-gray-900 w-8 text-center">
            {partySize}
          </span>
          <button
            type="button"
            onClick={() => setPartySize((p) => Math.min(20, p + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Alergias, celebración especial..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={!selectedTime || loading}
        className="btn-primary w-full text-base py-3"
      >
        {loading
          ? 'Reservando...'
          : selectedTime
          ? `Confirmar reserva — ${selectedTime}, ${partySize} personas`
          : 'Selecciona una hora'}
      </button>
    </form>
  )
}
