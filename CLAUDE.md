# CLAUDE.md

## Proyecto

Plataforma de reservas de restaurantes (Moncofa, Nules, La Vall d'Uixó). Dos roles: usuario (gratis) y restaurante (suscripción Stripe 100€/mes). Web + mobile.

Monorepo pnpm + Turborepo. **No usar npm ni yarn.**

## Comandos

```bash
pnpm install
pnpm dev:web          # localhost:3000
pnpm dev:mobile       # Expo
pnpm build:web
pnpm type-check       # tsc --noEmit en todos los packages

# Supabase
supabase start
supabase db reset
supabase functions serve

# Mobile stores
cd apps/mobile && eas build --platform android|ios --profile production
```

## Env

`.env.example` → `.env.local` (web) y `.env` (mobile). Variables sensibles server-only: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`.

## Decisiones de arquitectura

- Auth via Supabase SSR (web) y hook `useAuth` (mobile). Roles en `profiles.role` — el middleware redirige según rol.
- RLS habilitado en todas las tablas. La seguridad se enforcea en BD, no en app layer.
- Tipos compartidos en `@repo/shared` — importar siempre desde ahí, no duplicar tipos entre apps.
- Capacidad de reservas se valida con `get_slot_count()` en SQL, no en cliente.
- Notificaciones push via Edge Function + pg_cron (cada 15 min). Tokens en tabla `push_tokens`.
- Webhook de Stripe duplicado: API route de Next.js + Edge Function de Supabase (redundancia intencional).

## Deploy

- **Web** → Vercel (env vars en dashboard)
- **Mobile** → EAS Build + EAS Submit
- **Supabase** → `supabase db push` + `supabase functions deploy`
- **Stripe webhook** → registrar en Stripe Dashboard apuntando a `/api/stripe/webhook`
- **pg_cron** → requiere extensión habilitada + `app.supabase_url` y `app.service_role_key` como database settings

## Convenciones de código

### TypeScript

- `strict: true` y `noUncheckedIndexedAccess: true`. Manejar siempre `undefined` en accesos indexados.
- `interface` para objetos, props y contratos extensibles. `type` para uniones, tuplas y utility types.
- `any` prohibido. Usar `unknown` + type narrowing.
- Return types explícitos en funciones exportadas, hooks y API routes. Inferencia en variables locales.

### Validacion y seguridad

- **Zod** para validar todo input externo: body de API routes, formularios, params de URL.
- La frontera entre datos externos y codigo interno debe tener validacion runtime.

### Estado y data fetching

- **TanStack Query** para server state (fetching, cache, retry).
- **Zustand** o **Jotai** para estado global compartido entre componentes no relacionados.
- `useState` solo para estado local de UI.

### Error handling

- Nunca `catch {}` vacios. Loguear o propagar siempre.
- `error.tsx` en route groups de Next.js como Error Boundaries.
- Preferir patron de tuplas: `const [error, data] = await safeAsync(promise)`.

### Estilos

- Tailwind CSS + `clsx` + `tailwind-merge` para composicion condicional de clases.
- No concatenar strings de clases con template literals.

### Calidad

- Inmutabilidad: `.map()`, `.filter()`, spread. No `.push()` ni mutacion directa.
- Componentes funcionales, pequenos, single responsibility.
- Lazy loading (`next/dynamic` / `React.lazy`) para componentes pesados.

### Testing

- **Vitest** para unit/integracion. **Playwright** para E2E.
- Testear comportamientos (`@testing-library`), no implementacion. Mockear solo APIs externas.

### Tooling

- **Biome** como formatter y linter.
- **date-fns** para fechas.
