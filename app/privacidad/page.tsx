import type { ReactNode } from "react";
import Link from "next/link";

const SECCIONES = [
  { id: "responsable", titulo: "1. Responsable" },
  { id: "datos", titulo: "2. Qué datos podemos tratar" },
  { id: "finalidades", titulo: "3. Para qué usamos los datos" },
  { id: "negocios", titulo: "4. Datos cargados por los negocios" },
  { id: "visitantes", titulo: "5. Visitantes de páginas públicas" },
  { id: "ia", titulo: "6. Inteligencia artificial" },
  { id: "proveedores", titulo: "7. Proveedores y transferencias" },
  { id: "pagos", titulo: "8. Pagos" },
  { id: "seguridad", titulo: "9. Seguridad y confidencialidad" },
  { id: "conservacion", titulo: "10. Conservación" },
  { id: "derechos", titulo: "11. Tus derechos" },
  { id: "menores", titulo: "12. Personas menores de edad" },
  { id: "tecnologias", titulo: "13. Cookies y tecnologías similares" },
  { id: "cambios", titulo: "14. Cambios en esta política" },
  { id: "contacto", titulo: "15. Contacto" },
];

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-zinc-950 dark:text-white">
      <div className="border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 font-semibold text-slate-950 dark:text-white"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white">
              N
            </span>

            <div>
              <p className="text-sm font-bold">NDI AI</p>
              <p className="text-xs font-normal text-slate-500 dark:text-zinc-500">
                Páginas inteligentes para negocios
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/terminos"
              className="hidden rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Términos
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Volver
            </Link>
          </div>
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Privacidad y datos personales
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Política de Privacidad de NDI AI
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-zinc-400">
            Esta política explica qué información puede tratar NDI AI, para qué
            la utiliza, con quién puede compartirla, durante cuánto tiempo puede
            conservarla y cómo ejercer tus derechos sobre tus datos personales.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-zinc-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              Última actualización: 11 de agosto de 2026
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              República Argentina
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-14">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-500">
              Contenido
            </p>

            <nav className="space-y-1">
              {SECCIONES.map((seccion) => (
                <a
                  key={seccion.id}
                  href={`#${seccion.id}`}
                  className="block rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {seccion.titulo}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="space-y-6">
          <LegalSection id="responsable" titulo="1. Responsable">
            <p>
              NDI AI es responsable del tratamiento de los datos personales que
              recolecta directamente para crear cuentas, operar la plataforma,
              administrar suscripciones, brindar soporte y mantener la seguridad
              del servicio.
            </p>

            <p>
              Cuando un negocio utiliza NDI AI para recibir consultas, reservas,
              presupuestos u otros datos de sus propios clientes y visitantes,
              ese negocio también puede actuar como responsable respecto de los
              datos que decide solicitar y utilizar para su actividad.
            </p>

            <p>
              El canal de contacto para consultas de privacidad y ejercicio de
              derechos se encuentra disponible en la sección
              <strong> Ayuda</strong> de NDI AI.
            </p>
          </LegalSection>

          <LegalSection id="datos" titulo="2. Qué datos podemos tratar">
            <p>
              Dependiendo de cómo utilices NDI AI, podemos tratar las siguientes
              categorías de información:
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                Datos de cuenta, como nombre, correo electrónico, identificador
                de usuario y datos necesarios para autenticación.
              </li>

              <li>
                Información del negocio, como nombre comercial, rubro, teléfono,
                correo, dirección, horarios, redes sociales, servicios,
                productos, precios, imágenes y contenido de la página.
              </li>

              <li>
                Información de configuración del asistente, base de conocimiento,
                instrucciones y preferencias cargadas por el negocio.
              </li>

              <li>
                Datos enviados por visitantes, por ejemplo nombre, teléfono,
                correo electrónico, consultas, solicitudes de presupuesto y datos
                necesarios para una reserva o turno.
              </li>

              <li>
                Información operativa de la plataforma, como eventos de uso,
                estado de suscripción, consumo de funciones, identificadores
                técnicos, registros de errores y datos necesarios para prevenir
                abuso o fraude.
              </li>

              <li>
                Información vinculada con pagos, como identificadores de
                operaciones, estado, importe y referencias técnicas del pago.
                NDI AI no necesita almacenar los datos completos de una tarjeta
                para registrar el resultado de una operación procesada por el
                proveedor de pagos.
              </li>
            </ul>

            <p>
              No solicitamos deliberadamente datos sensibles para el uso normal
              de la plataforma. Los usuarios y negocios no deben cargar datos
              sensibles que no sean estrictamente necesarios y legalmente
              permitidos.
            </p>
          </LegalSection>

          <LegalSection id="finalidades" titulo="3. Para qué usamos los datos">
            <p>Los datos pueden utilizarse para:</p>

            <ul className="list-disc space-y-2 pl-5">
              <li>Crear, autenticar y administrar cuentas.</li>
              <li>Crear y publicar páginas de negocios.</li>
              <li>Mostrar servicios, productos y datos de contacto.</li>
              <li>Procesar consultas, reservas y solicitudes de presupuesto.</li>
              <li>
                Configurar y operar funciones de inteligencia artificial cuando
                el plan contratado las incluya.
              </li>
              <li>Administrar planes, pagos y renovaciones.</li>
              <li>Mostrar estadísticas de uso al negocio.</li>
              <li>Prevenir fraude, abuso, accesos no autorizados y fallas.</li>
              <li>Brindar soporte y resolver problemas técnicos.</li>
              <li>
                Cumplir obligaciones legales y atender requerimientos válidos de
                autoridades competentes.
              </li>
            </ul>

            <p>
              Los datos no deben utilizarse para finalidades incompatibles con
              aquellas que motivaron su recolección.
            </p>
          </LegalSection>

          <LegalSection id="negocios" titulo="4. Datos cargados por los negocios">
            <p>
              Cada negocio decide qué información comercial carga en su panel y
              qué datos solicita a sus clientes mediante formularios, consultas,
              presupuestos o reservas.
            </p>

            <p>
              El negocio es responsable de contar con una base legítima para
              tratar los datos de sus propios clientes, informarles
              adecuadamente sobre el tratamiento y responder las solicitudes que
              correspondan.
            </p>

            <p>
              NDI AI procesa esta información para prestar las funciones
              solicitadas por el negocio y no adquiere propiedad sobre los datos
              personales cargados por sus usuarios.
            </p>
          </LegalSection>

          <LegalSection id="visitantes" titulo="5. Visitantes de páginas públicas">
            <p>
              Cuando una persona visita una página creada con NDI AI puede
              navegar información pública del negocio sin crear una cuenta.
            </p>

            <p>
              Si decide enviar un formulario, una consulta, una solicitud de
              presupuesto o una reserva, los datos proporcionados se registran
              para permitir que el negocio atienda esa solicitud.
            </p>

            <p>
              La página también puede registrar eventos básicos, como una visita,
              un contacto, una reserva creada o un clic en WhatsApp, con el fin
              de generar estadísticas para el negocio y medir el funcionamiento
              de la página.
            </p>
          </LegalSection>

          <LegalSection id="ia" titulo="6. Inteligencia artificial">
            <p>
              En Business IA, determinados datos pueden enviarse a proveedores
              tecnológicos de modelos de inteligencia artificial para generar
              respuestas solicitadas por el usuario o visitante.
            </p>

            <p>
              El contexto enviado puede incluir el mensaje de la consulta y la
              información del negocio necesaria para responder, como servicios,
              horarios, instrucciones o fragmentos de la base de conocimiento.
            </p>

            <p>
              El negocio debe evitar incorporar datos personales o sensibles
              innecesarios en instrucciones, documentos y bases de conocimiento.
              NDI AI procura limitar la información utilizada por la IA a lo
              necesario para ejecutar la función solicitada.
            </p>
          </LegalSection>

          <LegalSection id="proveedores" titulo="7. Proveedores y transferencias">
            <p>
              NDI AI utiliza proveedores tecnológicos para poder prestar el
              servicio. Según la función utilizada, pueden intervenir servicios
              de infraestructura, alojamiento, autenticación, bases de datos,
              almacenamiento, procesamiento de imágenes, inteligencia artificial
              y pagos.
            </p>

            <p>
              Entre las tecnologías utilizadas actualmente por NDI AI se
              encuentran servicios de Firebase / Google, Vercel, ImageKit,
              OpenRouter y Mercado Pago. Esta lista puede cambiar cuando sea
              necesario sustituir o incorporar proveedores para operar la
              plataforma.
            </p>

            <p>
              Algunos proveedores pueden procesar o almacenar información fuera
              de la República Argentina. En esos casos, el tratamiento y las
              transferencias se realizan conforme a las reglas aplicables y a
              las condiciones del proveedor correspondiente.
            </p>

            <p>
              NDI AI no vende datos personales a anunciantes ni comercializa
              bases de datos personales de usuarios o visitantes.
            </p>
          </LegalSection>

          <LegalSection id="pagos" titulo="8. Pagos">
            <p>
              Los pagos de NDI AI pueden procesarse mediante Mercado Pago u otro
              proveedor que se informe al momento de contratar.
            </p>

            <p>
              El proveedor de pagos procesa la información necesaria para
              autorizar la operación conforme a sus propias políticas y
              condiciones. NDI AI recibe y conserva los datos técnicos necesarios
              para identificar la transacción, acreditar el plan contratado y
              administrar la facturación.
            </p>
          </LegalSection>

          <LegalSection id="seguridad" titulo="9. Seguridad y confidencialidad">
            <p>
              NDI AI aplica medidas técnicas y organizativas destinadas a
              proteger los datos contra acceso no autorizado, alteración,
              pérdida, divulgación o uso indebido.
            </p>

            <p>
              Entre otras medidas, se utilizan autenticación, controles de
              permisos por empresa, reglas de acceso a bases de datos, separación
              de funciones de servidor y cliente y restricciones sobre campos de
              facturación y operaciones internas.
            </p>

            <p>
              Ningún sistema conectado a Internet puede garantizar seguridad
              absoluta. Si se detectara un incidente relevante, se evaluarán las
              medidas técnicas y legales correspondientes.
            </p>
          </LegalSection>

          <LegalSection id="conservacion" titulo="10. Conservación">
            <p>
              Los datos se conservan durante el tiempo necesario para prestar el
              servicio, mantener la cuenta, atender obligaciones contractuales,
              resolver reclamos, prevenir fraude y cumplir obligaciones legales.
            </p>

            <p>
              Cuando un dato deje de ser necesario para la finalidad que motivó
              su recolección, podrá ser eliminado, anonimizado o conservado
              únicamente cuando exista una obligación o fundamento legítimo para
              hacerlo.
            </p>

            <p>
              Los plazos pueden variar según el tipo de información. Los
              registros vinculados con pagos, seguridad o cumplimiento legal
              pueden requerir períodos de conservación distintos a los datos
              operativos de una página o consulta.
            </p>
          </LegalSection>

          <LegalSection id="derechos" titulo="11. Tus derechos">
            <p>
              Conforme a la normativa argentina de protección de datos
              personales, las personas titulares pueden solicitar información,
              acceso, rectificación, actualización y, cuando corresponda,
              supresión de sus datos personales.
            </p>

            <p>
              Para ejercer estos derechos deberá acreditarse razonablemente la
              identidad de la persona solicitante y especificarse el pedido.
              Las solicitudes se pueden iniciar mediante el canal de privacidad
              publicado en la sección Ayuda.
            </p>

            <p>
              De acuerdo con la normativa vigente, el derecho de acceso debe ser
              respondido dentro del plazo legal aplicable y las solicitudes de
              rectificación, actualización o supresión deben atenderse dentro de
              los plazos previstos por la Ley 25.326 y su reglamentación.
            </p>

            <p>
              La Agencia de Acceso a la Información Pública (AAIP) es la
              autoridad de control en materia de protección de datos personales
              en Argentina y puede recibir denuncias por incumplimientos de la
              normativa aplicable.
            </p>
          </LegalSection>

          <LegalSection id="menores" titulo="12. Personas menores de edad">
            <p>
              NDI AI está orientado a la gestión de negocios y no está diseñado
              específicamente para ser contratado por personas menores de edad.
            </p>

            <p>
              Los negocios que utilicen la plataforma y reciban datos de menores
              deben cumplir las obligaciones especiales que resulten aplicables
              y evitar solicitar información innecesaria.
            </p>
          </LegalSection>

          <LegalSection id="tecnologias" titulo="13. Cookies y tecnologías similares">
            <p>
              NDI AI puede utilizar cookies, almacenamiento local u otras
              tecnologías equivalentes necesarias para mantener sesiones,
              autenticación, seguridad, preferencias y funcionamiento de la
              plataforma.
            </p>

            <p>
              Si en el futuro se incorporan tecnologías adicionales con fines
              publicitarios o de seguimiento que requieran información o
              consentimiento específico, se actualizará esta política y, cuando
              corresponda, se solicitará la elección del usuario.
            </p>
          </LegalSection>

          <LegalSection id="cambios" titulo="14. Cambios en esta política">
            <p>
              Esta política puede actualizarse por cambios legales, técnicos o
              funcionales. La versión vigente indicará su fecha de última
              actualización.
            </p>

            <p>
              Cuando un cambio sea relevante para la forma en que se tratan datos
              personales, NDI AI procurará informarlo mediante la plataforma u
              otro canal disponible.
            </p>
          </LegalSection>

          <LegalSection id="contacto" titulo="15. Contacto">
            <p>
              Para consultas de privacidad o para ejercer derechos sobre datos
              personales, utilizá el canal de contacto publicado en la sección
              <strong> Ayuda</strong> de NDI AI.
            </p>

            <p>
              Para poder tramitar correctamente un pedido de acceso,
              rectificación, actualización o supresión, puede ser necesario
              verificar la identidad de la persona solicitante.
            </p>
          </LegalSection>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            Esta Política de Privacidad complementa los{" "}
            <Link
              href="/terminos"
              className="font-semibold underline underline-offset-2"
            >
              Términos y Condiciones de NDI AI
            </Link>
            .
          </div>
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
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
        {titulo}
      </h2>

      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-base dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}