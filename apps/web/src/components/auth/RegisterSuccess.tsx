'use client'

import { useEffect, useState } from 'react'
import type { AuthFormState } from '@/hooks/useAuthForm'

type Props = Pick<
  AuthFormState,
  | 'email'
  | 'resendConfirmationLoading'
  | 'success'
  | 'handleResendConfirmation' | 'switchMode'
>

export function RegisterSuccess({
  email,
  resendConfirmationLoading,
  success,
  handleResendConfirmation, switchMode,
}: Props) {
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((v) => v - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function handleResendClick() {
    handleResendConfirmation()
    setCooldown(60)
  }

  return (
    <div className="text-center space-y-5 py-4">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">¡Cuenta creada!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Hemos enviado un enlace de confirmación a{' '}
          <span className="font-medium text-gray-900">{email}</span>.
          Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
        </p>
      </div>

      {success ? (
        <div role="status" className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl text-left">
          {success}
        </div>
      ) : null}

      <div className="space-y-3 pt-2">
        <p className="text-xs text-gray-500">¿No has recibido el correo?</p>
        <button
          type="button"
          onClick={cooldown > 0 ? undefined : handleResendClick}
          disabled={resendConfirmationLoading || cooldown > 0}
          className="w-full py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {resendConfirmationLoading
            ? 'Reenviando...'
            : cooldown > 0
            ? `Reenviar en ${cooldown}s`
            : 'Reenviar correo de confirmación'}
        </button>

        <button
          type="button"
          onClick={() => switchMode('login')}
          className="w-full text-sm text-primary-700 hover:text-primary-900 underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}
