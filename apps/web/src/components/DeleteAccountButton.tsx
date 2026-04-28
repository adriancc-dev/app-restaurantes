'use client'

import { useState } from 'react'

export default function DeleteAccountButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción es permanente e irreversible. Se borrarán todos tus datos y reservas.'
    )
    if (!confirmed) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'No se pudo eliminar la cuenta. Inténtalo de nuevo.')
        return
      }
      window.location.assign('/')
    } catch {
      setError('Error de conexión. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
      >
        {loading ? 'Eliminando cuenta...' : 'Eliminar mi cuenta permanentemente'}
      </button>
    </div>
  )
}
