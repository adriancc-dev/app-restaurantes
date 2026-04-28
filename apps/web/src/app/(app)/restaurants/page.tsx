import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantCard from '@/components/RestaurantCard'
import { LOCATIONS } from '@repo/shared'
import Link from 'next/link'

interface Props {
  searchParams: { location?: string }
}

export default async function RestaurantsPage({ searchParams }: Props) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const selectedSlug = searchParams.location

  const location = LOCATIONS.find((l) => l.slug === selectedSlug)

  let query = supabase
    .from('restaurants')
    .select('*, location:locations(*)')
    .eq('is_active', true)
    .order('name')

  if (location) {
    query = query.eq('location_id', location.id)
  }

  const { data: restaurants } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {location ? `Restaurantes en ${location.name}` : 'Todos los restaurantes'}
          </h1>
          <p className="text-gray-500 mt-1">
            {restaurants?.length ?? 0} restaurantes disponibles
          </p>
        </div>

        {/* Filtros de localización */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/restaurants"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedSlug
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            Todos
          </Link>
          {LOCATIONS.map((loc) => (
            <Link
              key={loc.id}
              href={`/restaurants?location=${loc.slug}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedSlug === loc.slug
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {loc.name}
            </Link>
          ))}
        </div>
      </div>

      {restaurants && restaurants.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-lg font-medium">No hay restaurantes disponibles</p>
          <p className="text-sm mt-1">Prueba con otra localización</p>
        </div>
      )}
    </div>
  )
}
