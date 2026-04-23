'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <h2 className="text-xl font-semibold text-gray-900">Algo salió mal</h2>
      <p className="text-gray-500 text-sm">Ha ocurrido un error inesperado.</p>
      <button onClick={reset} className="btn-primary">
        Intentar de nuevo
      </button>
    </div>
  )
}
