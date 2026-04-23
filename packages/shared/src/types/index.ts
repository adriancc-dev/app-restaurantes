export type UserRole = 'user' | 'restaurant'

export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled'

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export interface Profile {
  id: string
  email: string
  phone: string | null
  location: string | null
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Location {
  id: number
  name: string
  slug: string
}

export interface Restaurant {
  id: string
  owner_id: string
  name: string
  description: string | null
  location_id: number
  location?: Location
  address: string | null
  latitude: number | null
  longitude: number | null
  menu_url: string | null
  phone: string | null
  email: string | null
  image_url: string | null
  is_active: boolean
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface RestaurantHours {
  id: number
  restaurant_id: string
  day_of_week: number // 0=domingo, 1=lunes, ..., 6=sábado
  is_open: boolean
  open_time: string | null  // HH:MM
  close_time: string | null // HH:MM
  slot_duration: number     // minutos por slot
  max_capacity: number      // reservas máximas por slot
}

export interface Reservation {
  id: string
  user_id: string
  restaurant_id: string
  restaurant?: Restaurant
  user?: Profile
  date: string         // YYYY-MM-DD
  time: string         // HH:MM
  party_size: number
  status: ReservationStatus
  notes: string | null
  notification_24h_sent: boolean
  notification_1h_sent: boolean
  created_at: string
}

export interface PushToken {
  id: number
  user_id: string
  token: string
  created_at: string
}

export interface TimeSlot {
  time: string        // HH:MM
  available: boolean
  remaining: number
}

export const LOCATIONS: Location[] = [
  { id: 1, name: 'Moncofa', slug: 'moncofa' },
  { id: 2, name: 'Nules', slug: 'nules' },
  { id: 3, name: "La Vall d'Uixó", slug: 'la-vall-duixo' },
]

export const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]
