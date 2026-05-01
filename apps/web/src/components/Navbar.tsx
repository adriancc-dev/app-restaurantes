'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'

interface NavbarProps {
  userName?: string
}

const links = [
  { href: '/home', label: 'Inicio' },
  { href: '/restaurants', label: 'Restaurantes' },
  { href: '/calendar', label: 'Calendario' },
  { href: '/profile', label: 'Mi perfil' },
]

export default function Navbar({ userName }: NavbarProps) {
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
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/home" className="text-xl font-bold text-primary-600 dark:text-white tracking-tight shrink-0">
          🍽️ ReservApp
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                pathname.startsWith(l.href)
                  ? 'text-primary-600 dark:text-white border-b-2 border-primary-500 pb-[6px]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          <ThemeToggle className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10" />

          {firstName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-500/30 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-400 select-none">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {firstName}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 font-medium transition-colors"
          >
            Salir
          </button>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10" />
          <button
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
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
        <div className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-500/30 flex items-center justify-center text-sm font-semibold text-primary-700 dark:text-primary-400 select-none">
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
                pathname.startsWith(l.href)
                  ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
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
