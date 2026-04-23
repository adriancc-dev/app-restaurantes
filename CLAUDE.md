# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Restaurant reservation platform serving Moncofa, Nules, and La Vall d'Uixó. Two user types: regular users (free) and restaurant owners (100€/month subscription via Stripe). Full web + iOS/Android mobile app.

## Monorepo Structure

```
apps/web/      — Next.js 14 (App Router), web interface
apps/mobile/   — Expo (React Native), iOS + Android
packages/shared/ — Shared TypeScript types and constants
supabase/      — DB migrations, Edge Functions (Deno)
```

Package manager: **pnpm** with Turborepo.

## Commands

```bash
# Install all dependencies
pnpm install

# Run web dev server (localhost:3000)
pnpm dev:web

# Run Expo mobile app
pnpm dev:mobile
# or from apps/mobile:
pnpm expo start

# Build web for production
pnpm build:web

# Type-check all packages
pnpm type-check

# Supabase local dev
supabase start
supabase db reset       # reapply migrations
supabase functions serve  # run edge functions locally

# Expo build for stores (EAS)
cd apps/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android
eas submit --platform ios
```

## Environment Variables

Copy `.env.example` → `.env.local` in `apps/web/` and `.env` in `apps/mobile/`.

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web |
| `SUPABASE_SERVICE_ROLE_KEY` | web (server-only) |
| `STRIPE_SECRET_KEY` | web API routes |
| `STRIPE_PRICE_ID` | Stripe product for 100€/month |
| `STRIPE_WEBHOOK_SECRET` | web webhook endpoint |
| `RESEND_API_KEY` | email confirmations |
| `EXPO_PUBLIC_SUPABASE_URL` | mobile |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile |

## Architecture

### Authentication & Routing

- **Web**: Supabase SSR (`@supabase/ssr`). Middleware at `apps/web/src/middleware.ts` guards all routes under `/home`, `/restaurants`, `/calendar`, `/profile`, `/dashboard`. After login, redirects `role='restaurant'` → `/dashboard`, `role='user'` → `/home`.
- **Mobile**: `useAuth` hook in `apps/mobile/hooks/useAuth.ts` wraps Supabase session. Root `_layout.tsx` reads the session and redirects to `/(auth)/` or `/(tabs)/` or `/(restaurant)/`.

### Route Groups (Web)

| Group | Path | Access |
|---|---|---|
| Landing | `/` | Public — shows PlayStore link, QR, login/register |
| `(app)` | `/home`, `/restaurants`, `/calendar`, `/profile` | Authenticated users |
| `(restaurant)` | `/dashboard/**` | Authenticated restaurant owners |

### Database (Supabase/PostgreSQL)

Migration at `supabase/migrations/001_initial_schema.sql`. Key tables:

- **`profiles`** — extends `auth.users`. `role` field: `'user'` or `'restaurant'`. Auto-created via trigger on signup.
- **`restaurants`** — one per restaurant owner. `is_active` driven by `subscription_status='active'`.
- **`restaurant_hours`** — 7 rows per restaurant (0=Sunday…6=Saturday). Each row defines `open_time`, `close_time`, `slot_duration` (minutes), `max_capacity` (reservations per slot).
- **`reservations`** — `date + time + restaurant_id` is the slot key. Capacity checked via `get_slot_count()` SQL function.
- **`push_tokens`** — Expo push tokens per user for mobile notifications.

RLS is enabled on all tables — see the migration for policy details.

### Slot System

`packages/shared/src/types/index.ts` defines `TimeSlot`. `apps/web/src/lib/slots.ts` (and the same logic used in mobile) generates time slots from restaurant hours:
- Iterates from `open_time` to `close_time` in `slot_duration` increments
- Cross-references existing reservation counts per time
- Returns `{ time, available, remaining }`

### Notifications

Three notification events:
1. **Booking confirmation** — email (Resend) on web + push on mobile, sent immediately in `POST /api/reservations`
2. **24h reminder** — email + push. Sent by Supabase Edge Function `send-notifications` via pg_cron every 15 minutes
3. **1h reminder** — push only (no web). Same edge function

Push tokens registered in `apps/mobile/lib/notifications.ts` and stored in `push_tokens` table.

### Stripe Subscription Flow

1. Restaurant clicks "Activar suscripción" → `POST /api/stripe/checkout` → Stripe Checkout (€100/month, `STRIPE_PRICE_ID`)
2. Success → Stripe webhook → `POST /api/stripe/webhook` updates `subscription_status` + `is_active` on the restaurant row
3. `POST /api/stripe/portal` → Stripe Billing Portal to manage/cancel

Webhook also handled inside Supabase Edge Function `stripe-webhook` (for completeness).

### Shared Package

`packages/shared` exports TypeScript types and two runtime constants:
- `LOCATIONS` — array of `{ id, name, slug }` for the 3 cities
- `DAY_NAMES` — Spanish day names array (index = day_of_week)

Import as `@repo/shared` in both web and mobile.

### Mobile Location

`apps/mobile/hooks/useLocation.ts` requests foreground location permission and calculates the nearest of the 3 cities by Haversine distance. Shown as a hint on the home screen.

## Deployment

- **Web** → Vercel. Set all `NEXT_PUBLIC_*` and server-side env vars in the Vercel project.
- **Mobile** → EAS Build + EAS Submit. Config in `apps/mobile/eas.json`.
- **Supabase** → `supabase db push` to apply migrations to the cloud project.
- **Stripe webhook** → register `https://your-domain.com/api/stripe/webhook` in Stripe Dashboard, events: `customer.subscription.*`
- **pg_cron** in Supabase → requires enabling the extension and setting `app.supabase_url` / `app.service_role_key` as database settings.
