'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

interface RestaurantNavbarProps {
  userName?: string
}

const links = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/edit', label: 'Mi restaurante' },
  { href: '/dashboard/hours', label: 'Horarios' },
  { href: '/dashboard/reservations', label: 'Reservas' },
  { href: '/dashboard/subscription', label: 'Suscripción' },
]

export default function RestaurantNavbar({ userName }: RestaurantNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initial = userName ? userName.charAt(0).toUpperCase() : '?'
  const firstName = userName?.split(' ')[0] ?? ''

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="text-xl font-bold text-primary-600 dark:text-primary-400 shrink-0">
          🍽️ Panel
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === l.href
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800" />

          {firstName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 select-none">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {firstName}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            Salir
          </button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800" />
          <button
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-300 select-none">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{userName}</span>
            </div>
          )}
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
