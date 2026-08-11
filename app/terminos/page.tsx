"use client";

import Link from "next/link";

const SECCIONES = [
  { id: "servicio", titulo: "1. Sobre NDI AI" },
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
  { id: "consumidor", titulo: "13. Derechos del consumidor" },
  { id: "propiedad", titulo: "14. Propiedad intelectual" },
  { id: "modificaciones", titulo: "15. Modificaciones de estos términos" },
  { id: "ley", titulo: "16. Ley aplicable" },
  { id: "contacto", titulo: "17. Contacto" },
];

export default function TerminosPage() {
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

          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Volver
          </Link>
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Información legal
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Términos y Condiciones de NDI AI
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 dark:text-zinc-400">
            Estos términos regulan el acceso, contratación y uso de NDI AI.
            Al crear una cuenta, contratar un plan o utilizar la plataforma,
            aceptás estas condiciones.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-zinc-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              Última actualización: 11 de agosto de 2026
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
              Argentina
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
          <LegalSection id="servicio" titulo="1. Sobre NDI AI">
            <p>
              NDI AI es una plataforma digital orientada a negocios que permite
              crear y administrar páginas públicas, catálogo de servicios,
              datos de contacto y, según el plan contratado, productos,
              presupuestos, reservas, agenda, estadísticas y funciones de
              inteligencia artificial.
            </p>

            <p>
              La plataforma se encuentra en evolución. Algunas funciones pueden
              estar identificadas como “Próximamente” y no forman parte del
              servicio activo hasta que NDI AI indique expresamente lo
              contrario.
            </p>
          </LegalSection>

          <LegalSection id="cuenta" titulo="2. Cuenta y acceso">
            <p>
              Para utilizar el panel de administración es necesario crear una
              cuenta y proporcionar información verdadera, actualizada y
              suficiente para identificar al usuario y al negocio.
            </p>

            <p>
              Cada usuario es responsable de mantener la confidencialidad de sus
              credenciales, del uso realizado desde su cuenta y de informar
              cualquier acceso no autorizado que detecte.
            </p>

            <p>
              NDI AI puede limitar o bloquear accesos cuando existan indicios
              razonables de uso indebido, fraude, vulneración de seguridad o
              incumplimiento de estos términos.
            </p>
          </LegalSection>

          <LegalSection id="planes" titulo="3. Planes y contratación">
            <p>
              NDI AI ofrece actualmente tres modalidades comerciales:
              <strong> Página Simple</strong>,
              <strong> Página Completa</strong> y
              <strong> Business IA</strong>. Los nombres internos utilizados
              por el sistema pueden diferir de los nombres comerciales por
              razones técnicas.
            </p>

            <p>
              Todos los planes comerciales son pagos. La creación de una empresa
              dentro del panel no implica por sí sola la contratación ni la
              activación de un plan.
            </p>

            <p>
              Las funciones, precios de puesta en marcha, mensualidades,
              promociones y límites aplicables serán los informados en la
              pantalla de Planes y en el proceso de pago vigente al momento de
              contratar.
            </p>
          </LegalSection>

          <LegalSection id="pagos" titulo="4. Pagos y renovaciones">
            <p>
              La contratación inicial puede incluir un importe de puesta en
              marcha más la primera mensualidad. El detalle exacto se informa
              antes de confirmar el pago.
            </p>

            <p>
              Actualmente las renovaciones mensuales se realizan de forma
              manual. NDI AI no efectuará un débito recurrente automático salvo
              que en el futuro el usuario habilite expresamente una modalidad
              de cobro recurrente y acepte sus condiciones.
            </p>

            <p>
              Cuando una suscripción vence sin renovación, las funciones que
              requieren un plan activo pueden quedar suspendidas hasta que se
              registre un nuevo pago aprobado.
            </p>

            <p>
              Si una renovación se realiza antes del vencimiento y el sistema
              así lo permite, el nuevo período se adicionará al período ya
              abonado sin descontar los días restantes.
            </p>

            <p>
              Los clientes de Business IA que hayan contratado una promoción de
              precio de lanzamiento conservarán la mensualidad contratada
              mientras mantengan las condiciones informadas al contratar y no se
              interrumpa la continuidad exigida por dicha promoción.
            </p>

            <p>
              Los pagos son procesados por proveedores externos de pago. La
              aprobación, rechazo o acreditación de una operación puede depender
              también de dichos proveedores.
            </p>
          </LegalSection>

          <LegalSection id="funciones" titulo="5. Funciones del servicio">
            <p>
              Las funciones disponibles dependen del plan contratado y de que la
              suscripción se encuentre activa.
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Página Simple:</strong> página pública profesional,
                servicios, información del negocio, horarios, ubicación,
                contacto, WhatsApp directo, redes sociales y estadísticas
                básicas.
              </li>

              <li>
                <strong>Página Completa:</strong> incluye lo anterior y agrega
                productos, catálogo ampliado, QR, presupuestos, agenda, reservas
                online, gestión de turnos y estadísticas avanzadas.
              </li>

              <li>
                <strong>Business IA:</strong> incluye Página Completa y agrega
                asistente con inteligencia artificial, base de conocimiento,
                consultas, widget web, atención humana y otras funciones
                relacionadas con IA habilitadas en el producto.
              </li>
            </ul>

            <p>
              Las integraciones automáticas con WhatsApp, Instagram y Facebook /
              Messenger no se consideran activas mientras aparezcan identificadas
              como “Próximamente”.
            </p>
          </LegalSection>

          <LegalSection id="ia" titulo="6. Asistente con inteligencia artificial">
            <p>
              Business IA utiliza modelos de inteligencia artificial para
              generar respuestas a partir de la información configurada por el
              negocio, su base de conocimiento, servicios y demás datos
              disponibles.
            </p>

            <p>
              Las respuestas generadas automáticamente pueden contener errores,
              omisiones o interpretaciones incorrectas. El titular del negocio
              debe revisar la información sensible o relevante y no debe utilizar
              la IA como única fuente para decisiones médicas, legales,
              financieras, de seguridad u otras decisiones de alto impacto.
            </p>

            <p>
              El negocio es responsable de configurar instrucciones, precios,
              políticas, horarios y demás información real que el asistente
              utilizará para responder.
            </p>
          </LegalSection>

          <LegalSection id="contenido" titulo="7. Contenido del negocio">
            <p>
              El usuario conserva la responsabilidad sobre textos, imágenes,
              marcas, precios, promociones, productos, servicios, horarios,
              políticas y cualquier otro contenido que cargue en NDI AI.
            </p>

            <p>
              El usuario declara contar con los derechos o autorizaciones
              necesarias para publicar dicho contenido y se compromete a no
              utilizar la plataforma para actividades ilícitas, engañosas,
              fraudulentas o que vulneren derechos de terceros.
            </p>

            <p>
              NDI AI puede retirar o limitar contenido cuando exista una
              obligación legal, un reclamo válido de terceros o un riesgo
              razonable para la plataforma o sus usuarios.
            </p>
          </LegalSection>

          <LegalSection id="datos" titulo="8. Datos de clientes y visitantes">
            <p>
              Las páginas creadas con NDI AI pueden recibir consultas, datos de
              contacto, solicitudes de presupuesto, reservas u otra información
              enviada voluntariamente por visitantes.
            </p>

            <p>
              El negocio que utiliza NDI AI es responsable de utilizar esos datos
              de manera legítima, transparente y acorde con la normativa
              aplicable. Cuando corresponda, deberá informar a sus propios
              clientes y visitantes sobre el tratamiento de sus datos y obtener
              los consentimientos necesarios.
            </p>

            <p>
              El tratamiento realizado directamente por NDI AI se describe con
              mayor detalle en la Política de Privacidad de la plataforma.
            </p>
          </LegalSection>

          <LegalSection id="terceros" titulo="9. Servicios de terceros">
            <p>
              Para funcionar, NDI AI puede utilizar proveedores tecnológicos
              externos para infraestructura, alojamiento, almacenamiento,
              procesamiento de imágenes, inteligencia artificial, autenticación
              y pagos.
            </p>

            <p>
              Determinadas interrupciones, demoras o fallas originadas
              exclusivamente en dichos proveedores pueden afectar temporalmente
              partes del servicio.
            </p>
          </LegalSection>

          <LegalSection id="disponibilidad" titulo="10. Disponibilidad y cambios">
            <p>
              NDI AI busca mantener el servicio disponible de manera continua,
              pero no garantiza disponibilidad ininterrumpida o libre de errores.
              Puede realizar mantenimiento, correcciones, mejoras o cambios
              técnicos cuando resulten necesarios.
            </p>

            <p>
              Las funciones pueden evolucionar siempre que no se eliminen
              arbitrariamente prestaciones esenciales ya contratadas durante un
              período pago, salvo que exista una causa técnica, legal, de
              seguridad o de fuerza mayor que lo justifique.
            </p>
          </LegalSection>

          <LegalSection id="suspension" titulo="11. Suspensión o finalización">
            <p>
              El usuario puede dejar de renovar el servicio. Al finalizar el
              período abonado, las funciones pagas pueden quedar deshabilitadas.
            </p>

            <p>
              NDI AI puede suspender o finalizar una cuenta por incumplimiento
              grave de estos términos, fraude, uso abusivo, intento de vulnerar
              la seguridad, utilización ilícita de la plataforma o falta de pago.
            </p>

            <p>
              Cuando sea razonablemente posible, se procurará informar al usuario
              antes de una suspensión no urgente.
            </p>
          </LegalSection>

          <LegalSection id="responsabilidad" titulo="12. Responsabilidad">
            <p>
              NDI AI presta una herramienta tecnológica para facilitar la
              presencia digital y la gestión comercial del negocio. No garantiza
              una cantidad determinada de ventas, clientes, reservas,
              conversiones, ingresos ni resultados comerciales.
            </p>

            <p>
              El usuario continúa siendo responsable de la relación comercial con
              sus clientes, de la calidad de sus productos o servicios, de sus
              precios, promociones, cumplimiento fiscal, atención, reservas,
              devoluciones y demás obligaciones propias de su actividad.
            </p>

            <p>
              Ninguna cláusula de estos términos limita derechos que por ley no
              puedan ser renunciados o excluidos.
            </p>
          </LegalSection>

          <LegalSection id="consumidor" titulo="13. Derechos del consumidor">
            <p>
              Cuando quien contrata NDI AI reúna legalmente la calidad de
              consumidor o usuario final, conservará todos los derechos
              reconocidos por la normativa argentina de defensa del consumidor y
              por el Código Civil y Comercial.
            </p>

            <p>
              Esto incluye, cuando resulte aplicable, los derechos vinculados con
              información clara, contratación a distancia, revocación,
              arrepentimiento y mecanismos de baja. Ninguna disposición de estos
              términos pretende eliminar derechos irrenunciables.
            </p>
          </LegalSection>

          <LegalSection id="propiedad" titulo="14. Propiedad intelectual">
            <p>
              NDI AI, su software, diseño, código, identidad visual, estructura y
              demás elementos propios de la plataforma están protegidos por las
              normas de propiedad intelectual aplicables.
            </p>

            <p>
              La contratación de un plan otorga únicamente un derecho de uso
              durante la vigencia del servicio. No implica cesión de propiedad
              sobre el software o la tecnología de NDI AI.
            </p>

            <p>
              El contenido propio que el negocio carga en la plataforma continúa
              perteneciendo a su titular o a quien corresponda legalmente.
            </p>
          </LegalSection>

          <LegalSection id="modificaciones" titulo="15. Modificaciones de estos términos">
            <p>
              NDI AI puede actualizar estos términos para reflejar cambios
              legales, técnicos, comerciales o funcionales.
            </p>

            <p>
              Cuando una modificación sea relevante para una relación contractual
              vigente, se procurará comunicarla mediante la plataforma u otro
              canal disponible con una antelación razonable cuando corresponda.
            </p>
          </LegalSection>

          <LegalSection id="ley" titulo="16. Ley aplicable">
            <p>
              Estos términos se interpretan conforme a la legislación de la
              República Argentina, sin perjuicio de las normas imperativas que
              resulten aplicables según el domicilio o condición jurídica del
              usuario.
            </p>

            <p>
              En caso de conflicto, las partes procurarán primero una solución
              directa y de buena fe. Cuando corresponda una relación de consumo,
              se respetarán los mecanismos y jurisdicciones previstos por la
              normativa de protección al consumidor.
            </p>
          </LegalSection>

          <LegalSection id="contacto" titulo="17. Contacto">
            <p>
              Para consultas sobre estos términos, facturación, baja del servicio
              o funcionamiento de la plataforma, podés utilizar la sección
              <strong> Ayuda</strong> disponible dentro de NDI AI y los canales
              de contacto que allí se encuentren publicados.
            </p>
          </LegalSection>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
            Esta página establece las condiciones generales de uso de NDI AI.
            La Política de Privacidad complementa estas condiciones en todo lo
            relacionado con datos personales.
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
  children: React.ReactNode;
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