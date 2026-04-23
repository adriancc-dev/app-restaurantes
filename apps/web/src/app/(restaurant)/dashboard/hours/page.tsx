'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DAY_NAMES } from '@repo/shared'

const DEFAULT_HOURS = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_open: i >= 1 && i <= 5, // L-V abierto por defecto
  open_time: '13:00',
  close_time: '22:00',
  slot_duration: 60,
  max_capacity: 10,
}))

export default function HoursPage() {
  const supabase = createClient()
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadHours()
  }, [])

  async function loadHours() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!restaurant) return
    setRestaurantId(restaurant.id)

    const { data: existing } = await supabase
      .from('restaurant_hours')
      .select('*')
      .eq('restaurant_id', restaurant.id)

    if (existing && existing.length > 0) {
      const merged = DEFAULT_HOURS.map((def) => {
        const found = existing.find((e) => e.day_of_week === def.day_of_week)
        return found
          ? {
              day_of_week: found.day_of_week,
              is_open: found.is_open,
              open_time: found.open_time ?? '13:00',
              close_time: found.close_time ?? '22:00',
              slot_duration: found.slot_duration,
              max_capacity: found.max_capacity,
            }
          : def
      })
      setHours(merged)
    }
  }

  function updateDay(index: number, field: string, value: unknown) {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: value } : h))
    )
  }

  async function handleSave() {
    if (!restaurantId) return
    setSaving(true)
    setMessage('')

    const upsertData = hours.map((h) => ({
      restaurant_id: restaurantId,
      ...h,
    }))

    const { error } = await supabase
      .from('restaurant_hours')
      .upsert(upsertData, { onConflict: 'restaurant_id,day_of_week' })

    setSaving(false)
    setMessage(error ? 'Error al guardar' : '¡Horarios guardados!')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Horarios de reserva</h1>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          {message}
        </div>
      )}

      <div className="card divide-y divide-gray-100">
        {hours.map((h, i) => (
          <div key={h.day_of_week} className="p-4 grid items-center gap-3 sm:grid-cols-[120px_1fr]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`day-${i}`}
                checked={h.is_open}
                onChange={(e) => updateDay(i, 'is_open', e.target.checked)}
                className="w-4 h-4 accent-primary-500"
              />
              <label
                htmlFor={`day-${i}`}
                className={`font-medium text-sm ${h.is_open ? 'text-gray-900' : 'text-gray-400'}`}
              >
                {DAY_NAMES[h.day_of_week]}
              </label>
            </div>

            {h.is_open ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Apertura</label>
                  <input
                    type="time"
                    className="input text-sm py-2"
                    value={h.open_time}
                    onChange={(e) => updateDay(i, 'open_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Cierre</label>
                  <input
                    type="time"
                    className="input text-sm py-2"
                    value={h.close_time}
                    onChange={(e) => updateDay(i, 'close_time', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Slot (min)</label>
                  <select
                    className="input text-sm py-2"
                    value={h.slot_duration}
                    onChange={(e) => updateDay(i, 'slot_duration', Number(e.target.value))}
                  >
                    {[30, 45, 60, 90, 120].map((d) => (
                      <option key={d} value={d}>{d} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Capacidad</label>
                  <input
                    type="number"
                    className="input text-sm py-2"
                    min={1}
                    max={100}
                    value={h.max_capacity}
                    onChange={(e) => updateDay(i, 'max_capacity', Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Cerrado</p>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </div>
  )
}
