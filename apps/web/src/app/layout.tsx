import type { Metadata, Viewport } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'ReservApp — Restaurantes en Moncofa, Nules y La Vall d\'Uixó',
  description:
    'Reserva mesa en los mejores restaurantes de Moncofa, Nules y La Vall d\'Uixó de forma rápida y sencilla.',
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
