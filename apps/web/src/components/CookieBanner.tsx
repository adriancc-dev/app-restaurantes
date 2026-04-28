'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'cookie-consent-v1'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'all')
    setVisible(false)
  }

  function rejectNonEssential() {
    localStorage.setItem(CONSENT_KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl bg-gray-900 text-white rounded-2xl p-5 shadow-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Usamos cookies 🍪</p>
          <p className="text-xs text-gray-400 mt-1">
            Usamos cookies esenciales para el funcionamiento de la plataforma. Consulta nuestra{' '}
            <Link href="/privacy" className="underline hover:text-white transition-colors">
              Política de Privacidad
            </Link>{' '}
            para más información.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={rejectNonEssential}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 transition-colors"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  )
}
