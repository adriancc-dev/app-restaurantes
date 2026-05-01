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
import { useAuthForm } from '@/hooks/useAuthForm'

export default function ForgotPasswordScreen() {
  const {
    email, setEmail,
    fieldErrors,
    error, success,
    forgotPasswordLoading,
    handleForgotPassword,
  } = useAuthForm()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-16 pb-12">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1"
          >
            <Ionicons name="chevron-back" size={18} color="#ea580c" />
            <Text className="text-primary-600 font-medium">Volver al inicio de sesión</Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900">Recuperar contraseña</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </Text>

          {error ? (
            <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <Text className="text-green-700 text-sm">{success}</Text>
            </View>
          ) : null}

          {!success && (
            <View className="mt-6 gap-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Correo electrónico</Text>
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!forgotPasswordLoading}
                />
                {fieldErrors.email ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.email}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={forgotPasswordLoading}
                className="bg-primary-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">
                  {forgotPasswordLoading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {success && (
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 bg-primary-500 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-base">Volver al inicio de sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
