'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LOCATIONS } from '@repo/shared'

export default function EditRestaurantPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [locationId, setLocationId] = useState(1)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [menuUrl, setMenuUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    loadRestaurant()
  }, [])

  async function loadRestaurant() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (data) {
      setRestaurantId(data.id)
      setName(data.name)
      setDescription(data.description ?? '')
      setLocationId(data.location_id ?? 1)
      setAddress(data.address ?? '')
      setPhone(data.phone ?? '')
      setEmail(data.email ?? '')
      setMenuUrl(data.menu_url ?? '')
      setImageUrl(data.image_url ?? '')
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      name, description, location_id: locationId,
      address, phone, email,
      menu_url: menuUrl, image_url: imageUrl,
      owner_id: user.id,
    }

    if (restaurantId) {
      await supabase.from('restaurants').update(data).eq('id', restaurantId)
    } else {
      const { data: created } = await supabase
        .from('restaurants')
        .insert(data)
        .select()
        .single()
      setRestaurantId(created?.id ?? null)
    }

    setMessage('¡Guardado correctamente!')
    setSaving(false)
  }

  if (loading) {
    return <div className="animate-pulse text-gray-400 p-8">Cargando...</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Editar restaurante</h1>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del restaurante *
          </label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            className="input resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localización *
          </label>
          <select
            className="input"
            value={locationId}
            onChange={(e) => setLocationId(Number(e.target.value))}
          >
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            className="input"
            placeholder="Calle, número..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contacto
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link a la carta / menú
          </label>
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={menuUrl}
            onChange={(e) => setMenuUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de imagen del restaurante
          </label>
          <input
            type="url"
            className="input"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
