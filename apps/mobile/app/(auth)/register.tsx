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
import { useAuthForm, PASSWORD_CRITERIA } from '@/hooks/useAuthForm'

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

export default function RegisterScreen() {
  const {
    registerStep, setRegisterStep,
    fullName, setFullName,
    phone, setPhone,
    role, setRole,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    acceptTerms, setAcceptTerms,
    loading,
    error,
    fieldErrors,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    hasValidFullName,
    hasValidPhone,
    isEmailValid,
    criteriaResults,
    passwordScore,
    passwordsMatch,
    handleNextStep,
    handleRegister,
    handleGoogleOAuth,
    handleAppleOAuth,
  } = useAuthForm()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-16 pb-12">
          <TouchableOpacity
            onPress={() => registerStep === 2 ? setRegisterStep(1) : router.back()}
            className="mb-6 flex-row items-center gap-1"
          >
            <Ionicons name="chevron-back" size={18} color="#ea580c" />
            <Text className="text-primary-600 font-medium">
              {registerStep === 2 ? 'Atrás' : 'Volver'}
            </Text>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-5">Crear cuenta</Text>

          {/* Indicador de pasos */}
          <View className="flex-row items-center gap-2 mb-6">
            {([1, 2] as const).map((step) => (
              <View key={step} className="flex-row items-center gap-2">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${registerStep >= step ? 'bg-primary-500' : 'bg-gray-200'}`}
                >
                  {registerStep > step ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Text className={`text-xs font-bold ${registerStep >= step ? 'text-white' : 'text-gray-400'}`}>
                      {step}
                    </Text>
                  )}
                </View>
                <Text className={`text-xs ${registerStep >= step ? 'text-gray-700' : 'text-gray-400'}`}>
                  {step === 1 ? 'Datos personales' : 'Acceso'}
                </Text>
                {step < 2 && <View className="w-8 h-px bg-gray-200 mx-1" />}
              </View>
            ))}
          </View>

          {error ? (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* PASO 1: nombre, teléfono, rol */}
          {registerStep === 1 && (
            <View className="gap-4">
              <TouchableOpacity
                onPress={handleGoogleOAuth}
                className="flex-row items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl mb-2"
              >
                <AntDesign name="google" size={18} color="#4285F4" />
                <Text className="text-sm font-medium text-gray-700">Continuar con Google</Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={{ width: '100%', height: 44, marginBottom: 8 }}
                  onPress={handleAppleOAuth}
                />
              )}

              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="text-xs text-gray-400">o completa el formulario</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Nombre completo</Text>
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 ${fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="Ej: Juan Pérez Gómez"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
                {fieldErrors.fullName ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</Text>
                ) : fullName.length > 0 && !hasValidFullName ? (
                  <Text className="mt-1 text-xs text-red-600">Introduce al menos nombre y un apellido.</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Teléfono <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`border rounded-xl px-4 py-3 text-gray-900 bg-gray-50 ${fieldErrors.phone ? 'border-red-400' : 'border-gray-200'}`}
                  placeholder="+34 600 000 000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                {fieldErrors.phone ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.phone}</Text>
                ) : phone.length > 0 && !hasValidPhone ? (
                  <Text className="mt-1 text-xs text-red-600">Número de teléfono no válido.</Text>
                ) : null}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</Text>
                <View className="flex-row gap-3">
                  {(['user', 'restaurant'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      className={`flex-1 py-3 rounded-xl border-2 items-center ${role === r ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                    >
                      <Text className={`font-semibold text-sm ${role === r ? 'text-primary-700' : 'text-gray-500'}`}>
                        {r === 'user' ? '👤 Cliente' : '🍽️ Restaurante'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleNextStep}
                className="bg-primary-500 rounded-xl py-4 flex-row items-center justify-center gap-2 mt-1"
              >
                <Text className="text-white font-bold text-base">Siguiente</Text>
                <Ionicons name="chevron-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* PASO 2: email, contraseña, términos */}
          {registerStep === 2 && (
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
                ) : email.length > 0 && !isEmailValid ? (
                  <Text className="mt-1 text-xs text-red-600">Introduce un correo válido.</Text>
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

                {password.length > 0 && (
                  <View className="mt-3 gap-2">
                    <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${(passwordScore / 5) * 100}%`,
                          backgroundColor: strengthColor(passwordScore),
                        }}
                      />
                    </View>
                    <Text className="text-xs text-gray-600">
                      Seguridad:{' '}
                      <Text className="font-semibold">{strengthLabel(passwordScore)}</Text>
                    </Text>
                    <View className="gap-1">
                      {criteriaResults.map(({ key, label, met }) => (
                        <View key={key} className="flex-row items-center gap-1.5">
                          <Text className={met ? 'text-green-600' : 'text-gray-400'}>
                            {met ? '✓' : '○'}
                          </Text>
                          <Text className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</Text>
                <View className={`flex-row items-center border rounded-xl bg-gray-50 ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}>
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-900"
                    placeholder="Repite tu contraseña"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="px-3"
                    accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
                {fieldErrors.confirmPassword ? (
                  <Text className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</Text>
                ) : confirmPassword.length > 0 && !passwordsMatch ? (
                  <Text className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => setAcceptTerms(!acceptTerms)}
                className="flex-row items-start gap-2"
                activeOpacity={0.7}
              >
                <View
                  className={`w-5 h-5 rounded border-2 mt-0.5 items-center justify-center ${acceptTerms ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}
                >
                  {acceptTerms && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text className="flex-1 text-sm text-gray-700">
                  Acepto los{' '}
                  <Text className="text-primary-600">Términos</Text>
                  {' '}y la{' '}
                  <Text className="text-primary-600">Política de Privacidad</Text>.
                </Text>
              </TouchableOpacity>
              {fieldErrors.acceptTerms ? (
                <Text className="-mt-2 text-xs text-red-600">{fieldErrors.acceptTerms}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                className="bg-primary-500 rounded-xl py-4 items-center mt-1"
              >
                <Text className="text-white font-bold text-base">
                  {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Text>
              </TouchableOpacity>

              {role === 'restaurant' && (
                <Text className="text-xs text-gray-400 text-center">
                  Las cuentas de restaurante requieren suscripción para activarse.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
