import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { LOCATIONS } from '@repo/shared'

export default function EditRestaurantScreen() {
  const { session } = useAuth()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locationId, setLocationId] = useState(1)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session) loadRestaurant()
  }, [session])

  async function loadRestaurant() {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', session!.user.id)
      .single()

    if (data) {
      setRestaurantId(data.id)
      setName(data.name ?? '')
      setDescription(data.description ?? '')
      setLocationId(data.location_id ?? 1)
      setAddress(data.address ?? '')
      setPhone(data.phone ?? '')
      setMenuUrl(data.menu_url ?? '')
    }
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return }
    setSaving(true)

    const payload = {
      name, description, location_id: locationId,
      address, phone, menu_url: menuUrl,
      owner_id: session!.user.id,
    }

    if (restaurantId) {
      await supabase.from('restaurants').update(payload).eq('id', restaurantId)
    } else {
      await supabase.from('restaurants').insert(payload)
    }

    setSaving(false)
    Alert.alert('¡Guardado!', 'Los cambios se han guardado correctamente.')
  }

  const fields = [
    { label: 'Nombre del restaurante *', value: name, setter: setName, placeholder: 'Mi restaurante' },
    { label: 'Descripción', value: description, setter: setDescription, placeholder: 'Breve descripción...', multiline: true },
    { label: 'Dirección', value: address, setter: setAddress, placeholder: 'Calle, número...' },
    { label: 'Teléfono', value: phone, setter: setPhone, placeholder: '600 000 000', type: 'phone-pad' },
    { label: 'Link a la carta', value: menuUrl, setter: setMenuUrl, placeholder: 'https://...', type: 'url' },
  ]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          {fields.map((f) => (
            <View key={f.label}>
              <Text className="text-sm font-medium text-gray-700 mb-1">{f.label}</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900"
                placeholder={f.placeholder}
                value={f.value}
                onChangeText={f.setter}
                multiline={f.multiline}
                numberOfLines={f.multiline ? 3 : 1}
                keyboardType={(f.type ?? 'default') as any}
                autoCapitalize="none"
              />
            </View>
          ))}

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Localización</Text>
            <View className="border border-gray-200 rounded-xl overflow-hidden">
              <Picker
                selectedValue={locationId}
                onValueChange={(v: number) => setLocationId(Number(v))}
              >
                {LOCATIONS.map((l) => (
                  <Picker.Item key={l.id} label={l.name} value={l.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className="bg-primary-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
