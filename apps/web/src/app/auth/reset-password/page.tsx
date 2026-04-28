'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[a-z]/, 'Incluye al menos una minúscula.')
      .regex(/\d/, 'Incluye al menos un número.')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un símbolo.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

const CRITERIA = [
  { key: 'minLength', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'Al menos un símbolo', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const criteriaResults = CRITERIA.map((c) => ({ ...c, met: c.test(password) }))
  const passwordScore = criteriaResults.filter((c) => c.met).length
  const passwordsMatch = password === confirmPassword

  const strengthLabel =
    passwordScore <= 1
      ? 'Muy débil'
      : passwordScore <= 2
        ? 'Débil'
        : passwordScore <= 3
          ? 'Media'
          : passwordScore <= 4
            ? 'Fuerte'
            : 'Muy fuerte'

  const strengthColor =
    passwordScore <= 1
      ? 'bg-red-500'
      : passwordScore <= 2
        ? 'bg-orange-500'
        : passwordScore <= 3
          ? 'bg-yellow-500'
          : passwordScore <= 4
            ? 'bg-lime-500'
            : 'bg-green-600'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    if (loading) return

    setError('')
    setFieldErrors({})

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors
      setFieldErrors({
        password: errs.password?.[0] ?? '',
        confirmPassword: errs.confirmPassword?.[0] ?? '',
      })
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('No hemos podido actualizar la contraseña. Solicita un nuevo enlace.')
        return
      }
      await supabase.auth.signOut()
      setSuccess(true)
      setTimeout(() => router.replace('/'), 2500)
    } catch {
      setError('Ha ocurrido un error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-orange-700 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-white/80">Elige una nueva contraseña segura para tu cuenta</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-lg font-semibold text-gray-900">¡Contraseña actualizada!</h2>
              <p className="mt-2 text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <>
              {error ? (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                  {fieldErrors.password ? (
                    <p id="password-error" className="mt-1 text-xs text-red-600">
                      {fieldErrors.password}
                    </p>
                  ) : null}

                  {password.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(passwordScore / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Seguridad: <span className="font-semibold">{strengthLabel}</span>
                      </p>
                      <ul className="space-y-1 pt-1">
                        {criteriaResults.map(({ key, label, met }) => (
                          <li
                            key={key}
                            className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            <span>{met ? '✓' : '○'}</span>
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  {fieldErrors.confirmPassword ? (
                    <p id="confirm-password-error" className="mt-1 text-xs text-red-600">
                      {fieldErrors.confirmPassword}
                    </p>
                  ) : null}
                  {!fieldErrors.confirmPassword && confirmPassword.length > 0 && !passwordsMatch ? (
                    <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base mt-2"
                >
                  {loading ? 'Actualizando contraseña...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          ¿Recordaste tu contraseña?{' '}
          <a href="/" className="text-white/90 underline hover:text-white transition-colors">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  )
}
