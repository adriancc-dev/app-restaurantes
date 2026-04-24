import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LOCATIONS } from '@repo/shared'

const LOCATION_IMAGES: Record<string, string> = {
  moncofa: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
  nules: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  'la-vall-duixo': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
}

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
    : { data: null }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          ¡Hola, {profile?.full_name?.split(' ')[0] ?? 'bienvenido'}!
        </h1>
        <p className="text-gray-500 mt-1">¿Dónde quieres comer hoy?</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {LOCATIONS.map((loc) => (
          <Link
            key={loc.id}
            href={`/restaurants?location=${loc.slug}`}
            className="card group cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={LOCATION_IMAGES[loc.slug]}
                alt={loc.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h2 className="absolute bottom-4 left-4 text-white text-2xl font-bold">
                {loc.name}
              </h2>
            </div>
            <div className="p-4">
              <p className="text-gray-500 text-sm">
                Ver restaurantes disponibles →
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/calendar"
          className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center text-2xl">
            📅
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              Ver disponibilidad
            </h3>
            <p className="text-sm text-gray-500">
              Consulta qué restaurantes tienen hueco en una fecha
            </p>
          </div>
        </Link>

        <Link
          href="/profile"
          className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              Mis reservas
            </h3>
            <p className="text-sm text-gray-500">
              Gestiona tus reservas activas
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
