import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled'
const BIOMETRICS_EMAIL_KEY = 'biometrics_email'
const BIOMETRICS_TOKENS_KEY = 'biometrics_tokens'

interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export async function isBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync()
  const enrolled = await LocalAuthentication.isEnrolledAsync()
  return compatible && enrolled
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY)
  return value === 'true'
}

export async function enableBiometrics(
  email: string,
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true')
  await SecureStore.setItemAsync(BIOMETRICS_EMAIL_KEY, email)
  await SecureStore.setItemAsync(
    BIOMETRICS_TOKENS_KEY,
    JSON.stringify({ accessToken, refreshToken } satisfies StoredTokens)
  )
}

export async function disableBiometrics(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(BIOMETRICS_ENABLED_KEY),
    SecureStore.deleteItemAsync(BIOMETRICS_EMAIL_KEY),
    SecureStore.deleteItemAsync(BIOMETRICS_TOKENS_KEY),
  ])
}

export async function updateBiometricTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const enabled = await isBiometricsEnabled()
  if (!enabled) return
  await SecureStore.setItemAsync(
    BIOMETRICS_TOKENS_KEY,
    JSON.stringify({ accessToken, refreshToken } satisfies StoredTokens)
  )
}

export async function getBiometricTokens(): Promise<StoredTokens | null> {
  const raw = await SecureStore.getItemAsync(BIOMETRICS_TOKENS_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredTokens
  } catch {
    return null
  }
}

export async function getBiometricEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(BIOMETRICS_EMAIL_KEY)
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirma tu identidad para acceder',
    fallbackLabel: 'Usar contraseña',
    cancelLabel: 'Cancelar',
  })
  return result.success
}
