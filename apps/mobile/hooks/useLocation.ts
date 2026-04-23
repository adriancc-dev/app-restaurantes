import { useState, useEffect } from 'react'
import * as Location from 'expo-location'
import { LOCATIONS } from '@repo/shared'

const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  moncofa: { lat: 39.8225, lng: -0.1432 },
  nules: { lat: 39.8537, lng: -0.1529 },
  'la-vall-duixo': { lat: 39.8310, lng: -0.2326 },
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useLocation() {
  const [nearestLocation, setNearestLocation] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setPermissionDenied(true)
      return
    }

    const loc = await Location.getCurrentPositionAsync({})
    const { latitude, longitude } = loc.coords

    let nearest = LOCATIONS[0]
    let minDist = Infinity

    for (const location of LOCATIONS) {
      const coords = LOCATION_COORDS[location.slug]
      const dist = distanceKm(latitude, longitude, coords.lat, coords.lng)
      if (dist < minDist) {
        minDist = dist
        nearest = location
      }
    }

    setNearestLocation(nearest.slug)
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return { nearestLocation, permissionDenied, requestLocation }
}
