import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { router } from 'expo-router'
import { format, getDay } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Restaurant } from '@repo/shared'

export default function CalendarScreen() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)

  async function handleDayPress(day: DateData) {
    if (day.dateString < today) return
    setSelectedDate(day.dateString)
    loadRestaurantsForDate(day.dateString)
  }

  async function loadRestaurantsForDate(dateStr: string) {
    setLoading(true)
    const dayOfWeek = getDay(new Date(dateStr + 'T12:00:00'))

    const { data: openHours } = await supabase
      .from('restaurant_hours')
      .select('restaurant_id, max_capacity, slot_duration, open_time, close_time')
      .eq('day_of_week', dayOfWeek)
      .eq('is_open', true)

    if (!openHours?.length) {
      setRestaurants([])
      setLoading(false)
      return
    }

    const restaurantIds = openHours.map((h) => h.restaurant_id)

    const { data: counts } = await supabase
      .from('reservations')
      .select('restaurant_id')
      .eq('date', dateStr)
      .in('restaurant_id', restaurantIds)
      .neq('status', 'cancelled')

    const countMap: Record<string, number> = {}
    for (const c of counts ?? []) {
      countMap[c.restaurant_id] = (countMap[c.restaurant_id] ?? 0) + 1
    }

    const availableIds = openHours
      .filter((h) => {
        const slots = Math.floor(
          (toMinutes(h.close_time) - toMinutes(h.open_time)) / h.slot_duration
        )
        return (countMap[h.restaurant_id] ?? 0) < slots * h.max_capacity
      })
      .map((h) => h.restaurant_id)

    const { data: result } = await supabase
      .from('restaurants')
      .select('*, location:locations(*)')
      .in('id', availableIds)
      .eq('is_active', true)

    setRestaurants(result ?? [])
    setLoading(false)
  }

  const markedDates = selectedDate
    ? { [selectedDate]: { selected: true, selectedColor: '#f97316' } }
    : {}

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Calendar
        onDayPress={handleDayPress}
        minDate={today}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#f97316',
          arrowColor: '#f97316',
          selectedDayBackgroundColor: '#f97316',
          dotColor: '#f97316',
          textDayFontWeight: '500',
        }}
      />

      <View className="px-4 py-6">
        {selectedDate ? (
          <>
            <Text className="font-semibold text-gray-700 mb-4">
              Disponible el{' '}
              <Text className="text-primary-600">
                {format(new Date(selectedDate + 'T12:00:00'), 'd/MM/yyyy')}
              </Text>
            </Text>

            {loading ? (
              <ActivityIndicator color="#f97316" />
            ) : restaurants.length > 0 ? (
              <View className="space-y-3">
                {restaurants.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => router.push(`/restaurant/${r.id}?date=${selectedDate}`)}
                    className="bg-white rounded-2xl p-4 flex-row items-center gap-4 shadow-sm border border-gray-100"
                  >
                    {r.image_url ? (
                      <Image
                        source={{ uri: r.image_url }}
                        className="w-16 h-16 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-xl bg-primary-100 items-center justify-center">
                        <Text className="text-2xl">🍽️</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">{r.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        📍 {r.location?.name}
                      </Text>
                      <Text className="text-green-600 text-xs font-medium mt-1">
                        ✓ Disponible
                      </Text>
                    </View>
                    <Text className="text-gray-400">→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center py-10">
                <Text className="text-3xl mb-2">😔</Text>
                <Text className="text-gray-500 font-medium">Sin disponibilidad</Text>
              </View>
            )}
          </>
        ) : (
          <View className="items-center py-10">
            <Text className="text-3xl mb-2">📅</Text>
            <Text className="text-gray-500 font-medium">Selecciona una fecha</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function toMinutes(time: string | null): number {
  if (!time) return 0
  const parts = time.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}
