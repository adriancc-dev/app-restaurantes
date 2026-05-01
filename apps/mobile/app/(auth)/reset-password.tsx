import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { PASSWORD_CRITERIA } from '@/hooks/useAuthForm'

const resetSchema = z
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
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

const strengthLabel = (score: number) =>
  score <= 1 ? 'Muy débil' :
  score <= 2 ? 'Débil' :
  score <= 3 ? 'Media' :
  score <= 4 ? 'Fuerte' : 'Muy fuerte'

const strengthColor = (score: number) =>
  score <= 1 ? '#ef4444' :
  score <= 2 ? '#f97316' :
  score <= 3 ? '#eab308' :
  score <= 4 ? '#84cc16' : '#16a34a'

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const criteriaResults = PASSWORD_CRITERIA.map((c) => ({ ...c, met: c.test(password) }))
  const passwordScore = criteriaResults.filter((c) => c.met).length
  const passwordsMatch = password === confirmPassword

  async function handleSubmit(): Promise<void> {
    if (loading) return
    setError('')
    setFieldErrors({})

    const parsed = resetSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      setFieldErrors({
        password: fe.password?.[0] ?? '',
        confirmPassword: fe.confirmPassword?.[0] ?? '',
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
      setTimeout(() => router.replace('/(auth)'), 2500)
    } catch {
      setError('Ha ocurrido un error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-primary-500"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center px-6 pt-16 pb-6">
          <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <Text className="text-3xl">🔐</Text>
          </View>
          <Text className="text-2xl font-bold text-white">Restablecer contraseña</Text>
          <Text className="text-white/80 text-sm mt-1 text-center">
            Elige una nueva contraseña segura
          </Text>
        </View>

        <View className="bg-white rounded-t-3xl px-6 pt-8 pb-12">
          {success ? (
            <View className="items-center py-8">
              <Text className="text-5xl mb-4">✅</Text>
              <Text className="text-lg font-bold text-gray-900">¡Contraseña actualizada!</Text>
              <Text className="text-gray-500 text-sm mt-2 text-center">
                Redirigiendo al inicio de sesión...
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {error ? (
                <View className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <Text className="text-red-700 text-sm">{error}</Text>
                </View>
              ) : null}

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Nueva contraseña</Text>
                <View className={`flex-row items-center border rounded-xl bg-gray-50 ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}>
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-900"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {fieldErrors.password ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.password}</Text>
                ) : null}

                {password.length > 0 && (
                  <View className="mt-3 gap-2">
                    <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${(passwordScore / 5) * 100}%`, backgroundColor: strengthColor(passwordScore) }}
                      />
                    </View>
                    <Text className="text-xs text-gray-600">
                      Seguridad: <Text className="font-semibold">{strengthLabel(passwordScore)}</Text>
                    </Text>
                    <View className="gap-1">
                      {criteriaResults.map(({ key, label, met }) => (
                        <View key={key} className="flex-row items-center gap-1.5">
                          <Text className={met ? 'text-green-600' : 'text-gray-400'}>{met ? '✓' : '○'}</Text>
                          <Text className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</Text>
                <View className={`flex-row items-center border rounded-xl bg-gray-50 ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}>
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-900"
                    placeholder="Repite tu nueva contraseña"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="px-3">
                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
                {fieldErrors.confirmPassword ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</Text>
                ) : confirmPassword.length > 0 && !passwordsMatch ? (
                  <Text className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="bg-primary-500 rounded-xl py-4 items-center mt-1"
              >
                <Text className="text-white font-bold text-base">
                  {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
