import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

async function sendExpoPushNotifications(messages: object[]): Promise<void> {
  if (messages.length === 0) return
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })
    if (!res.ok) {
      console.error('Expo push API error:', res.status, await res.text())
    }
  } catch (err) {
    console.error('Failed to send Expo push notifications:', err)
  }
}

Deno.serve(async () => {
  const now = new Date()

  // Wide windows to ensure each cron run (every 15 min) always catches reservations.
  // The notification_*h_sent flags prevent double-sending.
  const window24hStart = new Date(now.getTime() + 20 * 60 * 60 * 1000)
  const window24hEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000)
  const window1hStart = new Date(now.getTime() + 30 * 60 * 1000)
  const window1hEnd = new Date(now.getTime() + 90 * 60 * 1000)

  const { data: reservations24h } = await supabase
    .from('reservations')
    .select('id, user_id, date, time, restaurant:restaurants(name)')
    .eq('status', 'confirmed')
    .eq('notification_24h_sent', false)
    .gte('date', window24hStart.toISOString().split('T')[0])
    .lte('date', window24hEnd.toISOString().split('T')[0])

  const { data: reservations1h } = await supabase
    .from('reservations')
    .select('id, user_id, date, time, restaurant:restaurants(name)')
    .eq('status', 'confirmed')
    .eq('notification_1h_sent', false)
    .gte('date', window1hStart.toISOString().split('T')[0])
    .lte('date', window1hEnd.toISOString().split('T')[0])

  // Batch-load all push tokens in a single query to avoid N+1
  const all24h = reservations24h ?? []
  const all1h = reservations1h ?? []
  const allUserIds = [...new Set([...all24h, ...all1h].map((r) => r.user_id))]

  const tokensByUser = new Map<string, string[]>()
  if (allUserIds.length > 0) {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', allUserIds)

    for (const t of tokens ?? []) {
      const existing = tokensByUser.get(t.user_id) ?? []
      tokensByUser.set(t.user_id, [...existing, t.token])
    }
  }

  const messages24h: object[] = []
  const messages1h: object[] = []
  const ids24h: string[] = []
  const ids1h: string[] = []

  for (const res of all24h) {
    const diff = new Date(`${res.date}T${res.time}`).getTime() - now.getTime()
    if (diff >= 20 * 60 * 60 * 1000 && diff < 26 * 60 * 60 * 1000) {
      const restaurantName = (res.restaurant as { name: string } | null)?.name ?? 'tu restaurante'
      for (const token of tokensByUser.get(res.user_id) ?? []) {
        messages24h.push({
          to: token,
          title: '¡Tu reserva es mañana!',
          body: `Tienes reserva en ${restaurantName} mañana a las ${res.time.slice(0, 5)}`,
          data: { reservationId: res.id },
        })
      }
      ids24h.push(res.id)
    }
  }

  for (const res of all1h) {
    const diff = new Date(`${res.date}T${res.time}`).getTime() - now.getTime()
    if (diff >= 30 * 60 * 1000 && diff < 90 * 60 * 1000) {
      const restaurantName = (res.restaurant as { name: string } | null)?.name ?? 'tu restaurante'
      for (const token of tokensByUser.get(res.user_id) ?? []) {
        messages1h.push({
          to: token,
          title: '¡Tu reserva es en 1 hora!',
          body: `Recuerda tu reserva en ${restaurantName} a las ${res.time.slice(0, 5)}`,
          data: { reservationId: res.id },
        })
      }
      ids1h.push(res.id)
    }
  }

  await sendExpoPushNotifications(messages24h)
  await sendExpoPushNotifications(messages1h)

  if (ids24h.length > 0) {
    await supabase.from('reservations').update({ notification_24h_sent: true }).in('id', ids24h)
  }
  if (ids1h.length > 0) {
    await supabase.from('reservations').update({ notification_1h_sent: true }).in('id', ids1h)
  }

  return new Response(
    JSON.stringify({ sent24h: ids24h.length, sent1h: ids1h.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
