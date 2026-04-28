import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Términos de Uso — ReservApp',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-primary-600 hover:underline">← Volver al inicio</Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-sm text-gray-500 mb-10">Versión: abril 2026 · Última actualización: 28 de abril de 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Identificación del titular</h2>
            <p>
              El presente sitio web y la aplicación móvil ReservApp (en adelante, «la Plataforma») son titularidad de
              <strong> [NOMBRE EMPRESA O AUTÓNOMO]</strong>, con NIF/CIF <strong>[NIF]</strong>, domicilio en
              <strong> [DIRECCIÓN COMPLETA]</strong>, y correo electrónico de contacto{' '}
              <strong>[EMAIL DE CONTACTO]</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Objeto</h2>
            <p>
              La Plataforma ofrece un servicio de gestión y reserva de mesas en restaurantes situados en los municipios
              de Moncofa, Nules y La Vall d&apos;Uixó (Castellón). Existen dos tipos de cuenta: <strong>Usuario</strong> (gratuito),
              que permite realizar reservas, y <strong>Restaurante</strong> (sujeto a suscripción mensual), que permite
              publicar el establecimiento y gestionar las reservas recibidas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Condiciones de acceso y uso</h2>
            <p>
              El acceso a la Plataforma requiere el registro de una cuenta. El usuario se compromete a facilitar datos
              verídicos, completos y actualizados, a mantener la confidencialidad de sus credenciales y a notificar
              cualquier uso no autorizado de su cuenta.
            </p>
            <p>
              Queda prohibido el uso de la Plataforma para fines ilícitos, la suplantación de identidad, el envío de
              contenido ofensivo, spam o código malicioso, así como cualquier acción que pueda perjudicar el normal
              funcionamiento del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Cuentas de restaurante y suscripción</h2>
            <p>
              La activación de una cuenta de restaurante requiere la contratación de una suscripción mensual de{' '}
              <strong>100 € + IVA/mes</strong>, gestionada a través de Stripe. El pago se realiza mensualmente y de
              forma recurrente. El titular del restaurante puede cancelar la suscripción en cualquier momento desde el
              panel de control; la cancelación será efectiva al final del período de facturación en curso.
            </p>
            <p>
              En caso de impago, la cuenta del restaurante quedará desactivada y el establecimiento dejará de ser visible
              para los usuarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Reservas</h2>
            <p>
              Las reservas realizadas a través de la Plataforma son compromisos entre el usuario y el restaurante. La
              Plataforma actúa únicamente como intermediario técnico y no es parte en la relación contractual entre
              ambas partes.
            </p>
            <p>
              El usuario es responsable de cancelar las reservas con suficiente antelación en caso de no poder asistir.
              La reiteración de reservas no canceladas («no-shows») puede resultar en la restricción de la cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Responsabilidad</h2>
            <p>
              La Plataforma no garantiza la disponibilidad continua del servicio y no será responsable de los daños
              derivados de interrupciones técnicas, errores en los datos facilitados por los restaurantes o incumplimientos
              entre usuario y establecimiento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Propiedad intelectual</h2>
            <p>
              Todos los contenidos de la Plataforma (código, diseño, logotipos, textos) son propiedad del titular o de
              terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o modificación sin
              autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Modificaciones</h2>
            <p>
              El titular se reserva el derecho a modificar los presentes términos en cualquier momento, notificándolo
              con al menos 15 días de antelación mediante aviso en la Plataforma o por correo electrónico. El uso
              continuado del servicio tras la entrada en vigor de los nuevos términos implicará su aceptación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Ley aplicable y jurisdicción</h2>
            <p>
              Los presentes términos se rigen por la legislación española. Para la resolución de conflictos, las partes
              se someten a los Juzgados y Tribunales de Castellón, con renuncia expresa a cualquier otro fuero que
              pudiera corresponderles.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4 text-sm">
          <Link href="/privacy" className="text-primary-600 hover:underline">Política de Privacidad</Link>
          <Link href="/" className="text-gray-500 hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
