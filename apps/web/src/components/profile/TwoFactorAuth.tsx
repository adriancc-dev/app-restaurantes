'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'react-qr-code'

type Factor = { id: string; status: 'verified' | 'unverified'; factor_type: string }
type Step = 'idle' | 'setup' | 'verify' | 'enabled' | 'disabling'

export default function TwoFactorAuth() {
  const [step, setStep]           = useState<Step>('idle')
  const [factor, setFactor]       = useState<Factor | null>(null)
  const [totpUri, setTotpUri]     = useState('')
  const [secret, setSecret]       = useState('')
  const [factorId, setFactorId]   = useState('')
  const [code, setCode]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [checking, setChecking]   = useState(true)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === 'verified') ?? null
      setFactor(verified as Factor | null)
      setStep(verified ? 'enabled' : 'idle')
      setChecking(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function startSetup() {
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (err || !data) { setError(err?.message ?? 'Error al iniciar 2FA.'); setLoading(false); return }
    setFactorId(data.id)
    setTotpUri(data.totp.uri)
    setSecret(data.totp.secret)
    setStep('setup')
    setLoading(false)
  }

  async function verifyCode() {
    if (code.length !== 6) return
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (err) { setError('Código incorrecto. Inténtalo de nuevo.'); setLoading(false); return }
    setFactor({ id: factorId, status: 'verified', factor_type: 'totp' })
    setStep('enabled')
    setCode('')
    setLoading(false)
  }

  async function disable() {
    if (!factor) return
    setStep('disabling'); setError('')
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (err) { setError(err.message); setStep('enabled'); return }
    setFactor(null)
    setStep('idle')
  }

  if (checking) {
    return <div className="h-10 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl" />
  }

  return (
    <div className="space-y-4">
      {step === 'idle' && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Autenticación en dos pasos</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Protege tu cuenta con una app de autenticación</p>
          </div>
          <button onClick={startSetup} disabled={loading} className="text-sm px-4 py-2 btn-primary disabled:opacity-60">
            {loading ? 'Cargando…' : 'Activar 2FA'}
          </button>
        </div>
      )}

      {step === 'setup' && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Paso 1 — Escanea el código QR
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Abre Google Authenticator, Authy u otra app y escanea este código
            </p>
            <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100 mb-3">
              <QRCode value={totpUri} size={160} />
            </div>
            <details className="text-xs">
              <summary className="text-gray-500 dark:text-gray-400 cursor-pointer">Entrada manual</summary>
              <p className="mt-1 font-mono text-gray-700 dark:text-gray-300 break-all bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">{secret}</p>
            </details>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Paso 2 — Introduce el código</p>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="input flex-1 text-center tracking-widest text-lg font-mono"
              />
              <button onClick={verifyCode} disabled={code.length !== 6 || loading} className="btn-primary px-5 disabled:opacity-50">
                {loading ? '…' : 'Verificar'}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button onClick={() => { setStep('idle'); setCode('') }} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            Cancelar
          </button>
        </div>
      )}

      {step === 'enabled' && (
        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">2FA activado</p>
              <p className="text-xs text-green-600 dark:text-green-400">Tu cuenta tiene protección adicional</p>
            </div>
          </div>
          <button
            onClick={disable}
            className="text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
            disabled={loading}
          >
            Desactivar
          </button>
        </div>
      )}

      {error && step !== 'setup' && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
