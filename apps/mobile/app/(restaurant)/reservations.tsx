import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function RestaurantReservationsScreen() {
  const { session } = useAuth()
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'all'>('today')

  useEffect(() => {
    if (session) loadReservations()
  }, [session, filter])

  async function loadReservations() {
    setLoading(true)
    const { data: r } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', session!.user.id)
      .single()

    if (!r) { setLoading(false); return }

    const today = format(new Date(), 'yyyy-MM-dd')
    let query = supabase
      .from('reservations')
      .select('*, user:profiles(full_name, phone, email)')
      .eq('restaurant_id', r.id)
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (filter === 'today') query = query.eq('date', today)
    else if (filter === 'upcoming') query = query.gte('date', today)

    const { data } = await query.limit(50)
    setReservations(data ?? [])
    setLoading(false)
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filtros */}
      <View className="bg-white border-b border-gray-100 flex-row px-4 py-3 gap-2">
        {([['today', 'Hoy'], ['upcoming', 'Próximas'], ['all', 'Todas']] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            className={`flex-1 py-2 rounded-xl items-center border ${
              filter === key ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-sm font-medium ${filter === key ? 'text-white' : 'text-gray-600'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center gap-3">
                <View className="bg-primary-50 rounded-xl px-3 py-2 items-center">
                  <Text className="text-primary-600 font-bold">{String(item.time).slice(0, 5)}</Text>
                  <Text className="text-primary-400 text-xs">
                    {format(new Date(item.date + 'T12:00:00'), 'dd/MM')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900">
                    {item.user?.full_name ?? 'Sin nombre'} — {item.party_size} pers.
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {item.user?.phone ?? item.user?.email ?? ''}
                  </Text>
                  {item.notes && (
                    <Text className="text-gray-400 text-xs mt-0.5 italic">
                      &ldquo;{item.notes}&rdquo;
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-3xl mb-2">📋</Text>
              <Text className="text-gray-500 font-medium">No hay reservas</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
