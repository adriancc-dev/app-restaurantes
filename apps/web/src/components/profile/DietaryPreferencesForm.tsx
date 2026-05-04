'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DietaryPreferences } from '@repo/shared'

const OPTIONS: { key: keyof Omit<DietaryPreferences, 'other'>; label: string; emoji: string }[] = [
  { key: 'vegetarian',      label: 'Vegetariano',          emoji: '🥗' },
  { key: 'vegan',           label: 'Vegano',               emoji: '🌱' },
  { key: 'glutenFree',      label: 'Sin gluten',           emoji: '🌾' },
  { key: 'lactoseFree',     label: 'Sin lactosa',          emoji: '🥛' },
  { key: 'nutAllergy',      label: 'Alergia frutos secos', emoji: '🥜' },
  { key: 'shellfishAllergy',label: 'Alergia marisco',      emoji: '🦐' },
]

export default function DietaryPreferencesForm({ initial }: { initial: Partial<DietaryPreferences> }) {
  const [prefs, setPrefs] = useState<DietaryPreferences>({
    vegetarian:       initial.vegetarian       ?? false,
    vegan:            initial.vegan            ?? false,
    glutenFree:       initial.glutenFree       ?? false,
    lactoseFree:      initial.lactoseFree      ?? false,
    nutAllergy:       initial.nutAllergy       ?? false,
    shellfishAllergy: initial.shellfishAllergy ?? false,
    other:            initial.other            ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  function toggle(key: keyof Omit<DietaryPreferences, 'other'>) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess(false)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietary_preferences: prefs }),
    })

    if (!res.ok) {
      const d: unknown = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Error al guardar.')
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3500)
    }
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-lg flex-shrink-0">
          🍽️
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Preferencias alimentarias</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Se añaden automáticamente a tus reservas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {OPTIONS.map((opt) => {
            const active = prefs[opt.key]
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                  active
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-base">{opt.emoji}</span>
                <span className="flex-1 truncate">{opt.label}</span>
                {active && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Otras alergias o restricciones
          </label>
          <input
            type="text"
            value={prefs.other}
            onChange={(e) => setPrefs((p) => ({ ...p, other: e.target.value }))}
            placeholder="p.ej. sin picante, alergia al huevo…"
            className="input w-full"
            maxLength={200}
          />
        </div>

        {error   && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <SuccessBanner text="Preferencias guardadas correctamente" />}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Guardando…' : 'Guardar preferencias'}
        </button>
      </form>
    </div>
  )
}

function SuccessBanner({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-lg">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </div>
  )
}
