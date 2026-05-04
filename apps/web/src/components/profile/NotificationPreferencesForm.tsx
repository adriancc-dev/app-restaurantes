'use client'

import { useState } from 'react'
import type { NotificationPreferences } from '@repo/shared'

const ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: 'reservation_confirmed', label: 'Confirmación de reserva',  description: 'Email al confirmar una reserva' },
  { key: 'reminder_24h',          label: 'Recordatorio 24 horas',     description: 'El día anterior a tu reserva' },
  { key: 'reminder_1h',           label: 'Recordatorio 1 hora',       description: 'Una hora antes de tu mesa' },
  { key: 'restaurant_news',       label: 'Novedades de restaurantes', description: 'Ofertas de tus favoritos' },
]

export default function NotificationPreferencesForm({ initial }: { initial: Partial<NotificationPreferences> }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    reservation_confirmed: initial.reservation_confirmed ?? true,
    reminder_24h:          initial.reminder_24h          ?? true,
    reminder_1h:           initial.reminder_1h           ?? true,
    restaurant_news:       initial.restaurant_news       ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setSuccess(false)

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_preferences: prefs }),
    })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3500)
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Notificaciones por email</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Elige qué emails quieres recibir</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1">
        {ITEMS.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <div className="mr-4 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
            </div>
            <Toggle
              checked={prefs[item.key]}
              onChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))}
            />
          </div>
        ))}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-lg mt-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Preferencias guardadas
          </div>
        )}

        <div className="pt-4">
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Guardando…' : 'Guardar notificaciones'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      style={{ background: checked ? '#f97316' : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}
