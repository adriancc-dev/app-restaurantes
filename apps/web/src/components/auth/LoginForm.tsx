'use client'

import { useEffect, useState } from 'react'
import type { AuthFormState } from '@/hooks/useAuthForm'

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

type Props = Pick<
  AuthFormState,
  | 'email' | 'setEmail'
  | 'password' | 'setPassword'
  | 'fieldErrors' | 'error' | 'success'
  | 'loading' | 'redirecting' | 'resendConfirmationLoading' | 'showResendConfirmation'
  | 'showPassword' | 'setShowPassword'
  | 'handleLogin' | 'handleResendConfirmation' | 'handleGoogleOAuth' | 'switchMode'
>

export function LoginForm({
  email, setEmail,
  password, setPassword,
  fieldErrors, error, success,
  loading, redirecting, resendConfirmationLoading, showResendConfirmation,
  showPassword, setShowPassword,
  handleLogin, handleResendConfirmation, handleGoogleOAuth, switchMode,
}: Props) {
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  function handleResendClick() {
    handleResendConfirmation()
    setResendCooldown(60)
  }

  return (
    <>
      {error ? (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      ) : null}
      {success ? (
        <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
          {success}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleOAuth}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">o continúa con tu correo</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            name="email"
            className="input"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email ? (
            <p id="login-email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="input pr-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="login-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading || redirecting}
          className="btn-primary w-full text-base mt-2"
        >
          {redirecting ? 'Redirigiendo...' : loading ? 'Iniciando sesión...' : 'Entrar'}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => switchMode('forgot')}
            className="text-primary-700 hover:text-primary-900 underline"
          >
            ¿Olvidaste tu contraseña?
          </button>

          {showResendConfirmation && (
            <button
              type="button"
              onClick={resendCooldown > 0 ? undefined : handleResendClick}
              disabled={resendConfirmationLoading || resendCooldown > 0}
              className="text-primary-700 hover:text-primary-900 underline disabled:opacity-60"
            >
              {resendConfirmationLoading
                ? 'Reenviando...'
                : resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : 'Reenviar confirmación de correo'}
            </button>
          )}
        </div>
      </form>
    </>
  )
}
