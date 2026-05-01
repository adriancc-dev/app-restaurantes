'use client'

import Link from 'next/link'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import type { AuthFormState } from '@/hooks/useAuthForm'
import { PASSWORD_CRITERIA } from '@/hooks/useAuthForm'

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
  | 'registerStep'
  | 'fullName' | 'setFullName'
  | 'phone' | 'setPhone'
  | 'role' | 'setRole'
  | 'email' | 'setEmail'
  | 'password' | 'setPassword'
  | 'confirmPassword' | 'setConfirmPassword'
  | 'acceptTerms' | 'setAcceptTerms'
  | 'honeypot' | 'setHoneypot'
  | 'fieldErrors' | 'error' | 'success'
  | 'loading' | 'redirecting'
  | 'showPassword' | 'setShowPassword'
  | 'showConfirmPassword' | 'setShowConfirmPassword'
  | 'hasValidFullName' | 'hasValidPhone' | 'isEmailValid'
  | 'criteriaResults' | 'passwordScore' | 'passwordsMatch'
  | 'handleNextStep' | 'handleRegister' | 'handleGoogleOAuth'
>

const strengthLabel = (score: number) =>
  score <= 1 ? 'Muy débil' :
  score <= 2 ? 'Débil' :
  score <= 3 ? 'Media' :
  score <= 4 ? 'Fuerte' : 'Muy fuerte'

const strengthColor = (score: number) =>
  score <= 1 ? 'bg-red-500' :
  score <= 2 ? 'bg-orange-500' :
  score <= 3 ? 'bg-yellow-500' :
  score <= 4 ? 'bg-lime-500' : 'bg-green-600'

export function RegisterForm({
  registerStep,
  fullName, setFullName,
  phone, setPhone,
  role, setRole,
  email, setEmail,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  acceptTerms, setAcceptTerms,
  honeypot, setHoneypot,
  fieldErrors, error, success,
  loading, redirecting,
  showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword,
  hasValidFullName, hasValidPhone, isEmailValid,
  criteriaResults, passwordScore, passwordsMatch,
  handleNextStep, handleRegister, handleGoogleOAuth,
}: Props) {
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

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-5">
        {([1, 2] as const).map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                registerStep >= step
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {registerStep > step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : step}
            </div>
            <span className={`text-xs ${registerStep >= step ? 'text-gray-700' : 'text-gray-400'}`}>
              {step === 1 ? 'Datos personales' : 'Acceso'}
            </span>
            {step < 2 && <div className="flex-1 h-px w-8 bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* PASO 1: nombre, teléfono, rol */}
      {registerStep === 1 && (
        <>
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
            <span className="text-xs text-gray-400">o completa el formulario</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleNextStep} noValidate className="space-y-4">
            {/* Honeypot anti-bot */}
            <div aria-hidden="true" className="absolute opacity-0 pointer-events-none -z-10 h-0 overflow-hidden">
              <input
                tabIndex={-1}
                autoComplete="off"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                className="input"
                placeholder="Ej: Juan Pérez Gómez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                autoFocus
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              />
              {fieldErrors.fullName ? (
                <p id="fullName-error" className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              ) : !fieldErrors.fullName && fullName.length > 0 && !hasValidFullName ? (
                <p className="mt-1 text-xs text-red-600">Introduce al menos nombre y un apellido.</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono <span className="text-red-500">*</span>
                <span className="ml-1 text-gray-400 font-normal">(extensión país + número)</span>
              </label>
              <div className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50">
                <PhoneInput
                  id="phone"
                  international
                  defaultCountry="ES"
                  countryCallingCodeEditable={false}
                  value={phone}
                  onChange={setPhone}
                  className="flex items-center gap-2"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
              </div>
              {fieldErrors.phone ? (
                <p id="phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              ) : !fieldErrors.phone && phone && !hasValidPhone ? (
                <p className="mt-1 text-xs text-red-600">Número no válido para el país seleccionado.</p>
              ) : null}
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de cuenta
              </legend>
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
            </fieldset>

            <button type="submit" className="btn-primary w-full text-base mt-2">
              Siguiente
              <svg className="ml-2 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </form>
        </>
      )}

      {/* PASO 2: email, contraseña, términos */}
      {registerStep === 2 && (
        <form onSubmit={handleRegister} noValidate className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'reg-email-error' : undefined}
            />
            {fieldErrors.email ? (
              <p id="reg-email-error" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : email.length > 0 && !isEmailValid ? (
              <p className="mt-1 text-xs text-red-600">Introduce un correo válido (ejemplo: nombre@dominio.com).</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'reg-password-error' : undefined}
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
              <p id="reg-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : null}

            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColor(passwordScore)}`}
                    style={{ width: `${(passwordScore / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Seguridad: <span className="font-semibold">{strengthLabel(passwordScore)}</span>
                </p>
                <ul className="space-y-1 pt-0.5">
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
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {fieldErrors.confirmPassword ? (
              <p id="confirm-password-error" className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            ) : confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>
            ) : null}
          </div>

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
                Acepto los{' '}
                <Link href="/terms" className="text-primary-600 underline">Términos</Link>
                {' '}y la{' '}
                <Link href="/privacy" className="text-primary-600 underline">Política de Privacidad</Link>.
              </span>
            </label>
            {fieldErrors.acceptTerms ? (
              <p id="terms-error" className="mt-1 text-xs text-red-600">{fieldErrors.acceptTerms}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loading || redirecting}
            className="btn-primary w-full text-base mt-2"
          >
            {redirecting ? 'Redirigiendo...' : loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Las cuentas de restaurante requieren suscripción para activarse.
          </p>
        </form>
      )}
    </>
  )
}
