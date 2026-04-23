import Link from 'next/link'
import { Restaurant } from '@repo/shared'

interface Props {
  restaurant: Restaurant & { location?: { name: string } }
}

export default function RestaurantCard({ restaurant }: Props) {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="card group hover:shadow-md transition-shadow">
      <div className="relative h-44 overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">
          {restaurant.name}
        </h3>
        {restaurant.location && (
          <p className="text-sm text-gray-500 mt-0.5">📍 {restaurant.location.name}</p>
        )}
        {restaurant.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{restaurant.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {restaurant.menu_url && (
            <span className="text-xs text-primary-600 font-medium">📋 Carta disponible</span>
          )}
          <span className="text-xs text-primary-500 font-semibold ml-auto">
            Reservar →
          </span>
        </div>
      </div>
    </Link>
  )
}
