import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#051424] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-[#273647] select-none">404</p>
        <h1 className="text-3xl font-bold text-white mt-2">Página no encontrada</h1>
        <p className="mt-3 text-[#908fa0] max-w-sm mx-auto">
          Esta página no existe o ha sido movida. Comprueba la dirección o vuelve al inicio.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="btn-primary px-6 py-3"
          >
            Ir al inicio
          </Link>
          <Link
            href="/home"
            className="btn-secondary px-6 py-3"
          >
            Mis reservas
          </Link>
        </div>
      </div>
    </div>
  )
}
