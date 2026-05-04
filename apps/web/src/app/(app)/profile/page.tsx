import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import type { Reservation, Restaurant, ReservationStatus, Profile, Review, UserFavorite } from '@repo/shared'

import ProfileHero                from '@/components/profile/ProfileHero'
import EditProfileForm            from '@/components/profile/EditProfileForm'
import DietaryPreferencesForm     from '@/components/profile/DietaryPreferencesForm'
import NotificationPreferencesForm from '@/components/profile/NotificationPreferencesForm'
import ChangePasswordForm         from '@/components/profile/ChangePasswordForm'
import TwoFactorAuth              from '@/components/profile/TwoFactorAuth'
import ActiveSessions             from '@/components/profile/ActiveSessions'
import ExportDataButton           from '@/components/profile/ExportDataButton'
import CancelReservationButton    from '@/components/profile/CancelReservationButton'
import ReservationQRModal         from '@/components/profile/ReservationQRModal'
import ReviewForm                 from '@/components/profile/ReviewForm'
import FavoriteButton             from '@/components/FavoriteButton'
import DeleteAccountButton        from '@/components/DeleteAccountButton'

type ReservationRow = Omit<Reservation, 'restaurant'> & {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'image_url'> | null
}

type FavoriteRow = Omit<UserFavorite, 'restaurant'> & {
  restaurant: Pick<Restaurant, 'id' | 'name' | 'image_url' | 'address'> | null
}

function calcCompleteness(profile: Profile): number {
  const checks = [
    Boolean(profile.full_name),
    Boolean(profile.phone),
    Boolean(profile.location),
    Boolean(profile.avatar_url),
    Boolean(profile.birthday),
    Object.values(profile.dietary_preferences ?? {}).some((v) =>
      v === true || (typeof v === 'string' && v.length > 0)
    ),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [{ data: profile }, { data: reservations }, { data: favorites }, { data: reviews }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('reservations')
        .select('*, restaurant:restaurants(id, name, image_url)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(50),
      supabase
        .from('user_favorites')
        .select('*, restaurant:restaurants(id, name, image_url, address)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('restaurant_reviews')
        .select('reservation_id, rating, comment')
        .eq('user_id', user.id),
    ])

  if (!profile) redirect('/')

  const typedProfile = profile as Profile
  const rows         = (reservations ?? []) as ReservationRow[]
  const favRows      = (favorites    ?? []) as FavoriteRow[]
  const reviewMap    = new Map(
    ((reviews ?? []) as Pick<Review, 'reservation_id' | 'rating' | 'comment'>[]).map(
      (r) => [r.reservation_id, r]
    )
  )

  const today    = format(new Date(), 'yyyy-MM-dd')
  const upcoming = rows.filter((r) => r.status === 'confirmed' && r.date >= today)
  const past     = rows.filter((r) => r.status !== 'confirmed' || r.date < today)
  const uniqueRestaurants = new Set(rows.map((r) => r.restaurant_id)).size

  const stats = {
    totalReservations: rows.length,
    restaurantsVisited: uniqueRestaurants,
    completeness: calcCompleteness(typedProfile),
  }

  const emailVerified = Boolean(user.email_confirmed_at)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">

      {/* ── Hero ── */}
      <ProfileHero profile={typedProfile} stats={stats} emailVerified={emailVerified} />

      {/* ── Información personal + Preferencias alimentarias ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <EditProfileForm
          profile={{
            full_name: typedProfile.full_name,
            phone:     typedProfile.phone,
            location:  typedProfile.location,
            birthday:  typedProfile.birthday,
          }}
        />
        <DietaryPreferencesForm initial={typedProfile.dietary_preferences ?? {}} />
      </div>

      {/* ── Notificaciones ── */}
      <NotificationPreferencesForm initial={typedProfile.notification_preferences ?? {}} />

      {/* ── Próximas reservas ── */}
      <Section
        title="Próximas reservas"
        badge={upcoming.length > 0 ? String(upcoming.length) : undefined}
      >
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <ReservationCard key={r.id} reservation={r} showActions review={null} />
            ))}
          </div>
        ) : (
          <EmptyReservations />
        )}
      </Section>

      {/* ── Restaurantes favoritos ── */}
      {favRows.length > 0 && (
        <Section title="Mis favoritos" badge={String(favRows.length)}>
          <div className="grid gap-3 sm:grid-cols-2">
            {favRows.map((fav) => (
              <FavoriteCard key={fav.restaurant_id} fav={fav} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Historial ── */}
      {past.length > 0 && (
        <Section title="Historial de reservas">
          <div className="space-y-3">
            {past.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                showActions={false}
                review={reviewMap.get(r.id) ?? null}
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Seguridad ── */}
      <div className="card p-6 space-y-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          title="Seguridad"
          subtitle="Contraseña, autenticación y dispositivos"
        />

        <ChangePasswordForm />

        <Divider label="Autenticación en dos pasos" />
        <TwoFactorAuth />

        <Divider label="Sesiones activas" />
        <ActiveSessions />
      </div>

      {/* ── Privacidad y datos ── */}
      <div className="card p-6">
        <SectionHeader
          icon={
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="Privacidad y datos"
          subtitle="Conforme con el RGPD — tus datos te pertenecen"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Descarga una copia de todos tus datos: perfil, reservas, valoraciones y favoritos en formato JSON.
        </p>
        <ExportDataButton />
      </div>

      {/* ── Zona de peligro ── */}
      <div className="card p-6 border border-red-100 dark:border-red-900/40">
        <SectionHeader
          icon={
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          title="Zona de peligro"
          subtitle="Acciones permanentes e irreversibles"
          titleClass="text-red-700 dark:text-red-400"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Al eliminar tu cuenta se borrarán permanentemente todos tus datos, reservas, valoraciones y favoritos. No podrás recuperar ningún dato.
        </p>
        <DeleteAccountButton />
      </div>

    </div>
  )
}

/* ─── sub-components ─── */

const STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  confirmed: { label: 'Confirmada',    classes: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  cancelled: { label: 'Cancelada',     classes: 'text-red-600  dark:text-red-400   bg-red-50   dark:bg-red-900/20'   },
  completed: { label: 'Completada',    classes: 'text-gray-600 dark:text-gray-400  bg-gray-100 dark:bg-gray-700/50'  },
  no_show:   { label: 'No presentado', classes: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20' },
}

function ReservationCard({
  reservation,
  showActions,
  review,
}: {
  reservation: ReservationRow
  showActions: boolean
  review: { rating: number; comment: string | null } | null
}) {
  const { label, classes } = STATUS_CONFIG[reservation.status]
  const dateStr = format(new Date(reservation.date + 'T12:00:00'), "EEEE, d 'de' MMMM yyyy", { locale: es })
  const time    = String(reservation.time).slice(0, 5)

  return (
    <div className="card p-4">
      <div className="flex items-start gap-4">
        {reservation.restaurant?.image_url ? (
          <img
            src={reservation.restaurant.image_url}
            alt={reservation.restaurant?.name ?? ''}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0 text-xl">
            🍽️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white truncate">
              {reservation.restaurant?.name ?? 'Restaurante'}
            </p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${classes}`}>
              {label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarIcon />
              <span className="capitalize">{dateStr}</span>
            </span>
            <span className="flex items-center gap-1"><ClockIcon />{time}</span>
            <span className="flex items-center gap-1">
              <PeopleIcon />
              {reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}
            </span>
          </div>

          {reservation.notes && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic truncate">
              &ldquo;{reservation.notes}&rdquo;
            </p>
          )}

          {/* Actions */}
          {(showActions || reservation.status === 'completed') && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {showActions && reservation.status === 'confirmed' && (
                <>
                  <CancelReservationButton reservationId={reservation.id} />
                  <ReservationQRModal
                    reservationId={reservation.id}
                    restaurantName={reservation.restaurant?.name ?? 'Restaurante'}
                    date={reservation.date}
                    time={time}
                    partySize={reservation.party_size}
                  />
                </>
              )}
              {reservation.status === 'completed' && reservation.restaurant && (
                <ReviewForm
                  reservationId={reservation.id}
                  restaurantId={reservation.restaurant.id}
                  restaurantName={reservation.restaurant.name}
                  existingReview={review ?? undefined}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FavoriteCard({ fav }: { fav: FavoriteRow }) {
  if (!fav.restaurant) return null
  return (
    <div className="card p-4 flex items-center gap-3">
      {fav.restaurant.image_url ? (
        <img src={fav.restaurant.image_url} alt={fav.restaurant.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{fav.restaurant.name}</p>
        {fav.restaurant.address && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{fav.restaurant.address}</p>
        )}
      </div>
      <FavoriteButton restaurantId={fav.restaurant_id} initialFavorited size="sm" />
    </div>
  )
}

function EmptyReservations() {
  return (
    <div className="card p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4 text-2xl">🍽️</div>
      <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">Sin reservas próximas</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">Explora los restaurantes y haz tu primera reserva</p>
      <Link href="/home" className="btn-primary inline-block">Explorar restaurantes</Link>
    </div>
  )
}

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {badge && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function SectionHeader({ icon, title, subtitle, titleClass }: {
  icon: React.ReactNode
  title: string
  subtitle: string
  titleClass?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className={`font-semibold ${titleClass ?? 'text-gray-900 dark:text-white'}`}>{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  )
}

/* ─── tiny icon helpers ─── */
function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function PeopleIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
