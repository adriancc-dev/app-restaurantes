import { useEffect, useState } from 'react'
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
import { Ionicons, AntDesign } from '@expo/vector-icons'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuthForm } from '@/hooks/useAuthForm'
import { isBiometricsAvailable, isBiometricsEnabled } from '@/lib/biometrics'

export default function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    loading,
    error, success,
    fieldErrors,
    showPassword, setShowPassword,
    showResendConfirmation,
    resendConfirmationLoading,
    handleLogin,
    handleResendConfirmation,
    handleGoogleOAuth,
    handleAppleOAuth,
    handleBiometricLogin,
  } = useAuthForm()

  const [biometricsReady, setBiometricsReady] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    async function checkBiometrics() {
      const available = await isBiometricsAvailable()
      const enabled = await isBiometricsEnabled()
      setBiometricsReady(available && enabled)
    }
    void checkBiometrics()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((v) => v - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  function onResendPress() {
    handleResendConfirmation()
    setResendCooldown(60)
  }

  const biometricLabel = Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Huella dactilar'
  const biometricIcon = Platform.OS === 'ios' ? 'finger-print' : 'finger-print'

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-primary-500"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center px-6 pt-20 pb-10">
          <Text className="text-6xl mb-4">🍽️</Text>
          <Text className="text-3xl font-bold text-white">ReservApp</Text>
          <Text className="text-white/80 mt-2 text-center">
            Moncofa · Nules · La Vall d'Uixó
          </Text>
        </View>

        <View className="bg-white rounded-t-3xl px-6 pt-8 pb-12">
          <Text className="text-2xl font-bold text-gray-900 mb-6">Iniciar sesión</Text>

          {/* Biometric login — shown when session was previously saved */}
          {biometricsReady && (
            <TouchableOpacity
              onPress={handleBiometricLogin}
              className="flex-row items-center justify-center gap-2 py-3 px-4 bg-gray-900 rounded-xl mb-3"
            >
              <Ionicons name={biometricIcon} size={20} color="white" />
              <Text className="text-sm font-semibold text-white">Entrar con {biometricLabel}</Text>
            </TouchableOpacity>
          )}

          {/* Social buttons */}
          <TouchableOpacity
            onPress={handleGoogleOAuth}
            className="flex-row items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl mb-2"
          >
            <AntDesign name="google" size={18} color="#4285F4" />
            <Text className="text-sm font-medium text-gray-700">Continuar con Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={{ width: '100%', height: 44 }}
              onPress={handleAppleOAuth}
            />
          )}

          <View className="flex-row items-center gap-3 my-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-xs text-gray-400">o continúa con tu correo</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {error ? (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <Text className="text-green-700 text-sm">{success}</Text>
            </View>
          ) : null}

          <View className="gap-4">
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
              />
              {fieldErrors.email ? (
                <Text className="mt-1 text-xs text-red-600">{fieldErrors.email}</Text>
              ) : null}
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña</Text>
              <View className={`flex-row items-center border rounded-xl bg-gray-50 ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'}`}>
                <TextInput
                  className="flex-1 px-4 py-3 text-gray-900"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-3"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text className="mt-1 text-xs text-red-600">{fieldErrors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className="bg-primary-500 rounded-xl py-4 items-center mt-1"
            >
              <Text className="text-white font-bold text-base">
                {loading ? 'Iniciando sesión...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <View className="flex-row flex-wrap items-center justify-between gap-2">
              {/* @ts-expect-error — new route not yet in generated typed-routes manifest */}
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-primary-600 text-sm">¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {showResendConfirmation && (
                <TouchableOpacity
                  onPress={resendCooldown > 0 ? undefined : onResendPress}
                  disabled={resendConfirmationLoading || resendCooldown > 0}
                >
                  <Text className={`text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-primary-600 underline'}`}>
                    {resendConfirmationLoading
                      ? 'Reenviando...'
                      : resendCooldown > 0
                      ? `Reenviar en ${resendCooldown}s`
                      : 'Reenviar confirmación'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

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
