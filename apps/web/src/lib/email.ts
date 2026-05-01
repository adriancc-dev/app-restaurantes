import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const emailWrapper = (previewText: string, body: string) => `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${previewText} &nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316 0%,#c2410c 100%);border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
              <p style="margin:0;font-size:30px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1;">
                🍽️ ReservApp
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.80);font-weight:500;letter-spacing:0.3px;text-transform:uppercase;">
                Reservas de restaurantes online
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;padding:28px 48px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.6;">
                Si tienes alguna pregunta, responde a este correo o visita nuestra web.
              </p>
              <p style="margin:20px 0 0;font-size:11px;color:#d1d5db;">
                © 2026 ReservApp &nbsp;·&nbsp; Moncofa, Nules y La Vall d'Uixó
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`

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
}): Promise<void> {
  const body = `
    <!-- Icon -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <div style="display:inline-block;background:#fff7ed;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">
            ✅
          </div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827;text-align:center;line-height:1.2;">
      ¡Reserva confirmada!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;text-align:center;line-height:1.7;">
      Tu mesa en <strong style="color:#111827;">${restaurantName}</strong> está reservada.<br/>
      Te esperamos con mucho gusto.
    </p>

    <!-- Details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:8px 0;overflow:hidden;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">📍 Restaurante</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${restaurantName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">📅 Fecha</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${date}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">🕐 Hora</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${time}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">👥 Personas</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${partySize} ${partySize === 1 ? 'persona' : 'personas'}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>

    <!-- Info note -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px;">
          <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;text-align:center;">
            📬 Recibirás un recordatorio 24 horas antes de tu reserva.
          </p>
        </td>
      </tr>
    </table>
  `

  await resend.emails.send({
    from: 'ReservApp <noreply@apprestaurantes.com>',
    to,
    subject: `✅ Reserva confirmada en ${restaurantName}`,
    html: emailWrapper(`Tu mesa en ${restaurantName} está confirmada para el ${date} a las ${time}`, body),
  })
}

export async function sendBookingReminder({
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
  partySize?: number
}): Promise<void> {
  const body = `
    <!-- Icon -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom:28px;">
          <div style="display:inline-block;background:#fff7ed;border-radius:50%;width:72px;height:72px;line-height:72px;text-align:center;font-size:32px;">
            🔔
          </div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111827;text-align:center;line-height:1.2;">
      ¡Tu reserva es mañana!
    </h1>
    <p style="margin:0 0 32px;font-size:15px;color:#6b7280;text-align:center;line-height:1.7;">
      Este es un recordatorio de tu reserva en <strong style="color:#111827;">${restaurantName}</strong>.<br/>
      ¡Te esperamos!
    </p>

    <!-- Details card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:8px 0;overflow:hidden;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">📍 Restaurante</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${restaurantName}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">📅 Fecha</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${date}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px;${partySize !== undefined ? 'border-bottom:1px solid #e5e7eb;' : ''}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">🕐 Hora</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${time}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${
              partySize !== undefined
                ? `<tr>
              <td style="padding:14px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:13px;color:#9ca3af;font-weight:500;text-transform:uppercase;letter-spacing:0.4px;">👥 Personas</td>
                    <td align="right" style="font-size:15px;color:#111827;font-weight:600;">${partySize} ${partySize === 1 ? 'persona' : 'personas'}</td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ''
            }
          </table>

        </td>
      </tr>
    </table>

    <!-- Warm closing -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 20px;">
          <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.6;text-align:center;">
            🍷 Si necesitas cancelar o modificar tu reserva, hazlo con antelación a través de la app.
          </p>
        </td>
      </tr>
    </table>
  `

  await resend.emails.send({
    from: 'ReservApp <noreply@apprestaurantes.com>',
    to,
    subject: `🔔 Recordatorio: mañana tienes mesa en ${restaurantName}`,
    html: emailWrapper(`Recuerda tu reserva en ${restaurantName} mañana ${date} a las ${time}`, body),
  })
}
