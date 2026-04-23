import { RestaurantHours, TimeSlot } from '@repo/shared'

export function generateTimeSlots(
  hours: RestaurantHours,
  existingCounts: Record<string, number>
): TimeSlot[] {
  if (!hours.is_open || !hours.open_time || !hours.close_time) return []

  const slots: TimeSlot[] = []
  const [openH, openM] = hours.open_time.split(':').map(Number)
  const [closeH, closeM] = hours.close_time.split(':').map(Number)

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
