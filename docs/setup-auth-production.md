# Setup: Auth en producción

Guía para configurar todas las integraciones externas del sistema de autenticación (Supabase, Apple, Google, Sentry, Edge Functions).

---

## 1. Variables de entorno del mobile

El archivo `apps/mobile/.env` ya tiene los valores correctos de Supabase.
Solo necesitas añadir Sentry cuando lo configures (paso 6).

**`apps/mobile/.env`**
```env
EXPO_PUBLIC_SUPABASE_URL=https://cvhwpiranpgjjhzxrfyb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# Añadir cuando tengas Sentry configurado:
# EXPO_PUBLIC_SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXXXX
```

**`apps/web/.env.local`**
```env
# Añadir cuando tengas Sentry configurado:
# NEXT_PUBLIC_SENTRY_DSN=https://xxx@oXXX.ingest.sentry.io/XXXXX
```

---

## 2. Registrar el deep link en Supabase

Sin esto, los emails de confirmación y OAuth no funcionan en la app móvil.

1. Ve a **[app.supabase.com](https://app.supabase.com)** → tu proyecto
2. Menú lateral → **Authentication** → **URL Configuration**
3. En **Redirect URLs** → **Add URL** → escribe exactamente:
   ```
   reservapp://auth/callback
   ```
4. Haz clic en **Save**

> Comprueba también que **Site URL** tenga el dominio de producción de tu web (ej: `https://reservapp.vercel.app`).

---

## 3. Activar Google OAuth

### En Google Cloud Console

1. Ve a **[console.cloud.google.com](https://console.cloud.google.com)**
2. Selecciona tu proyecto (o créalo)
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Tipo: **Web Application**
5. En **Authorized redirect URIs** añade:
   ```
   https://cvhwpiranpgjjhzxrfyb.supabase.co/auth/v1/callback
   ```
6. Copia el **Client ID** y **Client Secret**

### En Supabase

1. **Authentication** → **Providers** → **Google**
2. Activa el toggle
3. Pega el **Client ID** y **Client Secret** de Google
4. Guarda

---

## 4. Activar Apple Sign In (iOS)

Necesitas una cuenta de **Apple Developer** ($99/año en [developer.apple.com](https://developer.apple.com)).

### Paso A — Configurar App ID

1. **Certificates, IDs & Profiles** → **Identifiers** → **+**
2. Tipo: **App IDs**
3. Bundle ID: `com.apprestaurantes.reservapp`
4. Activa **Sign In with Apple**
5. Guarda

### Paso B — Crear Services ID (para la callback web de Supabase)

1. **Identifiers** → **+** → **Services IDs**
2. Description: `ReservApp Auth`
3. Identifier: `com.apprestaurantes.reservapp.web`
4. Activa **Sign In with Apple** → **Configure**:
   - **Primary App ID**: `com.apprestaurantes.reservapp`
   - **Domains**: `cvhwpiranpgjjhzxrfyb.supabase.co`
   - **Return URLs**: `https://cvhwpiranpgjjhzxrfyb.supabase.co/auth/v1/callback`
5. Guarda

### Paso C — Crear la Key

1. **Keys** → **+**
2. Nombre: `ReservApp Sign In with Apple`
3. Activa **Sign In with Apple** → **Configure** → selecciona tu App ID
4. **Register** → **Download** (guarda el archivo `.p8` — solo se puede descargar una vez)
5. Anota el **Key ID** (10 caracteres, ej: `ABCDE12345`)

### Paso D — Configurar en Supabase

1. **Authentication** → **Providers** → **Apple**
2. Activa el toggle
3. Rellena:
   - **Services ID**: `com.apprestaurantes.reservapp.web`
   - **Apple Team ID**: visible arriba a la derecha en developer.apple.com (ej: `A1B2C3D4E5`)
   - **Key ID**: el de la key creada (ej: `ABCDE12345`)
   - **Private Key**: el contenido completo del archivo `.p8` (incluye las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
4. **Save**

---

## 5. Desplegar la Edge Function `delete-account`

La función está en `supabase/functions/delete-account/index.ts`. Se encarga de cancelar la suscripción de Stripe (si aplica) y borrar el usuario con la clave de servicio.

**Desde el terminal, en la raíz del proyecto:**

```bash
# 1. Autenticarse en Supabase CLI (solo la primera vez)
supabase login

# 2. Vincular el proyecto local con el remoto (solo la primera vez)
supabase link --project-ref cvhwpiranpgjjhzxrfyb

# 3. Añadir el secret de Stripe (lo usa la función para cancelar suscripciones)
supabase secrets set STRIPE_SECRET_KEY=sk_test_51TPKFoJZpoSteyu7...

# 4. Desplegar la función
supabase functions deploy delete-account
```

> Los secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente — no hace falta añadirlos.

**Verificar que está desplegada:**
- Supabase Dashboard → **Edge Functions** → aparece `delete-account` en la lista con estado activo.

**En producción**, cuando quieras usar la clave real de Stripe:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## 6. Configurar Sentry (opcional pero muy recomendado)

Sentry captura errores en tiempo real de producción. El código ya está integrado y se activa solo cuando la variable de entorno está definida.

### Crear cuenta y proyectos

1. Ve a **[sentry.io](https://sentry.io)** → Sign Up (plan gratuito disponible)
2. Crea una **organización** con el nombre de tu empresa
3. Crea dos proyectos:
   - Plataforma **Next.js** → nombre `reservapp-web`
   - Plataforma **React Native** → nombre `reservapp-mobile`
4. Al terminar de crear cada proyecto, Sentry muestra el **DSN** — es una URL del tipo:
   ```
   https://abc123def456@o123456.ingest.sentry.io/789012
   ```

### Añadir el DSN al web

En `apps/web/.env.local`, descomenta y rellena:
```env
NEXT_PUBLIC_SENTRY_DSN=https://tu-dsn-web@oXXXX.ingest.sentry.io/XXXXX
```

### Añadir el DSN al mobile

En `apps/mobile/.env`, descomenta y rellena:
```env
EXPO_PUBLIC_SENTRY_DSN=https://tu-dsn-mobile@oXXXX.ingest.sentry.io/XXXXX
```

### Añadir el DSN en Vercel (producción web)

1. Ve a **[vercel.com](https://vercel.com)** → tu proyecto → **Settings** → **Environment Variables**
2. Añade variable:
   - Nombre: `NEXT_PUBLIC_SENTRY_DSN`
   - Valor: el DSN del proyecto `reservapp-web`
   - Entornos: Production, Preview

---

## Resumen — qué hacer y cuándo

| Tarea | Tiempo | ¿Cuándo? |
|---|---|---|
| Registrar `reservapp://auth/callback` | 2 min | **Ahora** — bloquea emails de confirmación en mobile |
| Activar Google OAuth | 10 min | **Ahora** — bloquea login con Google en mobile |
| Desplegar Edge Function `delete-account` | 5 min | **Ahora** — bloquea borrado de cuentas en mobile |
| Activar Apple Sign In | 30–60 min | Antes de subir a **App Store** (obligatorio por guidelines) |
| Configurar Sentry | 10 min | Cuando vayas a hacer el primer deploy a producción |

---

## Comandos útiles de referencia

```bash
# Ver los secrets configurados en la Edge Function
supabase secrets list

# Ver logs de la Edge Function en tiempo real
supabase functions serve delete-account --env-file apps/mobile/.env

# Redesplegar tras cambios en el código de la función
supabase functions deploy delete-account

# Ver todas las Edge Functions desplegadas
supabase functions list
```
