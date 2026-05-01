'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { createClient } from '@/lib/supabase/client'
import {
  getLockRemainingMs,
  registerAuthFailure,
  clearAuthFailures,
  formatRemainingMinutes,
} from '@/lib/auth-attempts'

const TERMS_VERSION = '2026-04'

export const PASSWORD_CRITERIA = [
  { key: 'minLength', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'Al menos un símbolo', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

const loginSchema = z.object({
  email: z.string().trim().email('Introduce un correo electrónico válido.'),
  password: z.string().min(1, 'Introduce tu contraseña.'),
})

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Introduce tu nombre completo.')
      .refine((v) => v.trim().split(/\s+/).filter(Boolean).length >= 2, {
        message: 'Introduce al menos nombre y un apellido.',
      }),
    email: z.string().trim().email('Introduce un correo electrónico válido.'),
    phone: z
      .string()
      .min(1, 'Introduce un número de teléfono.')
      .refine((v) => isValidPhoneNumber(v), { message: 'Número no válido para el país seleccionado.' }),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[a-z]/, 'Incluye al menos una minúscula.')
      .regex(/\d/, 'Incluye al menos un número.')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un símbolo.'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, {
      message: 'Debes aceptar los Términos y la Política de Privacidad.',
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

export type AuthMode = 'login' | 'register' | 'forgot'

export function useAuthForm() {
  const supabase = useMemo(() => createClient(), [])

  const [mode, setMode] = useState<AuthMode>('login')
  const [registerStep, setRegisterStep] = useState<1 | 2>(1)
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [honeypot, setHoneypot] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [resendConfirmationLoading, setResendConfirmationLoading] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const normalizedEmail = email.trim()
  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ')
  const hasValidFullName = normalizedFullName.split(' ').filter(Boolean).length >= 2
  const hasValidPhone = typeof phone === 'string' && isValidPhoneNumber(phone)
  const isEmailValid = z.string().email().safeParse(normalizedEmail).success
  const criteriaResults = PASSWORD_CRITERIA.map((c) => ({ ...c, met: c.test(password) }))
  const passwordScore = criteriaResults.filter((c) => c.met).length
  const passwordsMatch = password === confirmPassword

  function switchMode(next: AuthMode) {
    setMode(next)
    setRegisterStep(1)
    setRegisterSuccess(false)
    setError('')
    setSuccess('')
    setFieldErrors({})
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowResendConfirmation(false)
  }

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) {
      errors.fullName = 'Introduce al menos nombre y un apellido.'
    }
    if (!phone || !isValidPhoneNumber(phone)) {
      errors.phone = 'Número no válido para el país seleccionado.'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setRegisterStep(2)
  }

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (loading) return
    const lockRemaining = getLockRemainingMs('login')
    if (lockRemaining > 0) {
      setError(`Demasiados intentos. Vuelve a intentarlo en ${formatRemainingMinutes(lockRemaining)} min.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})
    setShowResendConfirmation(false)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const parsed = loginSchema.safeParse({
        email: String(formData.get('email') ?? email),
        password: String(formData.get('password') ?? password),
      })
      if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors
        setFieldErrors({
          email: fe.email?.[0] ?? '',
          password: fe.password?.[0] ?? '',
        })
        return
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

      if (loginError || !data.user) {
        registerAuthFailure('login')
        if (loginError?.message?.toLowerCase().includes('email not confirmed')) {
          setError('Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.')
          setShowResendConfirmation(true)
        } else {
          setError('No se pudo iniciar sesión. Revisa tus credenciales.')
        }
        return
      }

      clearAuthFailures('login')
      setRedirecting(true)
      window.location.assign('/')
    } catch {
      setError('Error de conexión. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (loading) return
    if (honeypot) return

    const lockRemaining = getLockRemainingMs('register')
    if (lockRemaining > 0) {
      setError(`Demasiados intentos de registro. Vuelve a intentarlo en ${formatRemainingMinutes(lockRemaining)} min.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      phone: phone ?? '',
      password,
      confirmPassword,
      acceptTerms,
    })

    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      setFieldErrors({
        fullName: fe.fullName?.[0] ?? '',
        email: fe.email?.[0] ?? '',
        phone: fe.phone?.[0] ?? '',
        password: fe.password?.[0] ?? '',
        confirmPassword: fe.confirmPassword?.[0] ?? '',
        acceptTerms: fe.acceptTerms?.[0] ?? '',
      })
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          data: {
            role,
            full_name: parsed.data.fullName.trim().replace(/\s+/g, ' '),
            phone: parsed.data.phone,
            terms_accepted: true,
            terms_version: TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        registerAuthFailure('register')
        const msg = signUpError.message?.toLowerCase() ?? ''
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
          setError('Ya existe una cuenta con ese correo electrónico. ¿Quieres iniciar sesión?')
        } else {
          setError('No se pudo crear la cuenta con esos datos. Revisa la información e inténtalo de nuevo.')
        }
        return
      }

      clearAuthFailures('register')

      if (data.user && !data.session) {
        setRegisterSuccess(true)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user && (parsed.data.phone || normalizedFullName)) {
        await supabase
          .from('profiles')
          .update({ full_name: normalizedFullName, phone: parsed.data.phone })
          .eq('id', user.id)
      }
      setRedirecting(true)
      window.location.replace('/')
    } catch {
      setError('No se pudo completar el registro. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const parsed = loginSchema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) {
      setFieldErrors({ email: 'Introduce un correo electrónico válido para recuperar contraseña.' })
      return
    }

    setForgotPasswordLoading(true)
    setError('')
    setSuccess('')
    try {
      await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })
      setSuccess('Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.')
    } catch {
      setError('No hemos podido enviar el correo de recuperación. Inténtalo de nuevo.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  async function handleResendConfirmation(): Promise<void> {
    const parsed = loginSchema.pick({ email: true }).safeParse({ email })
    if (!parsed.success) {
      setFieldErrors((cur) => ({ ...cur, email: 'Introduce un correo válido para reenviar confirmación.' }))
      return
    }

    setResendConfirmationLoading(true)
    setError('')
    setSuccess('')
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: parsed.data.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setSuccess('Si el correo está pendiente, reenviamos el enlace de confirmación.')
    } catch {
      setError('No se pudo reenviar el correo de confirmación. Inténtalo de nuevo.')
    } finally {
      setResendConfirmationLoading(false)
    }
  }

  async function handleGoogleOAuth(): Promise<void> {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
    } catch {
      setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.')
    }
  }

  return {
    mode,
    registerStep,
    registerSuccess,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    fullName, setFullName,
    phone, setPhone,
    role, setRole,
    acceptTerms, setAcceptTerms,
    honeypot, setHoneypot,
    error, success,
    loading,
    forgotPasswordLoading,
    resendConfirmationLoading,
    showResendConfirmation,
    fieldErrors,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    redirecting,
    normalizedEmail,
    normalizedFullName,
    hasValidFullName,
    hasValidPhone,
    isEmailValid,
    criteriaResults,
    passwordScore,
    passwordsMatch,
    switchMode,
    handleNextStep,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResendConfirmation,
    handleGoogleOAuth,
  }
}

export type AuthFormState = ReturnType<typeof useAuthForm>
