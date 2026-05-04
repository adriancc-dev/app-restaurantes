'use client'

import { useState } from 'react'

export default function ExportDataButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleExport() {
    setLoading(true); setError('')
    const res = await fetch('/api/profile/export')
    if (!res.ok) {
      setError('No se pudo exportar los datos. Inténtalo de nuevo.')
      setLoading(false)
      return
    }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `mis-datos-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={loading}
        className="flex items-center gap-2 text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60 w-full"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {loading ? 'Preparando exportación…' : 'Descargar mis datos (JSON)'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
