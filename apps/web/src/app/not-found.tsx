import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700 flex items-center justify-center px-4">
      <div className="text-center text-white">
        <p className="text-8xl font-black opacity-30 select-none">404</p>
        <h1 className="text-3xl font-bold mt-2">Página no encontrada</h1>
        <p className="mt-3 text-white/80 max-w-sm mx-auto">
          Esta página no existe o ha sido movida. Comprueba la dirección o vuelve al inicio.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="bg-white text-primary-700 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/home"
            className="bg-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors border border-white/30"
          >
            Mis reservas
          </Link>
        </div>
      </div>
    </div>
  )
}
