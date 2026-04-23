import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { generateTimeSlots } from '@repo/shared'
import { TimeSlot } from '@repo/shared'

export default function RestaurantDetailScreen() {
  const { id, date: initialDate } = useLocalSearchParams<{ id: string; date?: string }>()

  const today = format(new Date(), 'yyyy-MM-dd')
  const [restaurant, setRestaurant] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(initialDate ?? today)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(2)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  const availableDates = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i), 'yyyy-MM-dd')
  )

  useEffect(() => {
    loadRestaurant()
  }, [id])

  useEffect(() => {
    if (restaurant) loadSlots()
  }, [selectedDate, restaurant])

  async function loadRestaurant() {
    const { data } = await supabase
      .from('restaurants')
      .select('*, location:locations(*)')
      .eq('id', id)
      .single()
    setRestaurant(data)
    setLoading(false)
  }

  async function loadSlots() {
    const dayOfWeek = new Date(selectedDate + 'T12:00:00').getDay()
    const { data: hours } = await supabase
      .from('restaurant_hours')
      .select('*')
      .eq('restaurant_id', id)
      .eq('day_of_week', dayOfWeek)
      .single()

    if (!hours) { setSlots([]); return }

    const { data: existing } = await supabase
      .from('reservations')
      .select('time')
      .eq('restaurant_id', id)
      .eq('date', selectedDate)
      .neq('status', 'cancelled')

    const countsByTime: Record<string, number> = {}
    for (const r of existing ?? []) {
      const t = String(r.time).slice(0, 5)
      countsByTime[t] = (countsByTime[t] ?? 0) + 1
    }

    setSlots(generateTimeSlots(hours, countsByTime))
    setSelectedTime(null)
  }

  async function handleBooking() {
    if (!selectedTime) return
    setBooking(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: user!.id,
        restaurant_id: id,
        date: selectedDate,
        time: selectedTime,
        party_size: partySize,
        notes,
      })
      .select()
      .single()

    setBooking(false)

    if (error) {
      Alert.alert('Error', 'No se pudo realizar la reserva')
      return
    }

    Alert.alert(
      '¡Reserva confirmada! 🎉',
      `${restaurant.name} · ${format(new Date(selectedDate + 'T12:00:00'), "d 'de' MMMM", { locale: es })} · ${selectedTime} · ${partySize} personas`,
      [{ text: 'Ver mis reservas', onPress: () => router.push('/(tabs)/profile') }]
    )
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: restaurant?.name ?? '' }} />
      <ScrollView className="flex-1 bg-gray-50">
        {/* Imagen */}
        {restaurant?.image_url ? (
          <Image
            source={{ uri: restaurant.image_url }}
            className="w-full h-52"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-52 bg-primary-100 items-center justify-center">
            <Text className="text-6xl">🍽️</Text>
          </View>
        )}

        <View className="p-4 space-y-6">
          {/* Info restaurante */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">{restaurant?.name}</Text>
            <Text className="text-gray-500 mt-1">📍 {restaurant?.location?.name}</Text>
            {restaurant?.address && (
              <Text className="text-gray-500 text-sm">{restaurant.address}</Text>
            )}
            {restaurant?.description && (
              <Text className="text-gray-600 mt-3">{restaurant.description}</Text>
            )}
            <View className="flex-row gap-3 mt-4">
              {restaurant?.menu_url && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(restaurant.menu_url)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 items-center"
                >
                  <Text className="text-gray-700 font-medium text-sm">📋 Ver carta</Text>
                </TouchableOpacity>
              )}
              {restaurant?.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${restaurant.phone}`)}
                  className="flex-1 border border-gray-200 rounded-xl py-2.5 items-center"
                >
                  <Text className="text-gray-700 font-medium text-sm">📞 Llamar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Selección de fecha */}
          <View>
            <Text className="font-semibold text-gray-700 mb-3">Elige fecha</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {availableDates.map((d) => {
                  const dateObj = new Date(d + 'T12:00:00')
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setSelectedDate(d)}
                      className={`items-center px-4 py-3 rounded-xl border-2 min-w-[56px] ${
                        selectedDate === d
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium uppercase ${
                          selectedDate === d ? 'text-primary-600' : 'text-gray-500'
                        }`}
                      >
                        {format(dateObj, 'EEE', { locale: es })}
                      </Text>
                      <Text
                        className={`text-xl font-bold ${
                          selectedDate === d ? 'text-primary-700' : 'text-gray-900'
                        }`}
                      >
                        {format(dateObj, 'd')}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Selección de hora */}
          <View>
            <Text className="font-semibold text-gray-700 mb-3">Elige hora</Text>
            {slots.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={slot.time}
                    disabled={!slot.available}
                    onPress={() => setSelectedTime(slot.time)}
                    className={`px-4 py-3 rounded-xl border-2 ${
                      selectedTime === slot.time
                        ? 'border-primary-500 bg-primary-50'
                        : slot.available
                        ? 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <Text
                      className={`font-medium text-sm ${
                        selectedTime === slot.time
                          ? 'text-primary-700'
                          : slot.available
                          ? 'text-gray-700'
                          : 'text-gray-300'
                      }`}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text className="text-gray-400 text-sm">Cerrado este día</Text>
            )}
          </View>

          {/* Número de personas */}
          <View>
            <Text className="font-semibold text-gray-700 mb-3">Personas</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 items-center justify-center"
              >
                <Text className="text-xl font-bold">−</Text>
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900 w-8 text-center">
                {partySize}
              </Text>
              <TouchableOpacity
                onPress={() => setPartySize((p) => Math.min(20, p + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 items-center justify-center"
              >
                <Text className="text-xl font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notas */}
          <View>
            <Text className="font-semibold text-gray-700 mb-2">Notas (opcional)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900"
              placeholder="Alergias, celebración especial..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Botón de reserva */}
          <TouchableOpacity
            onPress={handleBooking}
            disabled={!selectedTime || booking}
            className={`py-4 rounded-2xl items-center mb-8 ${
              selectedTime ? 'bg-primary-500' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`font-bold text-base ${selectedTime ? 'text-white' : 'text-gray-400'}`}
            >
              {booking
                ? 'Reservando...'
                : selectedTime
                ? `Confirmar — ${selectedTime}, ${partySize} personas`
                : 'Selecciona una hora'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  )
}
