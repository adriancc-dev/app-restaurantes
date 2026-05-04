'use client'

import { useState } from 'react'

export default function ActiveSessions() {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  async function revokeOthers() {
    setLoading(true); setError(''); setDone(false)
    const res = await fetch('/api/auth/sessions', { method: 'DELETE' })
    if (res.ok) {
      setDone(true)
    } else {
      const d: unknown = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Error al cerrar sesiones.')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Este dispositivo</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sesión actual · Activa ahora</p>
        </div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
          Activa
        </span>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {done ? (
        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Otras sesiones cerradas correctamente
        </div>
      ) : (
        <button
          onClick={revokeOthers}
          disabled={loading}
          className="w-full text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          {loading ? 'Cerrando sesiones…' : 'Cerrar sesión en otros dispositivos'}
        </button>
      )}
    </div>
  )
}
