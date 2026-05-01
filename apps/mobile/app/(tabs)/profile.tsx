import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  isBiometricsAvailable,
  isBiometricsEnabled,
  enableBiometrics,
  disableBiometrics,
} from '@/lib/biometrics'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!

export default function ProfileScreen() {
  const { session, profile } = useAuth()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [biometricsAvailable, setBiometricsAvailable] = useState(false)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (session) void loadReservations()
    void checkBiometrics()
  }, [session])

  async function loadReservations(): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('reservations')
      .select('*, restaurant:restaurants(name, image_url)')
      .eq('user_id', session!.user.id)
      .gte('date', today)
      .eq('status', 'confirmed')
      .order('date', { ascending: true })
      .limit(10)
    setReservations(data ?? [])
    setLoading(false)
  }

  async function checkBiometrics(): Promise<void> {
    const available = await isBiometricsAvailable()
    const enabled = await isBiometricsEnabled()
    setBiometricsAvailable(available)
    setBiometricsEnabled(enabled)
  }

  async function handleToggleBiometrics(value: boolean): Promise<void> {
    if (value) {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession && session?.user.email) {
        await enableBiometrics(
          session.user.email,
          currentSession.access_token,
          currentSession.refresh_token
        )
        setBiometricsEnabled(true)
      }
    } else {
      await disableBiometrics()
      setBiometricsEnabled(false)
    }
  }

  async function handleCancelReservation(id: string): Promise<void> {
    Alert.alert('Cancelar reserva', '¿Seguro que quieres cancelar esta reserva?', [
      { text: 'No' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id)
          void loadReservations()
        },
      },
    ])
  }

  async function handleLogout(): Promise<void> {
    await disableBiometrics()
    await supabase.auth.signOut()
    router.replace('/(auth)')
  }

  function confirmDeleteAccount(): void {
    Alert.alert(
      '¿Eliminar cuenta?',
      'Esta acción es irreversible. Se borrarán todos tus datos, reservas y suscripciones activas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar cuenta',
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ]
    )
  }

  async function handleDeleteAccount(): Promise<void> {
    setDeletingAccount(true)
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${currentSession?.access_token}` },
      })
      if (!res.ok) {
        Alert.alert('Error', 'No se pudo eliminar la cuenta. Inténtalo de nuevo.')
        return
      }
      await disableBiometrics()
      await supabase.auth.signOut()
      router.replace('/(auth)')
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la cuenta. Comprueba tu conexión.')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Perfil */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm border border-gray-100">
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-3xl">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-lg">
              {profile?.full_name ?? session?.user.email}
            </Text>
            <Text className="text-gray-500 text-sm">{session?.user.email}</Text>
            {profile?.phone && (
              <Text className="text-gray-500 text-sm">📞 {profile.phone}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Próximas reservas */}
      <View className="px-4 mt-6">
        <Text className="font-bold text-gray-900 text-lg mb-3">Próximas reservas</Text>

        {loading ? (
          <ActivityIndicator color="#f97316" />
        ) : reservations.length > 0 ? (
          <View className="gap-3">
            {reservations.map((r) => (
              <View key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary-50 rounded-xl px-3 py-2 items-center min-w-[56px]">
                    <Text className="text-primary-600 font-bold text-base">
                      {String(r.time).slice(0, 5)}
                    </Text>
                    <Text className="text-primary-400 text-xs">
                      {format(new Date(r.date + 'T12:00:00'), 'dd/MM')}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900">{r.restaurant?.name}</Text>
                    <Text className="text-gray-500 text-sm">
                      {r.party_size} personas{r.notes ? ` · ${r.notes}` : ''}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleCancelReservation(r.id)}
                  className="mt-3 py-2 border border-red-200 rounded-xl items-center"
                >
                  <Text className="text-red-500 text-sm font-medium">Cancelar reserva</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
            <Text className="text-3xl mb-2">📋</Text>
            <Text className="text-gray-500 font-medium">Sin reservas próximas</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="mt-3 bg-primary-500 px-5 py-2.5 rounded-xl"
            >
              <Text className="text-white font-semibold text-sm">Hacer una reserva</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Configuración */}
      <View className="px-4 mt-6">
        <Text className="font-bold text-gray-900 text-lg mb-3">Configuración</Text>

        {biometricsAvailable && (
          <View className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Ionicons name="finger-print" size={22} color="#f97316" />
              <View>
                <Text className="text-gray-900 font-medium text-sm">
                  {`Face ID / ${process.env.EXPO_OS === 'android' ? 'Huella' : 'Touch ID'}`}
                </Text>
                <Text className="text-gray-400 text-xs">Acceso biométrico</Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#e5e7eb', true: '#fb923c' }}
              thumbColor="white"
            />
          </View>
        )}
      </View>

      {/* Acciones de cuenta */}
      <View className="px-4 mt-4 mb-12 gap-2">
        <TouchableOpacity
          onPress={handleLogout}
          className="py-3.5 items-center border border-gray-200 rounded-xl bg-white"
        >
          <Text className="text-gray-600 font-medium">Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirmDeleteAccount}
          disabled={deletingAccount}
          className="py-3.5 items-center border border-red-200 rounded-xl"
        >
          <Text className="text-red-500 font-medium text-sm">
            {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
