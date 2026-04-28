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
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold">Algo ha ido mal</h1>
        <p className="mt-2 text-white/80 max-w-sm mx-auto">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors border border-white/30"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
