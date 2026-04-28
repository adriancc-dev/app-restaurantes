import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidad — ReservApp',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-primary-600 hover:underline">← Volver al inicio</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Política de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-10">Versión: abril 2026 · Última actualización: 28 de abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Responsable del tratamiento</h2>
            <p>
              <strong>[NOMBRE EMPRESA O AUTÓNOMO]</strong><br />
              NIF/CIF: <strong>[NIF]</strong><br />
              Domicilio: <strong>[DIRECCIÓN COMPLETA]</strong><br />
              Correo electrónico: <strong>[EMAIL DE PRIVACIDAD]</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Datos personales que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos de registro:</strong> nombre completo, correo electrónico, número de teléfono y contraseña (almacenada en formato cifrado).</li>
              <li><strong>Datos de uso:</strong> reservas realizadas, restaurantes visitados, historial de actividad.</li>
              <li><strong>Datos de pago (restaurantes):</strong> gestionados íntegramente por Stripe. ReservApp no almacena datos de tarjeta de crédito.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo, tokens de notificaciones push.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Finalidad y base jurídica del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Ejecución del contrato (art. 6.1.b RGPD):</strong> gestión de cuentas, reservas y suscripciones.</li>
              <li><strong>Interés legítimo (art. 6.1.f RGPD):</strong> seguridad de la plataforma, prevención del fraude y mejora del servicio.</li>
              <li><strong>Cumplimiento de obligaciones legales (art. 6.1.c RGPD):</strong> facturación y obligaciones fiscales.</li>
              <li><strong>Consentimiento (art. 6.1.a RGPD):</strong> envío de notificaciones push, si el usuario las habilita.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Destinatarios de los datos</h2>
            <p>Los datos pueden ser comunicados a los siguientes encargados del tratamiento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase Inc.</strong> — infraestructura de base de datos y autenticación (servidores en la UE).</li>
              <li><strong>Stripe Inc.</strong> — procesamiento de pagos (certificación PCI-DSS).</li>
              <li><strong>Expo / EAS</strong> — distribución de la aplicación móvil y notificaciones push.</li>
              <li><strong>Vercel Inc.</strong> — alojamiento web.</li>
            </ul>
            <p>No se ceden datos a terceros con fines comerciales o publicitarios.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Transferencias internacionales</h2>
            <p>
              Algunos de nuestros proveedores (Stripe, Vercel) están ubicados en Estados Unidos. Las transferencias
              se amparan en las cláusulas contractuales tipo aprobadas por la Comisión Europea o en el mecanismo
              EU-U.S. Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Plazo de conservación</h2>
            <p>
              Los datos se conservan mientras la cuenta permanezca activa. Tras la eliminación de la cuenta, los datos
              se suprimen en un plazo máximo de 30 días, salvo obligación legal de conservación (e.g., datos de
              facturación, conservados 5 años según la normativa tributaria española).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Derechos del usuario</h2>
            <p>En virtud del RGPD, el usuario puede ejercer los siguientes derechos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acceso:</strong> conocer qué datos tratamos sobre usted.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de sus datos.</li>
              <li><strong>Oposición y limitación:</strong> oponerse a ciertos tratamientos o limitarlos.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado.</li>
              <li><strong>Retirada del consentimiento</strong> en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.</li>
            </ul>
            <p>
              Para ejercer estos derechos, contacta con nosotros en <strong>[EMAIL DE PRIVACIDAD]</strong>. Tienes
              también derecho a presentar una reclamación ante la{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                Agencia Española de Protección de Datos (AEPD)
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Cookies</h2>
            <p>La Plataforma utiliza los siguientes tipos de cookies:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies esenciales:</strong> necesarias para la autenticación y el funcionamiento del servicio. No pueden desactivarse.</li>
              <li><strong>Cookies de preferencias:</strong> recuerdan tus preferencias (ej. idioma). Pueden rechazarse.</li>
            </ul>
            <p>No utilizamos cookies de publicidad ni de rastreo de terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito (HTTPS/TLS),
              contraseñas almacenadas con hash, Row Level Security en base de datos y acceso mínimo necesario a
              datos personales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Modificaciones</h2>
            <p>
              Esta política puede actualizarse. Te notificaremos los cambios relevantes por correo electrónico o
              mediante un aviso en la Plataforma con al menos 15 días de antelación.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4 text-sm">
          <Link href="/terms" className="text-primary-600 hover:underline">Términos de Uso</Link>
          <Link href="/" className="text-gray-500 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
