'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

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
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const submittedEmail = String(formData.get('email') ?? email).trim()
      const submittedPassword = String(formData.get('password') ?? password)

      if (!submittedEmail || !submittedPassword) {
        setError('Introduce email y contraseña para iniciar sesión.')
        return
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submittedEmail,
          password: submittedPassword,
        }),
      })

      if (!loginResponse.ok) {
        const result = (await loginResponse.json().catch(() => ({}))) as { error?: string }
        setError(result.error ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.')
        return
      }

      // Navegacion directa tras login correcto para evitar quedarnos en la landing
      window.location.assign('/home')
    } catch {
      setError('Error de conexión. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const normalizedEmail = email.trim()
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Email confirmation required — no session yet
    if (data.user && !data.session) {
      setSuccess('Hemos enviado un correo de confirmación. Revisa tu bandeja de entrada y pulsa el enlace para activar tu cuenta.')
      setLoading(false)
      return
    }

    if (phone || fullName) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName, phone })
          .eq('id', user.id)
      }
    }

    window.location.replace('/')
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
                onClick={() => { setMode(m); setError('') }}
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
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="600 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
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
              />
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
                minLength={6}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base mt-2">
              {loading
                ? 'Cargando...'
                : mode === 'login'
                ? 'Entrar'
                : 'Crear cuenta'}
            </button>
          </form>

          {mode === 'register' && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              Las cuentas de restaurante requieren suscripción de{' '}
              <strong>100€/mes</strong> para activarse.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
