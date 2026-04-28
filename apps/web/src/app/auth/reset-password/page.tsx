'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordCriteria = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passwordScore = Object.values(passwordCriteria).filter(Boolean).length
  const isPasswordStrong = passwordScore >= 4
  const passwordsMatch = password === confirmPassword
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setError('')
    setSuccess('')

    if (!isPasswordStrong) {
      setError('La nueva contraseña no es suficientemente segura.')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('No hemos podido actualizar la contraseña. Solicita un nuevo enlace.')
        return
      }

      setSuccess('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
      setTimeout(() => {
        router.replace('/')
      }, 1200)
    } catch {
      setError('Ha ocurrido un error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
        <p className="mt-2 text-sm text-gray-600">
          Escribe tu nueva contraseña y confírmala para completar el cambio.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
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
            />
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${passwordStrength.colorClass}`}
                    style={{ width: `${(passwordScore / 5) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  Seguridad: <span className="font-semibold">{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
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
            />
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base"
          >
            {loading ? 'Actualizando contraseña...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}
