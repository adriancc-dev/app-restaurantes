'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reservationId: string
  restaurantId: string
  restaurantName: string
  existingReview?: { rating: number; comment: string | null }
}

const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

export default function ReviewForm({ reservationId, restaurantId, restaurantName, existingReview }: Props) {
  const [open, setOpen]       = useState(false)
  const [rating, setRating]   = useState(existingReview?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setLoading(true); setError('')

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservation_id: reservationId,
        restaurant_id:  restaurantId,
        rating,
        comment: comment.trim() || null,
      }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const d: unknown = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Error al enviar la valoración.')
    }
    setLoading(false)
  }

  const display = hovered || rating

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5"
          fill={existingReview ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        {existingReview ? `Tu valoración: ${existingReview.rating}/5` : 'Valorar'}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
              {existingReview ? 'Editar valoración' : '¿Cómo fue tu experiencia?'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{restaurantName}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div
                className="flex justify-center gap-2"
                onMouseLeave={() => setHovered(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <span className={display >= star ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}>
                      ★
                    </span>
                  </button>
                ))}
              </div>

              {display > 0 && (
                <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 -mt-3">
                  {LABELS[display]}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Cuéntanos tu experiencia…"
                  rows={3}
                  maxLength={500}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-1">{comment.length}/500</p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!rating || loading}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando…' : 'Enviar valoración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
