'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RestaurantNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const links = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/edit', label: 'Mi restaurante' },
    { href: '/dashboard/hours', label: 'Horarios' },
    { href: '/dashboard/reservations', label: 'Reservas' },
    { href: '/dashboard/subscription', label: 'Suscripción' },
  ]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6 overflow-x-auto">
        <Link href="/dashboard" className="text-xl font-bold text-primary-600 shrink-0">
          🍽️ Panel
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === l.href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium shrink-0"
        >
          Salir
        </button>
      </div>
    </nav>
  )
}
