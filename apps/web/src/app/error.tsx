'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#051424] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-white">Algo ha ido mal</h1>
        <p className="mt-2 text-[#908fa0] max-w-sm mx-auto">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="btn-primary px-6 py-3">
            Reintentar
          </button>
          <a href="/" className="btn-secondary px-6 py-3">
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
