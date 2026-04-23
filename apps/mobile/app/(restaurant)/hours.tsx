import { useState, useEffect } from 'react'
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { DAY_NAMES } from '@repo/shared'

const DEFAULT_HOURS = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  is_open: i >= 1 && i <= 5,
  open_time: '13:00',
  close_time: '22:00',
  slot_duration: 60,
  max_capacity: 10,
}))

export default function HoursScreen() {
  const { session } = useAuth()
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) loadHours()
  }, [session])

  async function loadHours() {
    const { data: r } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', session!.user.id)
      .single()

    if (!r) return
    setRestaurantId(r.id)

    const { data: existing } = await supabase
      .from('restaurant_hours')
      .select('*')
      .eq('restaurant_id', r.id)

    if (existing?.length) {
      const merged = DEFAULT_HOURS.map((def) => {
        const found = existing.find((e) => e.day_of_week === def.day_of_week)
        return found ? {
          day_of_week: found.day_of_week,
          is_open: found.is_open,
          open_time: found.open_time ?? '13:00',
          close_time: found.close_time ?? '22:00',
          slot_duration: found.slot_duration,
          max_capacity: found.max_capacity,
        } : def
      })
      setHours(merged)
    }
  }

  function update(index: number, field: string, value: unknown) {
    setHours((prev) => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  async function handleSave() {
    if (!restaurantId) return
    setSaving(true)
    const { error } = await supabase
      .from('restaurant_hours')
      .upsert(
        hours.map((h) => ({ restaurant_id: restaurantId, ...h })),
        { onConflict: 'restaurant_id,day_of_week' }
      )
    setSaving(false)
    Alert.alert(error ? 'Error' : '¡Guardado!', error ? error.message : 'Horarios actualizados.')
  }

  const SLOTS = [30, 45, 60, 90, 120]

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 12 }}>
      {hours.map((h, i) => (
        <View key={h.day_of_week} className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`font-semibold text-base ${h.is_open ? 'text-gray-900' : 'text-gray-400'}`}>
              {DAY_NAMES[h.day_of_week]}
            </Text>
            <Switch
              value={h.is_open}
              onValueChange={(v) => update(i, 'is_open', v)}
              trackColor={{ true: '#f97316' }}
            />
          </View>

          {h.is_open && (
            <View className="space-y-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Apertura</Text>
                  <TouchableOpacity
                    className="border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50"
                    onPress={() => {/* In production: use DateTimePicker */}}
                  >
                    <Text className="text-gray-700 text-sm">{h.open_time}</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Cierre</Text>
                  <TouchableOpacity
                    className="border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50"
                    onPress={() => {/* In production: use DateTimePicker */}}
                  >
                    <Text className="text-gray-700 text-sm">{h.close_time}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-500 mb-2">Duración de slot</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SLOTS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => update(i, 'slot_duration', s)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        h.slot_duration === s
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <Text className={`text-xs font-medium ${h.slot_duration === s ? 'text-white' : 'text-gray-600'}`}>
                        {s} min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-500 mb-2">
                  Capacidad por slot: <Text className="font-bold text-gray-700">{h.max_capacity}</Text>
                </Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => update(i, 'max_capacity', Math.max(1, h.max_capacity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  >
                    <Text className="text-gray-700 font-bold">−</Text>
                  </TouchableOpacity>
                  <Text className="text-gray-900 font-bold w-8 text-center">{h.max_capacity}</Text>
                  <TouchableOpacity
                    onPress={() => update(i, 'max_capacity', Math.min(100, h.max_capacity + 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 items-center justify-center"
                  >
                    <Text className="text-gray-700 font-bold">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        className="bg-primary-500 rounded-2xl py-4 items-center mt-2 mb-8"
      >
        <Text className="text-white font-bold text-base">
          {saving ? 'Guardando...' : 'Guardar horarios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
