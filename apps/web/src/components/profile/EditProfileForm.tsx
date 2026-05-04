'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LOCATIONS } from '@repo/shared'
import type { Profile } from '@repo/shared'

type FormProps = Pick<Profile, 'full_name' | 'phone' | 'location' | 'birthday'>

type Step = 'form' | 'otp'

const OTP_EXPIRY_SECONDS = 600 // 10 minutos

export default function EditProfileForm({ profile }: { profile: FormProps }) {
  const [fullName,  setFullName]  = useState(profile.full_name  ?? '')
  const [phone,     setPhone]     = useState(profile.phone      ?? '')
  const [location,  setLocation]  = useState(profile.location   ?? '')
  const [birthday,  setBirthday]  = useState(profile.birthday   ?? '')

  const [step,      setStep]      = useState<Step>('form')
  const [otpCode,   setOtpCode]   = useState('')
  const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS)
  const [canResend, setCanResend] = useState(false)

  // Saved pending payload when waiting for OTP
  const pendingPayload = useRef<Record<string, unknown>>({})

  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')
  const router = useRouter()

  // Countdown timer
  useEffect(() => {
    if (step !== 'otp') return
    setCountdown(OTP_EXPIRY_SECONDS)
    setCanResend(false)

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        if (c === OTP_EXPIRY_SECONDS - 60) setCanResend(true) // allow resend after 60s
        return c - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step])

  function formatCountdown(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('El nombre es obligatorio.'); return }
    setError('')

    const nameChanged  = fullName.trim() !== (profile.full_name ?? '')
    const phoneChanged = phone.trim()    !== (profile.phone     ?? '')
    const sensitiveChanged = nameChanged || phoneChanged

    // Build payload (only include what changed/is set)
    const payload: Record<string, unknown> = {
      location: location || null,
      birthday: birthday || null,
    }
    if (nameChanged)  payload.full_name = fullName.trim()
    if (phoneChanged) payload.phone     = phone.trim() || null

    if (!sensitiveChanged) {
      // Guardado directo sin OTP
      setLoading(true)
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: unknown = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Error al guardar los cambios.')
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 4000)
      }
      setLoading(false)
      return
    }

    // Datos sensibles cambiados → solicitar OTP
    pendingPayload.current = payload
    setLoading(true)
    const res = await fetch('/api/profile/request-otp', { method: 'POST' })
    const data: unknown = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((data as { error?: string }).error ?? 'No se pudo enviar el código.')
      setLoading(false)
      return
    }
    setLoading(false)
    setOtpCode('')
    setStep('otp')
  }

  async function handleOTPSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otpCode.length !== 6) return
    setLoading(true); setError('')

    const payload = { ...pendingPayload.current, otp: otpCode }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data: unknown = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError((data as { error?: string }).error ?? 'Código incorrecto.')
    } else {
      setStep('form')
      setOtpCode('')
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 4000)
    }
    setLoading(false)
  }

  async function handleResend() {
    if (!canResend) return
    setCanResend(false)
    setError('')
    setOtpCode('')
    await fetch('/api/profile/request-otp', { method: 'POST' })
    setCountdown(OTP_EXPIRY_SECONDS)
    setCanResend(false)
  }

  // ── OTP modal ──
  if (step === 'otp') {
    return (
      <div className="card p-6">
        <button
          type="button"
          onClick={() => { setStep('form'); setError('') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 -ml-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Verificación por email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Código enviado a tu correo
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Hemos enviado un código de 6 dígitos a tu email para confirmar el cambio. Introduce el código a continuación.
        </p>

        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="input w-full text-center tracking-[0.5em] text-2xl font-mono"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-between text-xs">
            <span className={`${countdown > 0 ? 'text-gray-400 dark:text-gray-500' : 'text-red-500'}`}>
              {countdown > 0
                ? `Caduca en ${formatCountdown(countdown)}`
                : 'Código caducado'}
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className="text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:no-underline transition-opacity"
            >
              Reenviar código
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={otpCode.length !== 6 || loading || countdown === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando…' : 'Confirmar cambios'}
          </button>
        </form>
      </div>
    )
  }

  // ── Main form ──
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Información personal</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Nombre y teléfono requieren verificación</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <Field label="Nombre completo" required locked>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Tu nombre y apellidos"
            className="input w-full"
            maxLength={100}
            autoComplete="name"
          />
        </Field>

        <Field label="Teléfono" locked>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className="input w-full"
            autoComplete="tel"
          />
        </Field>

        <Field label="Ciudad">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input w-full"
          >
            <option value="">Selecciona tu ciudad</option>
            {LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Fecha de nacimiento">
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="input w-full"
            autoComplete="bday"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Los restaurantes pueden enviarte ofertas especiales en tu cumpleaños
          </p>
        </Field>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cambios guardados correctamente
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Procesando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label, required, locked, children,
}: {
  label: string
  required?: boolean
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {locked && (
          <span
            title="Requiere verificación por email"
            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
