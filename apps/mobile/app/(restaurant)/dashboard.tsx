import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function RestaurantDashboard() {
  const { session } = useAuth()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) loadData()
  }, [session])

  async function loadData() {
    const { data: r } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', session!.user.id)
      .single()

    setRestaurant(r)

    if (r) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { count: tc } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', r.id)
        .eq('date', today)
        .neq('status', 'cancelled')

      const { count: ac } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', r.id)
        .neq('status', 'cancelled')

      setTodayCount(tc ?? 0)
      setTotalCount(ac ?? 0)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  const isActive = restaurant?.subscription_status === 'active'

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-primary-500 px-6 py-8">
        <Text className="text-white text-2xl font-bold">
          {restaurant?.name ?? 'Mi Restaurante'}
        </Text>
        <View
          className={`mt-2 self-start px-3 py-1 rounded-full flex-row items-center gap-2 ${
            isActive ? 'bg-green-400/30' : 'bg-red-400/30'
          }`}
        >
          <View className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-300' : 'bg-red-300'}`} />
          <Text className="text-white text-xs font-semibold">
            {isActive ? 'Suscripción activa' : 'Suscripción inactiva'}
          </Text>
        </View>
      </View>

      <View className="px-4 py-6 space-y-4">
        {/* Stats */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">{todayCount}</Text>
            <Text className="text-gray-500 text-sm">Reservas hoy</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">{totalCount}</Text>
            <Text className="text-gray-500 text-sm">Total reservas</Text>
          </View>
        </View>

        {!isActive && (
          <View className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <Text className="font-semibold text-orange-800">
              ⚠️ Restaurante inactivo
            </Text>
            <Text className="text-orange-600 text-sm mt-1">
              Tu restaurante no aparece en la app hasta que actives la suscripción de 100€/mes.
            </Text>
          </View>
        )}

        {/* Acciones */}
        <Text className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          Gestión
        </Text>
        {[
          { icon: '✏️', title: 'Editar restaurante', route: '/(restaurant)/edit' },
          { icon: '🕐', title: 'Horarios de reserva', route: '/(restaurant)/hours' },
          { icon: '📋', title: 'Ver reservas', route: '/(restaurant)/reservations' },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => router.push(item.route as any)}
            className="bg-white rounded-2xl p-4 flex-row items-center gap-4 border border-gray-100"
          >
            <Text className="text-2xl">{item.icon}</Text>
            <Text className="font-semibold text-gray-900 flex-1">{item.title}</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={async () => { await supabase.auth.signOut(); router.replace('/(auth)/') }}
          className="py-3 items-center border border-gray-200 rounded-xl mt-4"
        >
          <Text className="text-gray-500 font-medium">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
