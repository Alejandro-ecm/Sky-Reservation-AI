import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos y condiciones de uso de Sky Reservation AI.",
};

const LAST_UPDATED = "8 de junio de 2026";
const COMPANY = "Sky Technologies LATAM S.A. de C.V.";
const EMAIL = "legal@skyreservation.ai";
const APP = "Sky Reservation AI";

export default function TermsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-black text-white mb-1">Términos de Servicio</h1>
      <p className="text-xs text-gray-600 mb-8">Última actualización: {LAST_UPDATED}</p>

      <Section title="1. Aceptación de los Términos">
        <p>
          Al registrarte y utilizar {APP} ("el Servicio"), aceptas quedar vinculado por estos
          Términos de Servicio. Si no estás de acuerdo con alguno de ellos, no utilices el Servicio.
          El Servicio es operado por {COMPANY} ("nosotros", "la Empresa").
        </p>
      </Section>

      <Section title="2. Descripción del Servicio">
        <p>
          {APP} es una plataforma SaaS de gestión de reservaciones, atención al cliente mediante
          inteligencia artificial, automatización de WhatsApp y Voice AI, diseñada para negocios
          en Latinoamérica. Ofrecemos planes Starter, Pro y Enterprise con distintos niveles de
          funcionalidad y límites de uso.
        </p>
      </Section>

      <Section title="3. Cuentas de Usuario">
        <ul>
          <li>Debes proporcionar información veraz y actualizada al registrarte.</li>
          <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>Notifica inmediatamente a {EMAIL} ante cualquier uso no autorizado de tu cuenta.</li>
          <li>
            Una cuenta puede tener múltiples usuarios (equipo). El titular de la cuenta (Owner)
            es responsable de todos los usuarios que agregue.
          </li>
        </ul>
      </Section>

      <Section title="4. Uso Aceptable">
        <p>Al usar el Servicio te comprometes a NO:</p>
        <ul>
          <li>Violar leyes aplicables o derechos de terceros.</li>
          <li>Enviar spam, mensajes no solicitados o contenido fraudulento a través de las integraciones de WhatsApp o Voice AI.</li>
          <li>Intentar acceder sin autorización a los sistemas, servidores o datos del Servicio.</li>
          <li>Revender, sublicenciar o transferir el acceso al Servicio sin autorización escrita.</li>
          <li>Utilizar el Servicio para actividades ilegales, incluida la violación de las políticas de Meta o VAPI.</li>
        </ul>
      </Section>

      <Section title="5. Pagos y Facturación">
        <ul>
          <li>Los precios están en USD. Los planes de pago se facturan mensualmente.</li>
          <li>Aceptamos pagos mediante Stripe (tarjeta internacional) y Mercado Pago (LATAM).</li>
          <li>
            Las suscripciones se renuevan automáticamente. Puedes cancelar desde el portal de
            facturación antes del siguiente período.
          </li>
          <li>No se realizan reembolsos por períodos parciales salvo que la ley aplicable lo exija.</li>
          <li>
            En caso de impago, el acceso al Servicio puede suspenderse tras un período de gracia
            de 7 días.
          </li>
        </ul>
      </Section>

      <Section title="6. Propiedad Intelectual">
        <p>
          El Servicio, incluyendo su código, diseño, marca y contenido, es propiedad exclusiva de
          {COMPANY}. No se te concede ningún derecho de propiedad sobre el Servicio. Tu contenido
          (datos de clientes, reservaciones, etc.) sigue siendo tuyo; nos otorgas una licencia
          limitada para procesarlo con el fin de prestar el Servicio.
        </p>
      </Section>

      <Section title="7. Privacidad y Datos">
        <p>
          El tratamiento de datos personales se rige por nuestra{" "}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">
            Política de Privacidad
          </a>
          , incorporada por referencia a estos Términos. Cumplimos con la LFPDPPP (México) y demás
          normativas aplicables en LATAM.
        </p>
      </Section>

      <Section title="8. Limitación de Responsabilidad">
        <p>
          En la medida en que lo permita la ley, {COMPANY} no será responsable por daños
          indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad
          de uso del Servicio. Nuestra responsabilidad máxima se limita al monto pagado por el
          Servicio en los 3 meses anteriores al evento que generó el daño.
        </p>
      </Section>

      <Section title="9. Modificaciones">
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te
          notificaremos con al menos 15 días de anticipación por email ante cambios materiales.
          El uso continuado del Servicio tras la notificación implica aceptación de los nuevos
          términos.
        </p>
      </Section>

      <Section title="10. Ley Aplicable y Jurisdicción">
        <p>
          Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
          controversia será resuelta ante los tribunales competentes de la Ciudad de México,
          renunciando las partes a cualquier otro fuero que pudiera corresponderles.
        </p>
      </Section>

      <Section title="11. Contacto">
        <p>
          Para cualquier consulta sobre estos Términos, contáctanos en{" "}
          <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:text-blue-300">
            {EMAIL}
          </a>
          .
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-white mb-3">{title}</h2>
      <div className="text-sm text-gray-400 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
