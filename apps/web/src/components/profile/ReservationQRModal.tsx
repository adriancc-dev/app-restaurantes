'use client'

import { useState } from 'react'
import QRCode from 'react-qr-code'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  reservationId: string
  restaurantName: string
  date: string
  time: string
  partySize: number
}

export default function ReservationQRModal({ reservationId, restaurantName, date, time, partySize }: Props) {
  const [open, setOpen] = useState(false)

  const shortId = reservationId.slice(-8).toUpperCase()
  const qrValue = JSON.stringify({ id: reservationId, r: restaurantName, d: date, t: time, p: partySize })
  const dateLabel = format(new Date(date + 'T12:00:00'), "d 'de' MMMM", { locale: es })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
        </svg>
        Ver QR
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3 text-xl">
              🍽️
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{restaurantName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {dateLabel} · {String(time).slice(0, 5)} · {partySize} {partySize === 1 ? 'persona' : 'personas'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Muestra este QR al llegar al restaurante</p>

            <div className="flex justify-center mb-4 p-4 bg-white rounded-xl border border-gray-100">
              <QRCode value={qrValue} size={180} />
            </div>

            <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-4 tracking-widest">
              #{shortId}
            </p>

            <button onClick={() => setOpen(false)} className="btn-primary w-full">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
