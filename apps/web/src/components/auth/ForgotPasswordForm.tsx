'use client'

import type { AuthFormState } from '@/hooks/useAuthForm'

type Props = Pick<
  AuthFormState,
  | 'email' | 'setEmail'
  | 'fieldErrors' | 'error' | 'success'
  | 'forgotPasswordLoading'
  | 'handleForgotPassword' | 'switchMode'
>

export function ForgotPasswordForm({
  email, setEmail,
  fieldErrors, error, success,
  forgotPasswordLoading,
  handleForgotPassword, switchMode,
}: Props) {
  return (
    <>
      <button
        onClick={() => switchMode('login')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Volver al inicio de sesión
      </button>

      <h2 className="text-xl font-bold text-gray-900">Recuperar contraseña</h2>
      <p className="mt-1 text-sm text-gray-500">
        Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error ? (
        <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
          {success}
        </div>
      ) : null}

      {!success && (
        <form onSubmit={handleForgotPassword} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="forgot-email"
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              disabled={forgotPasswordLoading}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'forgot-email-error' : undefined}
            />
            {fieldErrors.email ? (
              <p id="forgot-email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={forgotPasswordLoading}
            className="btn-primary w-full text-base"
          >
            {forgotPasswordLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}

      {success && (
        <button
          onClick={() => switchMode('login')}
          className="mt-6 btn-primary w-full text-base"
        >
          Volver al inicio de sesión
        </button>
      )}
    </>
  )
}
