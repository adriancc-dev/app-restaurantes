import Link from 'next/link'
import { Restaurant } from '@repo/shared'

interface Props {
  restaurant: Restaurant & { location?: { name: string } }
}

export default function RestaurantCard({ restaurant }: Props) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="card group hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-44 overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#122131] to-[#1c2b3c] flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-white text-lg group-hover:text-primary-400 transition-colors">
          {restaurant.name}
        </h3>
        {restaurant.location && (
          <p className="text-sm text-[#908fa0] mt-0.5">📍 {restaurant.location.name}</p>
        )}
        {restaurant.description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{restaurant.description}</p>
        )}
        <div className="mt-3 pt-3 border-t border-[#464554]/50 flex items-center justify-between">
          {restaurant.menu_url && (
            <span className="text-xs text-primary-400 font-medium">📋 Carta disponible</span>
          )}
          <span className="text-xs text-primary-400 font-semibold ml-auto">
            Reservar →
          </span>
        </div>
      </div>
    </Link>
  )
}
