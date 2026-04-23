import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

async function sendExpoPushNotifications(messages: object[]) {
  if (messages.length === 0) return
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })
}

Deno.serve(async () => {
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in1h = new Date(now.getTime() + 60 * 60 * 1000)

  // Reservas en las próximas 24h sin notificación enviada
  const { data: reservations24h } = await supabase
    .from('reservations')
    .select('*, restaurant:restaurants(name), user:profiles(id)')
    .eq('status', 'confirmed')
    .eq('notification_24h_sent', false)
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', in24h.toISOString().split('T')[0])

  // Reservas en la próxima 1h sin notificación enviada
  const { data: reservations1h } = await supabase
    .from('reservations')
    .select('*, restaurant:restaurants(name), user:profiles(id)')
    .eq('status', 'confirmed')
    .eq('notification_1h_sent', false)
    .gte('date', now.toISOString().split('T')[0])
    .lte('date', in1h.toISOString().split('T')[0])

  const messages24h: object[] = []
  const messages1h: object[] = []
  const ids24h: string[] = []
  const ids1h: string[] = []

  for (const res of reservations24h ?? []) {
    const reservationDateTime = new Date(`${res.date}T${res.time}`)
    const diff = reservationDateTime.getTime() - now.getTime()
    if (diff < 24 * 60 * 60 * 1000 && diff > 23 * 60 * 60 * 1000) {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', res.user_id)

      for (const { token } of tokens ?? []) {
        messages24h.push({
          to: token,
          title: '¡Tu reserva es mañana!',
          body: `Tienes reserva en ${res.restaurant.name} mañana a las ${res.time.slice(0, 5)}`,
          data: { reservationId: res.id },
        })
      }
      ids24h.push(res.id)
    }
  }

  for (const res of reservations1h ?? []) {
    const reservationDateTime = new Date(`${res.date}T${res.time}`)
    const diff = reservationDateTime.getTime() - now.getTime()
    if (diff < 60 * 60 * 1000 && diff > 45 * 60 * 1000) {
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', res.user_id)

      for (const { token } of tokens ?? []) {
        messages1h.push({
          to: token,
          title: '¡Tu reserva es en 1 hora!',
          body: `Recuerda tu reserva en ${res.restaurant.name} a las ${res.time.slice(0, 5)}`,
          data: { reservationId: res.id },
        })
      }
      ids1h.push(res.id)
    }
  }

  await sendExpoPushNotifications(messages24h)
  await sendExpoPushNotifications(messages1h)

  if (ids24h.length > 0) {
    await supabase
      .from('reservations')
      .update({ notification_24h_sent: true })
      .in('id', ids24h)
  }
  if (ids1h.length > 0) {
    await supabase
      .from('reservations')
      .update({ notification_1h_sent: true })
      .in('id', ids1h)
  }

  return new Response(
    JSON.stringify({ sent24h: ids24h.length, sent1h: ids1h.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
