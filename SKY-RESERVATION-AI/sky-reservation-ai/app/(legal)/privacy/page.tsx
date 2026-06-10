import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo recopilamos, usamos y protegemos tus datos personales en Sky Reservation AI.",
};

const LAST_UPDATED = "8 de junio de 2026";
const COMPANY = "Sky Technologies LATAM S.A. de C.V.";
const EMAIL = "privacidad@skyreservation.ai";
const APP = "Sky Reservation AI";

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <h1 className="text-2xl font-black text-white mb-1">Política de Privacidad</h1>
      <p className="text-xs text-gray-600 mb-8">Última actualización: {LAST_UPDATED}</p>

      <Section title="1. Responsable del Tratamiento">
        <p>
          {COMPANY} ("nosotros") es responsable del tratamiento de los datos personales que
          recopilamos a través de {APP}. Puedes contactarnos en{" "}
          <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:text-blue-300">
            {EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="2. Datos que Recopilamos">
        <p>Recopilamos las siguientes categorías de datos:</p>
        <ul>
          <li>
            <strong className="text-gray-300">Datos de cuenta:</strong> nombre, email, nombre del
            negocio, contraseña (almacenada en hash por Supabase Auth).
          </li>
          <li>
            <strong className="text-gray-300">Datos de uso:</strong> reservaciones, clientes,
            conversaciones, llamadas de voz y mensajes de WhatsApp procesados a través del Servicio.
          </li>
          <li>
            <strong className="text-gray-300">Datos de pago:</strong> procesados por Stripe o Mercado
            Pago. No almacenamos números de tarjeta; solo el ID de cliente y el estado de suscripción.
          </li>
          <li>
            <strong className="text-gray-300">Datos técnicos:</strong> dirección IP (para auditoría de
            seguridad), tipo de dispositivo, logs de acceso.
          </li>
        </ul>
      </Section>

      <Section title="3. Finalidades del Tratamiento">
        <ul>
          <li>Proveer y mejorar el Servicio.</li>
          <li>Procesar pagos y gestionar suscripciones.</li>
          <li>Enviar comunicaciones transaccionales (confirmaciones, facturas, alertas de seguridad).</li>
          <li>Cumplir obligaciones legales y prevenir fraude.</li>
          <li>Generar estadísticas agregadas y anónimas sobre el uso del Servicio.</li>
        </ul>
      </Section>

      <Section title="4. Base Legal">
        <p>El tratamiento de tus datos se sustenta en:</p>
        <ul>
          <li><strong className="text-gray-300">Contrato:</strong> necesario para ejecutar el servicio contratado.</li>
          <li><strong className="text-gray-300">Consentimiento:</strong> para comunicaciones de marketing (revocable en cualquier momento).</li>
          <li><strong className="text-gray-300">Obligación legal:</strong> para cumplir con la LFPDPPP y demás normativas aplicables.</li>
        </ul>
      </Section>

      <Section title="5. Transferencia de Datos a Terceros">
        <p>Compartimos datos únicamente con los siguientes proveedores de servicios:</p>
        <ul>
          <li><strong className="text-gray-300">Supabase</strong> — base de datos y autenticación (EE.UU., SOC 2)</li>
          <li><strong className="text-gray-300">Stripe / Mercado Pago</strong> — procesamiento de pagos (PCI DSS)</li>
          <li><strong className="text-gray-300">OpenAI</strong> — generación de respuestas IA (EE.UU., datos procesados sin almacenamiento permanente)</li>
          <li><strong className="text-gray-300">VAPI</strong> — voz IA (EE.UU.)</li>
          <li><strong className="text-gray-300">Meta / WhatsApp</strong> — mensajería (según política de Meta)</li>
          <li><strong className="text-gray-300">Resend</strong> — envío de emails transaccionales</li>
          <li><strong className="text-gray-300">Vercel</strong> — infraestructura de hosting (EE.UU., ISO 27001)</li>
        </ul>
        <p>No vendemos datos personales a terceros.</p>
      </Section>

      <Section title="6. Retención de Datos">
        <p>
          Conservamos tus datos mientras mantengas una cuenta activa. Al cancelar tu cuenta,
          eliminamos o anonimizamos los datos personales en un plazo de 90 días, salvo que la
          ley exija un período mayor.
        </p>
      </Section>

      <Section title="7. Tus Derechos (ARCO)">
        <p>
          Conforme a la LFPDPPP tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al
          tratamiento de tus datos personales. Para ejercer estos derechos envía un email a{" "}
          <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:text-blue-300">
            {EMAIL}
          </a>{" "}
          con asunto "Derechos ARCO". Responderemos en un plazo máximo de 20 días hábiles.
        </p>
      </Section>

      <Section title="8. Cookies y Tecnologías Similares">
        <p>
          Utilizamos cookies de sesión estrictamente necesarias para la autenticación (Supabase Auth).
          No utilizamos cookies de rastreo ni publicidad de terceros. Las cookies de analítica
          (Vercel Analytics) son anónimas y no requieren consentimiento.
        </p>
      </Section>

      <Section title="9. Seguridad">
        <p>
          Implementamos medidas técnicas y organizativas adecuadas: cifrado TLS en tránsito,
          cifrado en reposo en Supabase, Row Level Security (RLS) para aislamiento multitenancy,
          rate limiting y logging de auditoría para acciones críticas.
        </p>
      </Section>

      <Section title="10. Cambios a esta Política">
        <p>
          Notificaremos cambios materiales por email con al menos 15 días de anticipación. La
          versión vigente siempre estará disponible en{" "}
          <a href="/privacy" className="text-blue-400 hover:text-blue-300">
            skyreservation.ai/privacy
          </a>
          .
        </p>
      </Section>

      <Section title="11. Contacto">
        <p>
          Para consultas sobre privacidad o para ejercer tus derechos ARCO:{" "}
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
