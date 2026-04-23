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
  type KeyboardTypeOptions,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'

interface FormField {
  label: string
  value: string
  setter: (v: string) => void
  placeholder: string
  type: KeyboardTypeOptions
}

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'restaurant'>('user')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Error', 'Completa todos los campos')
      return
    }
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, full_name: fullName } },
    })

    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
    }

    setLoading(false)
    router.replace(role === 'restaurant' ? '/(restaurant)/dashboard' : '/(tabs)/')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-16 pb-12">
          <TouchableOpacity onPress={() => router.back()} className="mb-6">
            <Text className="text-primary-600 font-medium">← Volver</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</Text>

          {/* Tipo de cuenta */}
          <View className="flex-row gap-3 mb-5">
            {(['user', 'restaurant'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${
                  role === r ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <Text
                  className={`font-semibold text-sm ${
                    role === r ? 'text-primary-700' : 'text-gray-500'
                  }`}
                >
                  {r === 'user' ? '👤 Cliente' : '🍽️ Restaurante'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="space-y-4">
            {([
              { label: 'Nombre completo', value: fullName, setter: setFullName, placeholder: 'Tu nombre', type: 'default' },
              { label: 'Email', value: email, setter: setEmail, placeholder: 'tu@email.com', type: 'email-address' },
              { label: 'Teléfono', value: phone, setter: setPhone, placeholder: '600 000 000', type: 'phone-pad' },
            ] as FormField[]).map((field) => (
              <View key={field.label}>
                <Text className="text-sm font-medium text-gray-700 mb-1">{field.label}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                  placeholder={field.placeholder}
                  keyboardType={field.type}
                  autoCapitalize={field.type === 'default' ? 'words' : 'none'}
                  value={field.value}
                  onChangeText={field.setter}
                />
              </View>
            ))}

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="bg-primary-500 rounded-xl py-4 items-center mt-2"
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Text>
            </TouchableOpacity>

            {role === 'restaurant' && (
              <Text className="text-xs text-gray-400 text-center mt-2">
                Las cuentas de restaurante requieren suscripción de 100€/mes para activarse.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
