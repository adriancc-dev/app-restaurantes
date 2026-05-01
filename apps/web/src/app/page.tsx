'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useAuthForm } from '@/hooks/useAuthForm'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { RegisterSuccess } from '@/components/auth/RegisterSuccess'

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const PLAYSTORE_URL = process.env.NEXT_PUBLIC_PLAYSTORE_URL ?? 'https://play.google.com/store/apps'
const APPSTORE_URL = process.env.NEXT_PUBLIC_APPSTORE_URL ?? 'https://apps.apple.com'

export default function LandingPage() {
  const auth = useAuthForm()

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

          {auth.mode === 'forgot' ? (
            <ForgotPasswordForm
              email={auth.email}
              setEmail={auth.setEmail}
              fieldErrors={auth.fieldErrors}
              error={auth.error}
              success={auth.success}
              forgotPasswordLoading={auth.forgotPasswordLoading}
              handleForgotPassword={auth.handleForgotPassword}
              switchMode={auth.switchMode}
            />
          ) : (
            <>
              {/* Tabs login / registro */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                {(['login', 'register'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => auth.switchMode(m)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                      auth.mode === m
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                  </button>
                ))}
              </div>

              {auth.mode === 'login' && (
                <LoginForm
                  email={auth.email}
                  setEmail={auth.setEmail}
                  password={auth.password}
                  setPassword={auth.setPassword}
                  fieldErrors={auth.fieldErrors}
                  error={auth.error}
                  success={auth.success}
                  loading={auth.loading}
                  redirecting={auth.redirecting}
                  resendConfirmationLoading={auth.resendConfirmationLoading}
                  showResendConfirmation={auth.showResendConfirmation}
                  showPassword={auth.showPassword}
                  setShowPassword={auth.setShowPassword}
                  handleLogin={auth.handleLogin}
                  handleResendConfirmation={auth.handleResendConfirmation}
                  handleGoogleOAuth={auth.handleGoogleOAuth}
                  switchMode={auth.switchMode}
                />
              )}

              {auth.mode === 'register' && !auth.registerSuccess && (
                <RegisterForm
                  registerStep={auth.registerStep}
                  fullName={auth.fullName}
                  setFullName={auth.setFullName}
                  phone={auth.phone}
                  setPhone={auth.setPhone}
                  role={auth.role}
                  setRole={auth.setRole}
                  email={auth.email}
                  setEmail={auth.setEmail}
                  password={auth.password}
                  setPassword={auth.setPassword}
                  confirmPassword={auth.confirmPassword}
                  setConfirmPassword={auth.setConfirmPassword}
                  acceptTerms={auth.acceptTerms}
                  setAcceptTerms={auth.setAcceptTerms}
                  honeypot={auth.honeypot}
                  setHoneypot={auth.setHoneypot}
                  fieldErrors={auth.fieldErrors}
                  error={auth.error}
                  success={auth.success}
                  loading={auth.loading}
                  redirecting={auth.redirecting}
                  showPassword={auth.showPassword}
                  setShowPassword={auth.setShowPassword}
                  showConfirmPassword={auth.showConfirmPassword}
                  setShowConfirmPassword={auth.setShowConfirmPassword}
                  hasValidFullName={auth.hasValidFullName}
                  hasValidPhone={auth.hasValidPhone}
                  isEmailValid={auth.isEmailValid}
                  criteriaResults={auth.criteriaResults}
                  passwordScore={auth.passwordScore}
                  passwordsMatch={auth.passwordsMatch}
                  handleNextStep={auth.handleNextStep}
                  handleRegister={auth.handleRegister}
                  handleGoogleOAuth={auth.handleGoogleOAuth}
                />
              )}

              {auth.mode === 'register' && auth.registerSuccess && (
                <RegisterSuccess
                  email={auth.email}
                  resendConfirmationLoading={auth.resendConfirmationLoading}
                  success={auth.success}
                  handleResendConfirmation={auth.handleResendConfirmation}
                  switchMode={auth.switchMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
