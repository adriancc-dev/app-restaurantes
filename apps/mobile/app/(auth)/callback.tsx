import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackScreen() {
  const url = Linking.useURL()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    void handleCallback(url)
  }, [url])

  async function handleCallback(callbackUrl: string): Promise<void> {
    try {
      const parsed = Linking.parse(callbackUrl)
      const type = parsed.queryParams?.type as string | undefined

      // PKCE flow (code en query params) — email confirmation y recovery
      const code = parsed.queryParams?.code as string | undefined
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(callbackUrl)
        if (exchangeError || !data.user) {
          setError('El enlace ha expirado o no es válido. Solicita uno nuevo.')
          return
        }
        if (type === 'recovery') {
          // @ts-expect-error — new route not yet in generated typed-routes manifest
          router.replace('/(auth)/reset-password')
          return
        }
        await navigateByRole(data.user.id)
        return
      }

      // Implicit flow — access_token en hash fragment
      const hash = callbackUrl.split('#')[1]
      if (hash) {
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type') ?? type
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (sessionError || !data.session) {
            setError('El enlace ha expirado o no es válido.')
            return
          }
          if (hashType === 'recovery') {
            // @ts-expect-error — new route not yet in generated typed-routes manifest
            router.replace('/(auth)/reset-password')
            return
          }
          await navigateByRole(data.session.user.id)
          return
        }
      }

      setError('Enlace no reconocido.')
    } catch {
      setError('Ha ocurrido un error inesperado.')
    }
  }

  async function navigateByRole(userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)')
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      {error ? (
        <>
          <Text className="text-6xl mb-4">❌</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Enlace no válido</Text>
          <Text className="text-gray-500 text-center text-sm mb-8">{error}</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)')}
            className="bg-primary-500 rounded-xl px-8 py-4"
          >
            <Text className="text-white font-bold">Volver al inicio de sesión</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="mt-4 text-gray-500">Verificando...</Text>
        </>
      )}
    </View>
  )
}
