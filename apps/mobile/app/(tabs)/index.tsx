import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import { LOCATIONS } from '@repo/shared'

const LOCATION_EMOJIS: Record<string, string> = {
  moncofa: '🏖️',
  nules: '🏘️',
  'la-vall-duixo': '🏔️',
}

export default function HomeScreen() {
  const { profile } = useAuth()
  const { nearestLocation, permissionDenied, requestLocation } = useLocation()

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-primary-500 px-6 pb-8 pt-6">
        <Text className="text-white text-2xl font-bold">
          ¡Hola, {profile?.full_name?.split(' ')[0] ?? 'bienvenido'}! 👋
        </Text>
        <Text className="text-white/80 mt-1">¿Dónde quieres comer hoy?</Text>

        {nearestLocation && !permissionDenied && (
          <View className="mt-3 bg-white/20 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
            <Text className="text-white text-sm">
              📍 Estás cerca de{' '}
              <Text className="font-semibold">
                {LOCATIONS.find((l) => l.slug === nearestLocation)?.name}
              </Text>
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 py-6 space-y-3">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
          Elige localización
        </Text>

        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            onPress={() => router.push(`/(tabs)/restaurants?location=${loc.slug}`)}
            className={`bg-white rounded-2xl p-5 border-2 flex-row items-center justify-between shadow-sm ${
              nearestLocation === loc.slug ? 'border-primary-400' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center gap-4">
              <Text className="text-3xl">{LOCATION_EMOJIS[loc.slug]}</Text>
              <View>
                <Text className="text-gray-900 font-bold text-lg">{loc.name}</Text>
                {nearestLocation === loc.slug && (
                  <Text className="text-primary-500 text-xs font-medium">📍 Cerca de ti</Text>
                )}
              </View>
            </View>
            <Text className="text-gray-400 text-xl">→</Text>
          </TouchableOpacity>
        ))}

        {permissionDenied && (
          <TouchableOpacity
            onPress={requestLocation}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex-row items-center gap-3"
          >
            <Text className="text-orange-500 text-xl">📍</Text>
            <View className="flex-1">
              <Text className="text-orange-700 font-semibold text-sm">
                Activa la ubicación
              </Text>
              <Text className="text-orange-500 text-xs mt-0.5">
                Para ver restaurantes cercanos a ti
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/calendar')}
          className="bg-white rounded-2xl p-5 border border-gray-100 flex-row items-center gap-4 mt-2"
        >
          <Text className="text-3xl">📅</Text>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Ver disponibilidad</Text>
            <Text className="text-gray-500 text-sm">Consulta por fecha qué tiene hueco</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
