import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      Alert.alert('Error', 'Credenciales incorrectas')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .single()

    router.replace(profile?.role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)/')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-primary-500"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-1 items-center justify-center px-6 pt-20 pb-10">
          <Text className="text-6xl mb-4">🍽️</Text>
          <Text className="text-3xl font-bold text-white">ReservApp</Text>
          <Text className="text-white/80 mt-2 text-center">
            Moncofa · Nules · La Vall d'Uixó
          </Text>
        </View>

        {/* Formulario */}
        <View className="bg-white rounded-t-3xl px-6 pt-8 pb-12">
          <Text className="text-2xl font-bold text-gray-900 mb-6">Iniciar sesión</Text>

          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-primary-500 rounded-xl py-4 items-center mt-2"
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Entrando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              className="py-3 items-center"
            >
              <Text className="text-gray-500 text-sm">
                ¿No tienes cuenta?{' '}
                <Text className="text-primary-600 font-semibold">Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
