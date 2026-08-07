import Link from "next/link";

const secciones = [
  {
    titulo: "1. Qué información tratamos",
    contenido: [
      "Cuando creás una cuenta podemos tratar datos básicos de registro y autenticación, como correo electrónico, identificadores técnicos y datos necesarios para mantener tu sesión.",
      "Cuando configurás una empresa podemos tratar la información que cargues voluntariamente, por ejemplo nombre del negocio, rubro, horarios, teléfonos, direcciones, servicios, precios, políticas, instrucciones y contenido de la base de conocimiento.",
      "Si conectás WhatsApp u otras integraciones disponibles, NDI AI puede tratar mensajes, identificadores de conversación, datos de contacto y metadatos necesarios para prestar el servicio.",
      "También podemos registrar información técnica y de uso necesaria para seguridad, diagnóstico, límites del plan y funcionamiento de la plataforma.",
    ],
  },
  {
    titulo: "2. Para qué usamos la información",
    contenido: [
      "Usamos la información para autenticar usuarios, prestar el servicio, generar respuestas mediante inteligencia artificial, mostrar conversaciones, aplicar automatizaciones, medir uso, gestionar planes y mejorar la seguridad.",
      "La información del negocio y de la base de conocimiento se utiliza para intentar que las respuestas de la IA sean más relevantes y acordes con la configuración realizada por el usuario.",
      "No usamos la información para vender bases de datos personales a terceros.",
    ],
  },
  {
    titulo: "3. WhatsApp y comunicaciones",
    contenido: [
      "Cuando una empresa conecta WhatsApp Business Platform, NDI AI puede recibir y procesar mensajes enviados por los clientes de esa empresa para generar respuestas automáticas y mostrarlos dentro del panel.",
      "La empresa usuaria de NDI AI es responsable de contar con las autorizaciones, avisos y bases legales que correspondan para comunicarse con sus propios clientes.",
      "El uso de WhatsApp también está sujeto a las condiciones, políticas y reglas de Meta y WhatsApp.",
    ],
  },
  {
    titulo: "4. Inteligencia artificial",
    contenido: [
      "Para generar respuestas, ciertos datos de la conversación y del negocio pueden ser enviados a proveedores de servicios de inteligencia artificial necesarios para procesar la solicitud.",
      "NDI AI intenta limitar el contenido enviado a lo necesario para prestar la función solicitada.",
      "Las respuestas de IA pueden contener errores. El usuario debe revisar la configuración, la base de conocimiento y las conversaciones cuando la precisión sea importante.",
    ],
  },
  {
    titulo: "5. Proveedores y terceros",
    contenido: [
      "NDI AI utiliza servicios de terceros para funciones como autenticación, base de datos, alojamiento, infraestructura, pagos, mensajería e inteligencia artificial.",
      "Entre estos servicios pueden encontrarse proveedores como Firebase/Google, Vercel, Meta/WhatsApp, Mercado Pago y proveedores de modelos de IA.",
      "Cada proveedor puede tratar datos conforme a sus propias políticas y a los acuerdos aplicables.",
    ],
  },
  {
    titulo: "6. Pagos",
    contenido: [
      "Los pagos de planes pagos pueden procesarse mediante Mercado Pago u otros proveedores habilitados.",
      "NDI AI no necesita almacenar los datos completos de tu tarjeta. La información de pago sensible es procesada por el proveedor de pagos correspondiente.",
      "Podemos conservar identificadores de pago, estado, importe y datos necesarios para activar o verificar un plan.",
    ],
  },
  {
    titulo: "7. Conservación y eliminación",
    contenido: [
      "Conservamos la información mientras sea necesaria para prestar el servicio, cumplir obligaciones, resolver incidencias, prevenir fraude o mantener registros legítimos.",
      "El usuario puede solicitar la eliminación de sus datos y de su cuenta utilizando el canal de contacto o soporte disponible en NDI AI.",
      "Algunos datos pueden conservarse durante más tiempo cuando exista una obligación legal, contractual, contable o de seguridad que así lo requiera.",
    ],
  },
  {
    titulo: "8. Seguridad",
    contenido: [
      "Aplicamos medidas técnicas y organizativas razonables para proteger cuentas, datos, integraciones y comunicaciones.",
      "Ningún sistema conectado a Internet puede garantizar seguridad absoluta. Por eso también es responsabilidad del usuario proteger sus credenciales y accesos.",
    ],
  },
  {
    titulo: "9. Derechos y consultas",
    contenido: [
      "Podés solicitar acceso, actualización, corrección o eliminación de información personal cuando corresponda.",
      "Para realizar una solicitud, utilizá el canal de contacto o soporte que NDI AI publique dentro del sitio o de la plataforma.",
      "Podemos solicitar información razonable para verificar que la solicitud proviene del titular de la cuenta o de una persona autorizada.",
    ],
  },
  {
    titulo: "10. Cambios en esta política",
    contenido: [
      "Esta Política de Privacidad puede actualizarse cuando cambien las funciones, proveedores, requisitos legales o prácticas de NDI AI.",
      "La versión vigente será la publicada en esta página junto con su fecha de actualización.",
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="font-bold text-white">
            NDI AI
          </Link>

          <Link
            href="/"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-blue-400">
          Información legal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Política de Privacidad
        </h1>

        <p className="mt-3 text-sm text-zinc-500">
          Última actualización: 7 de agosto de 2026
        </p>

        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-sm leading-7 text-zinc-300">
            Esta Política explica de forma general cómo NDI AI trata información
            cuando una persona utiliza la plataforma, configura su negocio,
            conecta WhatsApp o utiliza funciones de inteligencia artificial.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {secciones.map((seccion) => (
            <section key={seccion.titulo}>
              <h2 className="text-xl font-semibold text-white">
                {seccion.titulo}
              </h2>

              <div className="mt-3 space-y-3">
                {seccion.contenido.map((parrafo) => (
                  <p
                    key={parrafo}
                    className="text-sm leading-7 text-zinc-400"
                  >
                    {parrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-8 text-sm text-zinc-500">
          <p>
            Esta página describe las prácticas generales del servicio y puede
            requerir ajustes adicionales según el país, tipo de cliente o
            normativa aplicable.
          </p>

          <div className="mt-5 flex gap-5">
            <Link
              href="/terminos"
              className="text-blue-400 transition hover:text-blue-300"
            >
              Términos y Condiciones
            </Link>

            <Link
              href="/"
              className="transition hover:text-white"
            >
              Inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}