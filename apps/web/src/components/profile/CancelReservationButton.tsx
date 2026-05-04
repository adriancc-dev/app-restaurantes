'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [state, setState] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCancel() {
    setState('loading')
    setError('')

    const res = await fetch(`/api/reservations/${reservationId}/cancel`, { method: 'PATCH' })

    if (res.ok) {
      router.refresh()
    } else {
      const data: unknown = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? 'No se pudo cancelar. Inténtalo de nuevo.')
      setState('idle')
    }
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          className="text-xs px-3 py-1.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Confirmar cancelación
        </button>
        <button
          onClick={() => setState('idle')}
          className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Volver
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">Cancelando...</span>
    )
  }

  return (
    <button
      onClick={() => setState('confirm')}
      className="text-xs px-3 py-1.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      Cancelar reserva
    </button>
  )
}
