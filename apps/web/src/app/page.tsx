'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

const TERMS_VERSION = '2026-04'
const MAX_AUTH_ATTEMPTS = 5
const AUTH_WINDOW_MS = 15 * 60 * 1000
const AUTH_LOCK_MS = 15 * 60 * 1000
const AUTH_ATTEMPTS_STORAGE_KEY = 'auth-attempts-v1'

interface AuthAttemptState {
  login: {
    count: number
    firstAttemptAt: number
    lockedUntil: number | null
  }
  register: {
    count: number
    firstAttemptAt: number
    lockedUntil: number | null
  }
}

const loginSchema = z.object({
  email: z.string().trim().email('Introduce un correo electrónico válido.'),
  password: z.string().min(1, 'Introduce tu contraseña.'),
})

const registerSchema = z
  .object({
    fullName: z.string().trim().refine((value) => value.split(/\s+/).length === 3, {
      message: 'Debe tener 3 palabras: 1 nombre y 2 apellidos.',
    }),
    email: z.string().trim().email('Introduce un correo electrónico válido.'),
    phone: z
      .string()
      .min(1, 'Introduce un número de teléfono.')
      .refine((value) => isValidPhoneNumber(value), {
        message: 'Número no válido para el país seleccionado.',
      }),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[a-z]/, 'Incluye al menos una minúscula.')
      .regex(/\d/, 'Incluye al menos un número.')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un símbolo.'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((value) => value, {
      message: 'Debes aceptar los Términos y la Política de Privacidad.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

function readAttemptState(): AuthAttemptState {
  if (typeof window === 'undefined') {
    return {
      login: { count: 0, firstAttemptAt: 0, lockedUntil: null },
      register: { count: 0, firstAttemptAt: 0, lockedUntil: null },
    }
  }

  try {
    const raw = window.localStorage.getItem(AUTH_ATTEMPTS_STORAGE_KEY)
    if (!raw) {
      return {
        login: { count: 0, firstAttemptAt: 0, lockedUntil: null },
        register: { count: 0, firstAttemptAt: 0, lockedUntil: null },
      }
    }
    return JSON.parse(raw) as AuthAttemptState
  } catch {
    return {
      login: { count: 0, firstAttemptAt: 0, lockedUntil: null },
      register: { count: 0, firstAttemptAt: 0, lockedUntil: null },
    }
  }
}

function writeAttemptState(state: AuthAttemptState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_ATTEMPTS_STORAGE_KEY, JSON.stringify(state))
}

function getLockRemainingMs(action: 'login' | 'register'): number {
  const now = Date.now()
  const state = readAttemptState()[action]
  if (!state.lockedUntil || state.lockedUntil <= now) return 0
  return state.lockedUntil - now
}

function registerAuthFailure(action: 'login' | 'register'): void {
  const now = Date.now()
  const state = readAttemptState()
  const branch = state[action]
  const isWindowExpired = !branch.firstAttemptAt || now - branch.firstAttemptAt > AUTH_WINDOW_MS
  const nextCount = isWindowExpired ? 1 : branch.count + 1
  const shouldLock = nextCount >= MAX_AUTH_ATTEMPTS

  state[action] = {
    count: shouldLock ? 0 : nextCount,
    firstAttemptAt: shouldLock ? 0 : (isWindowExpired ? now : branch.firstAttemptAt),
    lockedUntil: shouldLock ? now + AUTH_LOCK_MS : null,
  }

  writeAttemptState(state)
}

function clearAuthFailures(action: 'login' | 'register'): void {
  const state = readAttemptState()
  state[action] = { count: 0, firstAttemptAt: 0, lockedUntil: null }
  writeAttemptState(state)
}

function formatRemainingMinutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60000))
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const PLAYSTORE_URL =
  process.env.NEXT_PUBLIC_PLAYSTORE_URL ??
  'https://play.google.com/store/apps'
const APPSTORE_URL =
  process.env.NEXT_PUBLIC_APPSTORE_URL ?? 'https://apps.apple.com'

export default function LandingPage() {
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [resendConfirmationLoading, setResendConfirmationLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const normalizedEmail = email.trim()
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ')
  const fullNameParts = normalizedFullName.length > 0 ? normalizedFullName.split(' ') : []
  const hasValidFullName = fullNameParts.length === 3
  const hasValidPhone = typeof phone === 'string' && isValidPhoneNumber(phone)
  const isEmailValid = z.string().email().safeParse(normalizedEmail).success
  const passwordCriteria = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordScore = Object.values(passwordCriteria).filter(Boolean).length
  const isPasswordStrong = passwordScore >= 4
  const passwordStrength = {
    label:
      passwordScore <= 1
        ? 'Muy débil'
        : passwordScore <= 2
        ? 'Débil'
        : passwordScore <= 3
        ? 'Media'
        : passwordScore <= 4
        ? 'Fuerte'
        : 'Muy fuerte',
    colorClass:
      passwordScore <= 1
        ? 'bg-red-500'
        : passwordScore <= 2
        ? 'bg-orange-500'
        : passwordScore <= 3
        ? 'bg-yellow-500'
        : passwordScore <= 4
        ? 'bg-lime-500'
        : 'bg-green-600',
  }
  const passwordsMatch = password === confirmPassword

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const lockRemaining = getLockRemainingMs('login')
    if (lockRemaining > 0) {
      setError(`Demasiados intentos. Vuelve a intentarlo en ${formatRemainingMinutes(lockRemaining)} min.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const parsed = loginSchema.safeParse({
        email: String(formData.get('email') ?? email),
        password: String(formData.get('password') ?? password),
      })
      if (!parsed.success) {
        const nextFieldErrors = parsed.error.flatten().fieldErrors
        setFieldErrors({
          email: nextFieldErrors.email?.[0] ?? '',
          password: nextFieldErrors.password?.[0] ?? '',
        })
        return
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (loginError || !data.user) {
        registerAuthFailure('login')
        setError('No se pudo iniciar sesión. Revisa tus credenciales o confirma tu correo.')
        return
      }

      clearAuthFailures('login')
      window.location.assign('/home')
    } catch {
      setError('Error de conexión. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const lockRemaining = getLockRemainingMs('register')
    if (lockRemaining > 0) {
      setError(`Demasiados intentos de registro. Vuelve a intentarlo en ${formatRemainingMinutes(lockRemaining)} min.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      phone: phone ?? '',
      password,
      confirmPassword,
      acceptTerms,
    })

    if (!parsed.success) {
      const nextFieldErrors = parsed.error.flatten().fieldErrors
      setFieldErrors({
        fullName: nextFieldErrors.fullName?.[0] ?? '',
        email: nextFieldErrors.email?.[0] ?? '',
        phone: nextFieldErrors.phone?.[0] ?? '',
        password: nextFieldErrors.password?.[0] ?? '',
        confirmPassword: nextFieldErrors.confirmPassword?.[0] ?? '',
        acceptTerms: nextFieldErrors.acceptTerms?.[0] ?? '',
      })
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            role,
            full_name: parsed.data.fullName.trim().replace(/\s+/g, ' '),
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        registerAuthFailure('register')
        setError('No se pudo crear la cuenta con esos datos. Revisa la información e inténtalo de nuevo.')
        return
      }

      clearAuthFailures('register')
      // Email confirmation required — no session yet
      if (data.user && !data.session) {
        setSuccess('Si el correo es válido, te hemos enviado un enlace de confirmación.')
        return
      }

      if (parsed.data.phone || normalizedFullName) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ full_name: normalizedFullName, phone: parsed.data.phone })
            .eq('id', user.id)
        }
      }
      window.location.replace('/')
    } catch {
      setError('No se pudo completar el registro. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(): Promise<void> {
    const parsed = loginSchema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) {
      setFieldErrors((current) => ({ ...current, email: 'Introduce un correo electrónico válido para recuperar contraseña.' }))
      return
    }

    setForgotPasswordLoading(true)
    setError('')
    setSuccess('')
    try {
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      setSuccess('Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.')
    } catch {
      setError('No hemos podido enviar el correo de recuperación. Inténtalo de nuevo.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  async function handleResendConfirmation(): Promise<void> {
    const parsed = loginSchema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) {
      setFieldErrors((current) => ({ ...current, email: 'Introduce un correo electrónico válido para reenviar confirmación.' }))
      return
    }

    setResendConfirmationLoading(true)
    setError('')
    setSuccess('')
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: parsed.data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      setSuccess('Si el correo está pendiente, reenviamos el enlace de confirmación.')
    } catch {
      setError('No se pudo reenviar el correo de confirmación. Inténtalo de nuevo.')
    } finally {
      setResendConfirmationLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700">
      {/* Banner descarga */}
      <div className="bg-black/30 backdrop-blur-sm py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 flex-wrap">
          <span className="text-white text-sm font-medium">
            ¡Descarga nuestra app y reserva desde tu móvil!
          </span>
          <div className="flex gap-3">
            <a
              href={PLAYSTORE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.03L13.58 14l-3.24-3.24-7.16 12.97zM20.1 10.36l-2.53-1.45-3.58 3.1 3.58 3.1 2.56-1.47c.73-.42.73-1.47-.03-1.88v.6zM2.3.32C2.1.54 2 .85 2 1.23v21.55c0 .38.1.69.32.9l.05.04L13.1 12.01v-.28L2.35.27 2.3.32zm11.27 11.25l3.58-3.1-3.58-3.58L10 8.15l3.57 3.42z" />
              </svg>
              Google Play
            </a>
            <a
              href={APPSTORE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-60px)]">
        {/* Columna izquierda: branding + QR */}
        <div className="text-white space-y-8">
          <div>
            <h1 className="text-5xl font-bold leading-tight">
              Reserva tu mesa<br />
              <span className="text-yellow-300">en segundos</span>
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Los mejores restaurantes de Moncofa, Nules y La Vall d&apos;Uixó
              en un solo lugar. Elige, reserva y disfruta.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">
            {['Moncofa', 'Nules', "La Vall d'Uixó"].map((loc) => (
              <span
                key={loc}
                className="bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/30"
              >
                📍 {loc}
              </span>
            ))}
          </div>

          {/* QR Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block border border-white/20">
            <p className="text-sm text-white/80 mb-3 text-center">
              Escanea para acceder desde tu móvil
            </p>
            <div className="bg-white p-3 rounded-xl">
              <QRCode value={APP_URL} size={140} />
            </div>
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); setFieldErrors({}) }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: Juan Pérez Gómez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                  />
                  {fieldErrors.fullName ? <p id="fullName-error" className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p> : null}
                  {!fieldErrors.fullName && fullName.length > 0 && !hasValidFullName ? <p className="mt-1 text-xs text-red-600">Debe tener 3 palabras.</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono (extensión país + número)
                  </label>
                  <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                    <PhoneInput
                      international
                      defaultCountry="ES"
                      countryCallingCodeEditable={false}
                      value={phone}
                      onChange={setPhone}
                      required
                      className="flex items-center gap-2"
                      autoComplete="tel"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                    />
                  </div>
                  {fieldErrors.phone ? <p id="phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p> : null}
                  {!fieldErrors.phone && phone && !hasValidPhone ? <p className="mt-1 text-xs text-red-600">Número no válido para el país seleccionado.</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de cuenta
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['user', 'restaurant'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          role === r
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {r === 'user' ? '👤 Cliente' : '🍽️ Restaurante'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              />
              {fieldErrors.email ? <p id="email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
              {!fieldErrors.email && mode === 'register' && email.length > 0 && !isEmailValid ? <p className="mt-1 text-xs text-red-600">Introduce un correo válido (ejemplo: nombre@dominio.com).</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password ? <p id="password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2">
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${passwordStrength.colorClass}`}
                      style={{ width: `${(passwordScore / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Seguridad: <span className="font-semibold">{passwordStrength.label}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Usa al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos.
                  </p>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {fieldErrors.confirmPassword ? <p id="confirm-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
                {!fieldErrors.confirmPassword && confirmPassword.length > 0 && !passwordsMatch ? <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p> : null}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1"
                    aria-invalid={Boolean(fieldErrors.acceptTerms)}
                    aria-describedby={fieldErrors.acceptTerms ? 'terms-error' : undefined}
                  />
                  <span>
                    Acepto los <Link href="/terms" className="text-primary-600 underline">Términos</Link> y la <Link href="/privacy" className="text-primary-600 underline">Política de Privacidad</Link>.
                  </span>
                </label>
                {fieldErrors.acceptTerms ? <p id="terms-error" className="mt-1 text-xs text-red-600">{fieldErrors.acceptTerms}</p> : null}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full text-base mt-2">
              {loading
                ? 'Cargando...'
                : mode === 'login'
                ? 'Entrar'
                : 'Crear cuenta'}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotPasswordLoading}
                className="text-primary-700 hover:text-primary-900 underline disabled:opacity-60"
              >
                {forgotPasswordLoading ? 'Enviando recuperación...' : '¿Olvidaste tu contraseña?'}
              </button>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendConfirmationLoading}
                className="text-primary-700 hover:text-primary-900 underline disabled:opacity-60"
              >
                {resendConfirmationLoading ? 'Reenviando...' : 'Reenviar confirmación de correo'}
              </button>
            </div>
          </form>

          {mode === 'register' && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              Las cuentas de restaurante requieren suscripción para activarse.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
