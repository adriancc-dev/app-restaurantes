'use client'

import { useState } from 'react'

interface FavoriteButtonProps {
  restaurantId: string
  initialFavorited: boolean
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ restaurantId, initialFavorited, size = 'md' }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading]     = useState(false)

  async function toggle() {
    setFavorited((v) => !v)  // optimistic
    setLoading(true)
    const res = await fetch(`/api/favorites/${restaurantId}`, { method: 'POST' })
    if (!res.ok) setFavorited((v) => !v)  // rollback on error
    setLoading(false)
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const btnSize  = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all disabled:opacity-60 ${
        favorited
          ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
          : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      } shadow-sm backdrop-blur-sm`}
    >
      <svg className={iconSize} fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  )
}
