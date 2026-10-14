"use client";

import Link from "next/link";
import Image from "next/image";

const SECCIONES = [
  { id: "servicio", titulo: "1. Sobre NDI | Diseño & Web" },
  { id: "cuenta", titulo: "2. Cuenta y acceso" },
  { id: "planes", titulo: "3. Planes y contratación" },
  { id: "pagos", titulo: "4. Pagos y renovaciones" },
  { id: "funciones", titulo: "5. Funciones del servicio" },
  { id: "ia", titulo: "6. Asistente con inteligencia artificial" },
  { id: "contenido", titulo: "7. Contenido del negocio" },
  { id: "datos", titulo: "8. Datos de clientes y visitantes" },
  { id: "terceros", titulo: "9. Servicios de terceros" },
  { id: "disponibilidad", titulo: "10. Disponibilidad y cambios" },
  { id: "suspension", titulo: "11. Suspensión o finalización" },
  { id: "responsabilidad", titulo: "12. Responsabilidad" },
  { id: "consumidor", titulo: "13. Defensa del consumidor y arrepentimiento" },
  { id: "propiedad", titulo: "14. Propiedad intelectual" },
  { id: "modificaciones", titulo: "15. Modificaciones de estos términos" },
  { id: "ley", titulo: "16. Ley aplicable y jurisdicción" },
  { id: "contacto", titulo: "17. Contacto" },
];

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#0c0d0e] dark:text-zinc-100">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-zinc-950 dark:text-white"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 p-1">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={16}
                height={16}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">NDI | Diseño & Web</p>
              <p className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                Diseño y páginas web para negocios
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Volver al inicio
          </Link>
        </div>
      </div>

      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Marco contractual
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl text-zinc-950 dark:text-white">
            Términos y Condiciones del Servicio
          </h1>

          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Estos términos regulan la contratación de diseño, puesta en marcha y mantenimiento de páginas web brindados por NDI | Diseño & Web. Al contratar un plan o utilizar la plataforma, aceptás estas condiciones.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900">
              Última actualización: Octubre de 2026
            </span>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900">
              República Argentina
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:py-12">
        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Contenido
            </p>

            <nav className="space-y-0.5">
              {SECCIONES.map((seccion) => (
                <a
                  key={seccion.id}
                  href={`#${seccion.id}`}
                  className="block rounded-lg px-2 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {seccion.titulo}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="space-y-5">
          <LegalSection id="servicio" titulo="1. Sobre NDI | Diseño & Web">
            <p>
              NDI | Diseño & Web (en adelante, el Servicio) es una iniciativa independiente de diseño gráfico y desarrollo de páginas web operada desde Libertador General San Martín, Jujuy, orientada a emprendedores, comercios y profesionales.
            </p>
            <p>
              El servicio incluye el armado del sitio, configuración de catálogo o menú digital, recepción de pedidos por WhatsApp, agenda de turnos online y panel de autogestión, según el plan elegido.
            </p>
          </LegalSection>

          <LegalSection id="cuenta" titulo="2. Cuenta y acceso">
            <p>
              Para acceder al panel de administración es necesario registrarse con información verdadera y comprobable. Cada titular es responsable de la seguridad de sus credenciales y del uso que se realice desde su cuenta.
            </p>
            <p>
              NDI | Diseño & Web se reserva el derecho de inhabilitar accesos ante uso fraudulento, conductas abusivas o incumplimiento de las presentes condiciones.
            </p>
          </LegalSection>

          <LegalSection id="planes" titulo="3. Planes y contratación">
            <p>
              El servicio contempla tres planes principales: <strong>Página Simple</strong>, <strong>Página Completa</strong> y <strong>Business IA</strong>. Los detalles, alcances y valores de cada opción son los que se informan al momento de la contratación.
            </p>
            <p>
              El plazo estimado de diseño y entrega de la primera versión funcional es de 24 a 48 horas hábiles a partir de la recepción completa de los textos, fotos y datos requeridos del negocio.
            </p>
          </LegalSection>

          <LegalSection id="pagos" titulo="4. Pagos y renovaciones">
            <p>
              La contratación comprende un costo inicial de diseño y puesta en marcha, complementado por un abono mensual para mantenimiento, infraestructura de servidor, certificado SSL y soporte técnico.
            </p>
            <p>
              Las renovaciones mensuales se realizan en forma manual mediante transferencia bancaria o tarjeta a través de Mercado Pago. Si un período finaliza sin acreditación de pago, las funciones vinculadas al plan pueden quedar temporalmente en pausa hasta su regularización.
            </p>
          </LegalSection>

          <LegalSection id="funciones" titulo="5. Funciones del servicio">
            <p>
              Las capacidades disponibles dependen de la modalidad contratada:
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Página Simple:</strong> Presencia institucional, catálogo de servicios, datos de contacto, turnos online y enlace directo a WhatsApp.</li>
              <li><strong>Página Completa:</strong> Incluye catálogo extendido de productos o menú gastronómico, código QR imprimible, variantes y medios de cobro integrados.</li>
              <li><strong>Business IA:</strong> Incorpora asistente conversacional con respuestas basadas en la información comercial provista.</li>
            </ul>
          </LegalSection>

          <LegalSection id="ia" titulo="6. Asistente con inteligencia artificial">
            <p>
              En planes con asistente conversacional, las respuestas se elaboran mediante modelos automáticos a partir de los datos cargados por el negocio. El titular debe verificar que la información provista en la base de conocimiento sea precisa y actualizada.
            </p>
          </LegalSection>

          <LegalSection id="contenido" titulo="7. Contenido del negocio">
            <p>
              El titular conserva la plena propiedad y responsabilidad sobre textos, logotipos, imágenes, listas de precios y condiciones comerciales que publique a través de su sitio web.
            </p>
          </LegalSection>

          <LegalSection id="datos" titulo="8. Datos de clientes y visitantes">
            <p>
              Las consultas, solicitudes de turnos y pedidos ingresados por visitantes a través del sitio web del cliente son gestionados directamente entre el visitante y el comercio. El titular del negocio debe cumplir con la legislación de datos personales aplicable en su operatoria.
            </p>
          </LegalSection>

          <LegalSection id="terceros" titulo="9. Servicios de terceros">
            <p>
              Para su operatividad, el servicio utiliza proveedores de infraestructura, procesamiento y pagos (tales como Vercel, Firebase y Mercado Pago). La continuidad técnica de estos elementos puede verse sujeta al funcionamiento propio de dichos proveedores.
            </p>
          </LegalSection>

          <LegalSection id="disponibilidad" titulo="10. Disponibilidad y cambios">
            <p>
              Se procura mantener la más alta disponibilidad operativa del servicio. Pueden llevarse a cabo tareas de mantenimiento preventivo, actualizaciones de seguridad o mejoras funcionales informadas previamente cuando resulte pertinente.
            </p>
          </LegalSection>

          <LegalSection id="suspension" titulo="11. Suspensión o finalización">
            <p>
              El cliente puede dar de baja el servicio al vencimiento de cualquier ciclo mensual sin costo de cancelación adicional, solicitándolo por los canales de soporte.
            </p>
          </LegalSection>

          <LegalSection id="responsabilidad" titulo="12. Responsabilidad">
            <p>
              NDI | Diseño & Web suministra herramientas digitales para potenciar la visibilidad y comercialización del cliente, sin constituir garantía explícita sobre un volumen determinado de ventas o conversiones económicas.
            </p>
          </LegalSection>

          <LegalSection id="consumidor" titulo="13. Defensa del consumidor y arrepentimiento">
            <p>
              En cumplimiento del artículo 34 de la Ley 24.240 de Defensa del Consumidor y de la Resolución 424/2020 de la Secretaría de Comercio Interior, el contratante que actúe en calidad de consumidor final cuenta con el derecho irrenunciable a revocar la contratación dentro del plazo de <strong>diez (10) días corridos</strong> contados a partir de la fecha de contratación inicial.
            </p>
            <p>
              Para ejercer la revocación, podrá utilizarse el enlace de <strong>Botón de arrepentimiento</strong> disponible en el pie de página o enviar una comunicación expresa al correo <strong>soporte@ndiweb.com</strong>, procediéndose al reintegro de los importes abonados conforme a derecho.
            </p>
          </LegalSection>

          <LegalSection id="propiedad" titulo="14. Propiedad intelectual">
            <p>
              La arquitectura del sistema, plantillas de desarrollo y componentes de la plataforma son propiedad de NDI | Diseño & Web. El cliente goza de una licencia de uso durante la vigencia del servicio activo. Todos los activos de marca propios del negocio contratante pertenecen a su respectivo titular.
            </p>
          </LegalSection>

          <LegalSection id="modificaciones" titulo="15. Modificaciones de estos términos">
            <p>
              Cualquier adecuación de los presentes términos motivada por cambios regulatorios o técnicos será publicada en este sitio indicando la fecha de entrada en vigencia.
            </p>
          </LegalSection>

          <LegalSection id="ley" titulo="16. Ley aplicable y jurisdicción">
            <p>
              Estos términos se rigen por las leyes de la República Argentina. Ante cualquier divergencia, las partes se someten a los canales y tribunales competentes de acuerdo con la legislación civil, comercial y de defensa del consumidor aplicable.
            </p>
          </LegalSection>

          <LegalSection id="contacto" titulo="17. Contacto">
            <p>
              Para consultas legales, facturación o solicitudes vinculadas a los servicios, los canales de atención oficiales son:
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-200">
              Correo electrónico: soporte@ndiweb.com<br />
              WhatsApp de atención: +54 9 388 657-5664<br />
              Ubicación: Libertador General San Martín, Provincia de Jujuy, Argentina.
            </p>
          </LegalSection>
        </article>
      </div>
    </main>
  );
}

function LegalSection({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
        {titulo}
      </h2>

      <div className="mt-3 space-y-3 text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}