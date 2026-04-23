export * from './types/index'
export * from './schemas'

import type { RestaurantHours, TimeSlot } from './types/index'

export function generateTimeSlots(
  hours: RestaurantHours,
  existingCounts: Record<string, number>
): TimeSlot[] {
  if (!hours.is_open || !hours.open_time || !hours.close_time) return []

  const slots: TimeSlot[] = []
  const openParts = hours.open_time.split(':').map(Number)
  const closeParts = hours.close_time.split(':').map(Number)
  const openH = openParts[0] ?? 0
  const openM = openParts[1] ?? 0
  const closeH = closeParts[0] ?? 0
  const closeM = closeParts[1] ?? 0

  let current = openH * 60 + openM
  const end = closeH * 60 + closeM

  while (current + hours.slot_duration <= end) {
    const hh = String(Math.floor(current / 60)).padStart(2, '0')
    const mm = String(current % 60).padStart(2, '0')
    const time = `${hh}:${mm}`
    const count = existingCounts[time] ?? 0

    slots.push({
      time,
      available: count < hours.max_capacity,
      remaining: Math.max(0, hours.max_capacity - count),
    })

    current += hours.slot_duration
  }

  return slots
}
