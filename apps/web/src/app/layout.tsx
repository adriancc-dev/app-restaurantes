import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'App Restaurantes — Moncofa, Nules y La Vall d\'Uixó',
  description:
    'Reserva mesa en los mejores restaurantes de Moncofa, Nules y La Vall d\'Uixó',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  )
}
