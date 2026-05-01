import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function RegisterSuccessScreen() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown((v) => v - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleResend(): Promise<void> {
    if (!email || resendLoading || cooldown > 0) return
    setResendLoading(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
      setResendSuccess(true)
      setCooldown(60)
    } catch {
      setResendSuccess(false)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
        <Text className="text-3xl">✓</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">¡Cuenta creada!</Text>
      <Text className="text-gray-500 text-center mb-1">
        Hemos enviado un correo de confirmación a:
      </Text>
      <Text className="font-semibold text-gray-900 mb-6 text-center">{email}</Text>
      <Text className="text-gray-500 text-center text-sm mb-8">
        Revisa tu bandeja de entrada y confirma tu correo para activar tu cuenta.
      </Text>

      {resendSuccess && (
        <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl w-full">
          <Text className="text-green-700 text-sm text-center">
            Correo de confirmación reenviado correctamente.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleResend}
        disabled={resendLoading || cooldown > 0}
        className={`w-full border rounded-xl py-4 items-center mb-3 ${cooldown > 0 ? 'border-gray-200' : 'border-primary-500'}`}
      >
        <Text className={`font-semibold text-base ${cooldown > 0 ? 'text-gray-400' : 'text-primary-600'}`}>
          {resendLoading
            ? 'Reenviando...'
            : cooldown > 0
            ? `Reenviar en ${cooldown}s`
            : 'Reenviar correo de confirmación'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/(auth)')}
        className="w-full bg-primary-500 rounded-xl py-4 items-center"
      >
        <Text className="text-white font-bold text-base">Volver al inicio de sesión</Text>
      </TouchableOpacity>
    </View>
  )
}
