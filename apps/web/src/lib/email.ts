import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmation({
  to,
  restaurantName,
  date,
  time,
  partySize,
}: {
  to: string
  restaurantName: string
  date: string
  time: string
  partySize: number
}) {
  await resend.emails.send({
    from: 'App Restaurantes <noreply@apprestaurantes.com>',
    to,
    subject: `Reserva confirmada en ${restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#f97316">¡Reserva confirmada!</h2>
        <p>Tu reserva en <strong>${restaurantName}</strong> ha sido confirmada.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px">
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Fecha</strong></td><td style="padding:8px;border:1px solid #eee">${date}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Hora</strong></td><td style="padding:8px;border:1px solid #eee">${time}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee"><strong>Personas</strong></td><td style="padding:8px;border:1px solid #eee">${partySize}</td></tr>
        </table>
        <p style="margin-top:20px;color:#666">Recibirás un recordatorio 24 horas antes.</p>
      </div>
    `,
  })
}

export async function sendBookingReminder({
  to,
  restaurantName,
  date,
  time,
}: {
  to: string
  restaurantName: string
  date: string
  time: string
}) {
  await resend.emails.send({
    from: 'App Restaurantes <noreply@apprestaurantes.com>',
    to,
    subject: `Recordatorio: reserva mañana en ${restaurantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#f97316">¡Tu reserva es mañana!</h2>
        <p>Recuerda que tienes reserva en <strong>${restaurantName}</strong>.</p>
        <p><strong>Fecha:</strong> ${date} a las ${time}</p>
      </div>
    `,
  })
}
