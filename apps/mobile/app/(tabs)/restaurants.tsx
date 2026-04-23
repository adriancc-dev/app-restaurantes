import { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { LOCATIONS, Restaurant } from '@repo/shared'

export default function RestaurantsScreen() {
  const { location } = useLocalSearchParams<{ location?: string }>()
  const [selectedSlug, setSelectedSlug] = useState(location ?? '')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRestaurants()
  }, [selectedSlug])

  async function loadRestaurants() {
    setLoading(true)
    let query = supabase
      .from('restaurants')
      .select('*, location:locations(*)')
      .eq('is_active', true)
      .order('name')

    if (selectedSlug) {
      const loc = LOCATIONS.find((l) => l.slug === selectedSlug)
      if (loc) query = query.eq('location_id', loc.id)
    }

    const { data } = await query
    setRestaurants(data ?? [])
    setLoading(false)
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedSlug('')}
          className={`px-4 py-2 rounded-full border ${
            !selectedSlug ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={`text-sm font-medium ${!selectedSlug ? 'text-white' : 'text-gray-600'}`}>
            Todos
          </Text>
        </TouchableOpacity>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            onPress={() => setSelectedSlug(loc.slug)}
            className={`px-4 py-2 rounded-full border ${
              selectedSlug === loc.slug
                ? 'bg-primary-500 border-primary-500'
                : 'bg-white border-gray-200'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedSlug === loc.slug ? 'text-white' : 'text-gray-600'
              }`}
            >
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/restaurant/${item.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  className="w-full h-44"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-44 bg-primary-100 items-center justify-center">
                  <Text className="text-5xl">🍽️</Text>
                </View>
              )}
              <View className="p-4">
                <Text className="text-gray-900 font-bold text-lg">{item.name}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">
                  📍 {item.location?.name}
                </Text>
                {item.description && (
                  <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <Text className="text-primary-500 font-semibold text-sm mt-3">
                  Reservar →
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text className="text-4xl mb-3">🍽️</Text>
              <Text className="text-gray-500 font-medium">No hay restaurantes disponibles</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
