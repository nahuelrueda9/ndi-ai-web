"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

const SECCIONES = [
  { id: "responsable", titulo: "1. Responsable del tratamiento" },
  { id: "datos", titulo: "2. Datos objeto de tratamiento" },
  { id: "finalidades", titulo: "3. Finalidades del tratamiento" },
  { id: "negocios", titulo: "4. Datos de comercios y negocios" },
  { id: "visitantes", titulo: "5. Visitantes de páginas web" },
  { id: "ia", titulo: "6. Uso de modelos de lenguaje" },
  { id: "proveedores", titulo: "7. Proveedores tecnológicos" },
  { id: "pagos", titulo: "8. Gestión de cobros y pagos" },
  { id: "seguridad", titulo: "9. Medidas de seguridad" },
  { id: "conservacion", titulo: "10. Plazo de conservación" },
  { id: "derechos", titulo: "11. Derechos del titular (Ley 25.326)" },
  { id: "menores", titulo: "12. Menores de edad" },
  { id: "tecnologias", titulo: "13. Cookies y almacenamiento local" },
  { id: "cambios", titulo: "14. Modificaciones a la política" },
  { id: "contacto", titulo: "15. Contacto y ejercicio de derechos" },
];

export default function PrivacidadPage() {
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

          <div className="flex items-center gap-2">
            <Link
              href="/terminos"
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Términos
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Protección de datos personales
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl text-zinc-950 dark:text-white">
            Política de Privacidad
          </h1>

          <p className="mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            En cumplimiento de la Ley N° 25.326 de Protección de los Datos Personales de la República Argentina, esta política describe el tratamiento, conservación y protección de la información recabada a través de NDI | Diseño & Web.
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
          <LegalSection id="responsable" titulo="1. Responsable del tratamiento">
            <p>
              El responsable de los datos personales recabados para la gestión del servicio es NDI | Diseño & Web, con radicación en Libertador General San Martín, Jujuy, República Argentina, canalizando comunicaciones al correo <strong>soporte@ndiweb.com</strong>.
            </p>
          </LegalSection>

          <LegalSection id="datos" titulo="2. Datos objeto de tratamiento">
            <p>Podrán recopilarse y procesarse los siguientes datos:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Datos de contacto y cuenta:</strong> Nombre, dirección de correo electrónico, teléfono y credenciales de autenticación.</li>
              <li><strong>Información comercial del negocio:</strong> Razón social o de fantasía, rubro, lista de productos/servicios, horarios y datos para transferencias.</li>
              <li><strong>Datos de navegación técnica:</strong> Registros indispensables de seguridad, dirección IP, fecha/hora y métricas agregadas anónimas provistas por la infraestructura.</li>
            </ul>
          </LegalSection>

          <LegalSection id="finalidades" titulo="3. Finalidades del tratamiento">
            <p>
              La información recolectada se utiliza exclusivamente para: proveer los servicios contratados, configurar las páginas web solicitadas, brindar asistencia técnica personalizada, procesar transacciones y cumplir obligaciones fiscales o reglamentarias. NDI | Diseño & Web no comercializa bases de datos.
            </p>
          </LegalSection>

          <LegalSection id="negocios" titulo="4. Datos de comercios y negocios">
            <p>
              Cada cliente determina la información que incorpora en su catálogo o página. NDI | Diseño & Web actúa como prestador de la infraestructura técnica y no asume titularidad sobre los datos que los clientes publiquen u obtengan de terceros.
            </p>
          </LegalSection>

          <LegalSection id="visitantes" titulo="5. Visitantes de páginas web">
            <p>
              Los visitantes de las páginas web desarrolladas pueden consultar información sin necesidad de registro. En caso de remitir consultas por WhatsApp o turnos, la comunicación se efectúa en forma directa con el comercio correspondiente.
            </p>
          </LegalSection>

          <LegalSection id="ia" titulo="6. Uso de modelos de lenguaje">
            <p>
              En caso de contratarse planes con asistente automatizado, la información comercial provista se transfiere al procesador del modelo con el único propósito de responder las consultas entrantes del visitante.
            </p>
          </LegalSection>

          <LegalSection id="proveedores" titulo="7. Proveedores tecnológicos">
            <p>
              Se utilizan plataformas de infraestructura y hosting seguras (Vercel, Firebase/Google Cloud, Mercado Pago). Estos proveedores aplican estándares internacionales de protección y seguridad de la información.
            </p>
          </LegalSection>

          <LegalSection id="pagos" titulo="8. Gestión de cobros y pagos">
            <p>
              Las operaciones monetarias con tarjeta o dinero en cuenta se gestionan a través de Mercado Pago. NDI | Diseño & Web no almacena datos de tarjetas de crédito o débito en sus servidores propios.
            </p>
          </LegalSection>

          <LegalSection id="seguridad" titulo="9. Medidas de seguridad">
            <p>
              Se implementan protocolos de cifrado HTTPS/SSL, reglas de acceso restringido y mecanismos de autenticación seguros para preservar la integridad y confidencialidad de los datos.
            </p>
          </LegalSection>

          <LegalSection id="conservacion" titulo="10. Plazo de conservación">
            <p>
              Los datos se conservan durante el período que perdure la relación contractual o mientras resulte exigible para dar cumplimiento a obligaciones contables o legales aplicables en el país.
            </p>
          </LegalSection>

          <LegalSection id="derechos" titulo="11. Derechos del titular (Ley 25.326)">
            <p>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.
            </p>
            <p>
              Asimismo, asiste el derecho de solicitar la rectificación, actualización o supresión de los datos registrados escribiendo a <strong>soporte@ndiweb.com</strong>.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.
            </p>
          </LegalSection>

          <LegalSection id="menores" titulo="12. Menores de edad">
            <p>
              Los servicios están destinados a personas con capacidad legal para contratar. No se recaban deliberadamente datos personales de menores de edad.
            </p>
          </LegalSection>

          <LegalSection id="tecnologias" titulo="13. Cookies y almacenamiento local">
            <p>
              Se utiliza almacenamiento local exclusivamente con fines técnicos, como conservar la preferencia de tema visual (modo claro u oscuro) y mantener la sesión del usuario.
            </p>
          </LegalSection>

          <LegalSection id="cambios" titulo="14. Modificaciones a la política">
            <p>
              Esta política puede actualizarse ante cambios normativos o técnicos. Cualquier modificación será publicada en esta misma página indicando la fecha de revisión.
            </p>
          </LegalSection>

          <LegalSection id="contacto" titulo="15. Contacto y ejercicio de derechos">
            <p>
              Para ejercer los derechos de acceso, rectificación o supresión, contactarse con:
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-200">
              Correo: soporte@ndiweb.com<br />
              Domicilio: Libertador General San Martín, Jujuy, Argentina.
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
  children: ReactNode;
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