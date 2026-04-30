import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LOCATIONS } from '@repo/shared'

const LOCATION_IMAGES: Record<string, string> = {
  moncofa: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  nules: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  'la-vall-duixo': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
}

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: featuredRestaurants }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('restaurants')
      .select('*, location:locations(name)')
      .eq('is_active', true)
      .limit(4),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'bienvenido'

  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center text-center pt-6">
        <p className="text-gray-400 text-sm font-medium mb-3 tracking-wide uppercase">
          Hola, {firstName}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl mb-8">
          Encuentra la mesa perfecta para hoy.
        </h1>
        <form action="/restaurants" method="GET" className="w-full max-w-2xl">
          <div className="flex items-center bg-[#0d1c2d] border border-[#464554] rounded-full px-6 py-4 shadow-xl focus-within:border-primary-500/70 transition-all duration-300 gap-4">
            <svg
              className="w-5 h-5 text-[#908fa0] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5Z"
              />
            </svg>
            <input
              name="q"
              className="bg-transparent border-none focus:ring-0 text-white w-full text-base placeholder:text-[#908fa0] outline-none"
              placeholder="Buscar restaurantes o localidades"
            />
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-300 active:scale-95 shrink-0"
            >
              BUSCAR
            </button>
          </div>
        </form>
      </section>

      {/* Localidades */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Explorar por Localidad</h2>
          <Link
            href="/restaurants"
            className="text-primary-400 text-xs font-semibold tracking-widest uppercase hover:underline"
          >
            VER TODAS
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {LOCATIONS.map((loc) => (
            <Link
              key={loc.id}
              href={`/restaurants?location=${loc.slug}`}
              className="group relative overflow-hidden rounded-xl border border-[#464554] bg-[#122131] h-48 cursor-pointer transition-all duration-500 hover:border-primary-500/50 block"
            >
              <img
                src={LOCATION_IMAGES[loc.slug]}
                alt={loc.name}
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#010f1f] to-transparent" />
              <div className="absolute bottom-5 left-5">
                <h3 className="text-xl font-bold text-white mb-1">{loc.name}</h3>
                <p className="text-sm text-[#908fa0]">Ver restaurantes →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurantes destacados */}
      {featuredRestaurants && featuredRestaurants.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Restaurantes Destacados</h2>
            <Link
              href="/restaurants"
              className="text-primary-400 text-xs font-semibold tracking-widest uppercase hover:underline"
            >
              VER TODOS
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="bg-[#0d1c2d] border border-[#464554] rounded-xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:border-primary-500/30"
              >
                <div className="relative h-44">
                  {restaurant.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#122131] to-[#1c2b3c] flex items-center justify-center text-4xl">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mb-3 flex-grow">
                    <h4 className="font-bold text-white text-base mb-1">{restaurant.name}</h4>
                    {restaurant.location && (
                      <p className="text-sm text-[#908fa0]">{restaurant.location.name}</p>
                    )}
                    {restaurant.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{restaurant.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end mt-auto pt-2 border-t border-[#464554]/50">
                    <span className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-widest uppercase">
                      RESERVAR
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Accesos rápidos */}
      <section className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/calendar"
          className="bg-[#0d1c2d] border border-[#464554] rounded-xl p-6 flex items-center gap-4 hover:border-primary-500/50 transition-all duration-300 group"
        >
          <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            📅
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
              Ver disponibilidad
            </h3>
            <p className="text-sm text-[#908fa0] mt-0.5">
              Consulta qué restaurantes tienen hueco en una fecha
            </p>
          </div>
        </Link>
        <Link
          href="/profile"
          className="bg-[#0d1c2d] border border-[#464554] rounded-xl p-6 flex items-center gap-4 hover:border-primary-500/50 transition-all duration-300 group"
        >
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            👤
          </div>
          <div>
            <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
              Mis reservas
            </h3>
            <p className="text-sm text-[#908fa0] mt-0.5">
              Gestiona tus reservas activas
            </p>
          </div>
        </Link>
      </section>
    </div>
  )
}
