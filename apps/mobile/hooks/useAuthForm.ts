import { useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { z } from 'zod'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import {
  initAuthAttempts,
  getLockRemainingMs,
  registerAuthFailure,
  clearAuthFailures,
  formatRemainingMinutes,
} from '@/lib/auth-attempts'
import {
  isBiometricsAvailable,
  isBiometricsEnabled,
  enableBiometrics,
  disableBiometrics,
  authenticateWithBiometrics,
  getBiometricTokens,
} from '@/lib/biometrics'

const TERMS_VERSION = '2026-04'

export const PASSWORD_CRITERIA = [
  { key: 'minLength', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
  { key: 'special', label: 'Al menos un símbolo', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^\+?[\d]{7,15}$/.test(cleaned)
}

const emailSchema = z.string().trim().email('Introduce un correo electrónico válido.')

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Introduce tu contraseña.'),
})

const registerStep1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Introduce tu nombre completo.')
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length >= 2, {
      message: 'Introduce al menos nombre y un apellido.',
    }),
  phone: z
    .string()
    .min(1, 'Introduce un número de teléfono.')
    .refine(isValidPhone, { message: 'Número de teléfono no válido.' }),
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
    email: emailSchema,
    phone: z
      .string()
      .min(1, 'Introduce un número de teléfono.')
      .refine(isValidPhone, { message: 'Número de teléfono no válido.' }),
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

export function useAuthForm() {
  const [registerStep, setRegisterStep] = useState<1 | 2>(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [resendConfirmationLoading, setResendConfirmationLoading] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    void initAuthAttempts()
  }, [])

  const normalizedFullName = fullName.trim().replace(/\s+/g, ' ')
  const hasValidFullName = normalizedFullName.split(' ').filter(Boolean).length >= 2
  const hasValidPhone = isValidPhone(phone)
  const isEmailValid = emailSchema.safeParse(email.trim()).success
  const criteriaResults = PASSWORD_CRITERIA.map((c) => ({ ...c, met: c.test(password) }))
  const passwordScore = criteriaResults.filter((c) => c.met).length
  const passwordsMatch = password === confirmPassword

  function resetForm(): void {
    setRegisterStep(1)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setPhone('')
    setRole('user')
    setAcceptTerms(false)
    setError('')
    setSuccess('')
    setFieldErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowResendConfirmation(false)
  }

  function handleNextStep(): void {
    const parsed = registerStep1Schema.safeParse({ fullName, phone })
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      setFieldErrors({
        fullName: fe.fullName?.[0] ?? '',
        phone: fe.phone?.[0] ?? '',
      })
      return
    }
    setFieldErrors({})
    setRegisterStep(2)
  }

  async function handleLogin(): Promise<void> {
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
      const parsed = loginSchema.safeParse({ email: email.trim(), password })
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
          setError('Debes confirmar tu correo antes de iniciar sesión.')
          setShowResendConfirmation(true)
        } else {
          setError('Credenciales incorrectas. Revisa tu email y contraseña.')
        }
        return
      }

      clearAuthFailures('login')

      // Offer biometrics after first successful login
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const available = await isBiometricsAvailable()
        const alreadyEnabled = await isBiometricsEnabled()
        if (available && !alreadyEnabled) {
          const biometricType = Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Huella dactilar'
          Alert.alert(
            `Activar ${biometricType}`,
            `¿Quieres usar ${biometricType} para entrar más rápido la próxima vez?`,
            [
              { text: 'Ahora no', style: 'cancel' },
              {
                text: 'Activar',
                onPress: async () => {
                  await enableBiometrics(parsed.data.email, session.access_token, session.refresh_token)
                },
              },
            ]
          )
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
    } catch {
      setError('Error de conexión. Comprueba tu conexión e inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(): Promise<void> {
    if (loading) return
    const lockRemaining = getLockRemainingMs('register')
    if (lockRemaining > 0) {
      setError(`Demasiados intentos. Vuelve a intentarlo en ${formatRemainingMinutes(lockRemaining)} min.`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFieldErrors({})

    const parsed = registerSchema.safeParse({
      fullName,
      email: email.trim(),
      phone,
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
          emailRedirectTo: Linking.createURL('/auth/callback'),
        },
      })

      if (signUpError) {
        registerAuthFailure('register')
        const msg = signUpError.message?.toLowerCase() ?? ''
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
          setError('Ya existe una cuenta con ese correo. ¿Quieres iniciar sesión?')
        } else {
          setError('No se pudo crear la cuenta con esos datos. Revisa la información e inténtalo de nuevo.')
        }
        return
      }

      clearAuthFailures('register')

      if (data.user && !data.session) {
        // @ts-expect-error — new route not yet in generated typed-routes manifest
        router.replace({ pathname: '/(auth)/register-success', params: { email: parsed.data.email } })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: normalizedFullName, phone: parsed.data.phone })
          .eq('id', user.id)
      }
      router.replace(role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
    } catch {
      setError('No se pudo completar el registro. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(): Promise<void> {
    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) {
      setFieldErrors({ email: 'Introduce un correo electrónico válido para recuperar contraseña.' })
      return
    }

    setForgotPasswordLoading(true)
    setError('')
    setSuccess('')
    try {
      const redirectUrl = Linking.createURL('/auth/callback')
      await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${redirectUrl}?type=recovery`,
      })
      setSuccess('Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.')
    } catch {
      setError('No hemos podido enviar el correo de recuperación. Inténtalo de nuevo.')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  async function handleResendConfirmation(): Promise<void> {
    const parsed = emailSchema.safeParse(email.trim())
    if (!parsed.success) {
      setFieldErrors((cur) => ({ ...cur, email: 'Introduce un correo válido para reenviar confirmación.' }))
      return
    }

    setResendConfirmationLoading(true)
    setError('')
    setSuccess('')
    try {
      await supabase.auth.resend({ type: 'signup', email: parsed.data })
      setSuccess('Si el correo está pendiente, reenviamos el enlace de confirmación.')
    } catch {
      setError('No se pudo reenviar el correo de confirmación. Inténtalo de nuevo.')
    } finally {
      setResendConfirmationLoading(false)
    }
  }

  async function handleGoogleOAuth(): Promise<void> {
    try {
      const redirectUrl = Linking.createURL('/auth/callback')
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      })
      if (oauthError || !data?.url) {
        setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.')
        return
      }
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)
      if (result.type !== 'success') return
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url)
      if (sessionError || !sessionData.user) {
        setError('No se pudo completar el inicio de sesión con Google.')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData.user.id)
        .single()
      router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
    } catch {
      setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.')
    }
  }

  async function handleAppleOAuth(): Promise<void> {
    if (Platform.OS !== 'ios') return
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (!credential.identityToken) {
        setError('No se pudo obtener el token de Apple.')
        return
      }
      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })
      if (signInError || !data.user) {
        setError('No se pudo iniciar sesión con Apple. Inténtalo de nuevo.')
        return
      }
      // Sync name from Apple credential (only available on first sign-in)
      if (credential.fullName?.givenName) {
        const fullNameApple = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ')
        await supabase.from('profiles').update({ full_name: fullNameApple }).eq('id', data.user.id)
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'ERR_REQUEST_CANCELED') return // User cancelled — not an error
      setError('No se pudo iniciar sesión con Apple. Inténtalo de nuevo.')
    }
  }

  async function handleBiometricLogin(): Promise<void> {
    try {
      const success = await authenticateWithBiometrics()
      if (!success) return

      const tokens = await getBiometricTokens()
      if (!tokens) {
        await disableBiometrics()
        setError('Sesión biométrica expirada. Inicia sesión con tu contraseña.')
        return
      }

      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      })
      if (sessionError || !data.session) {
        await disableBiometrics()
        setError('La sesión ha expirado. Por favor inicia sesión con tu contraseña.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single()
      router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
    } catch {
      setError('No se pudo autenticar con biometría. Inténtalo de nuevo.')
    }
  }

  return {
    registerStep, setRegisterStep,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    fullName, setFullName,
    phone, setPhone,
    role, setRole,
    acceptTerms, setAcceptTerms,
    error, success,
    loading,
    forgotPasswordLoading,
    resendConfirmationLoading,
    showResendConfirmation,
    fieldErrors,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    normalizedFullName,
    hasValidFullName,
    hasValidPhone,
    isEmailValid,
    criteriaResults,
    passwordScore,
    passwordsMatch,
    resetForm,
    handleNextStep,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResendConfirmation,
    handleGoogleOAuth,
    handleAppleOAuth,
    handleBiometricLogin,
  }
}

export type AuthFormState = ReturnType<typeof useAuthForm>
