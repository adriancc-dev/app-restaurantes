'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    <nav className="bg-black/90 backdrop-blur-md sticky top-0 z-40 border-b border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/home" className="text-xl font-bold text-white tracking-tight shrink-0">
          🍽️ ReservApp
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                pathname.startsWith(l.href)
                  ? 'text-white border-b-2 border-primary-500 pb-[6px]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {firstName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-sm font-semibold text-primary-400 select-none">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-300 max-w-[120px] truncate">
                {firstName}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-300 font-medium transition-colors"
          >
            Salir
          </button>
        </div>

        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="md:hidden p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
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

      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 px-4 py-3 space-y-1">
          {userName && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-sm font-semibold text-primary-400 select-none">
                {initial}
              </div>
              <span className="text-sm font-medium text-gray-300 truncate">{userName}</span>
            </div>
          )}
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(l.href)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}
