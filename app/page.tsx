"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Zap,
} from "lucide-react";

const funciones = [
  {
    titulo: "WhatsApp con IA",
    descripcion:
      "Tus clientes escriben al WhatsApp de tu negocio y NDI AI responde automáticamente usando la información que cargaste.",
    icono: MessageCircle,
  },
  {
    titulo: "Respuestas con tu información",
    descripcion:
      "Cargá servicios, precios, horarios, preguntas frecuentes y políticas para que la IA responda con datos reales.",
    icono: Sparkles,
  },
  {
    titulo: "Control humano",
    descripcion:
      "Revisá las conversaciones y tomá el control manualmente cuando una consulta necesite una persona.",
    icono: UserRoundCheck,
  },
  {
    titulo: "Disponible mientras trabajás",
    descripcion:
      "Automatizá consultas repetitivas y evitá dejar clientes esperando cuando estás ocupado.",
    icono: Clock3,
  },
];

const pasos = [
  ["01", "Configurá tu negocio", "Definí cómo se llama tu empresa, qué ofrece y cómo querés que responda la IA."],
  ["02", "Cargá tu información", "Agregá precios, servicios, horarios, políticas y preguntas frecuentes."],
  ["03", "Conectá WhatsApp", "Vinculá tu WhatsApp Business Platform desde el panel de Integraciones."],
  ["04", "Dejá que NDI AI responda", "La IA atiende consultas y vos podés entrar a cualquier conversación cuando quieras."],
];

const freeFeatures = [
  "WhatsApp + respuestas con IA",
  "50 conversaciones por mes",
  "250 respuestas de IA por mes",
  "Base de conocimiento",
  "Panel de conversaciones",
  "Estadísticas básicas",
  "Firma “Respondido con NDI AI” en la primera respuesta",
];

const proFeatures = [
  "Todo lo incluido en Free",
  "1.000 conversaciones por mes",
  "5.000 respuestas de IA por mes",
  "Widget web",
  "Automatizaciones",
  "Agenda y turnos",
  "Equipo y operadores",
  "Estadísticas avanzadas",
  "Sin firma ni publicidad de NDI AI",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-400">NDI AI</p>
              <p className="font-semibold text-white">Atención inteligente</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-white sm:px-4">
              Iniciar sesión
            </Link>
            <Link href="/register" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
              Empezar gratis
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.20),transparent_62%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300">
              <Zap className="h-4 w-4" />
              IA para atender clientes por WhatsApp
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Tus clientes escriben.
              <span className="text-blue-400"> NDI AI responde por vos.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Pensado para emprendedores y negocios que reciben consultas por WhatsApp y no pueden estar respondiendo todo el día. La IA usa la información de tu negocio y vos mantenés el control.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500">
                Probar gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-6 py-3.5 font-semibold text-zinc-200 transition hover:bg-zinc-900">
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-400">
              {["Plan Free", "Sin tarjeta", "Tutorial incluido"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-600/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
                <div>
                  <p className="font-semibold">WhatsApp · Atención automática</p>
                  <p className="mt-1 text-xs text-zinc-500">NDI AI atendiendo por tu negocio</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">IA activa</span>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex justify-start">
                  <div className="max-w-[82%] rounded-2xl rounded-tl-md bg-zinc-800 px-4 py-3">
                    <p className="text-sm leading-6 text-zinc-200">Hola, ¿hasta qué hora atienden hoy?</p>
                    <p className="mt-2 text-[11px] text-zinc-500">Cliente · WhatsApp</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-blue-600 px-4 py-3">
                    <p className="text-sm leading-6 text-white">¡Hola! Hoy atendemos de 9:00 a 18:00. ¿Necesitás que te ayude con algo más?</p>
                    <p className="mt-2 text-[11px] text-blue-200">Respondido por NDI AI</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Vos seguís teniendo el control</p>
                      <p className="mt-1 text-xs text-zinc-500">Podés tomar la conversación manualmente desde el panel.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Hecho para negocios que reciben consultas todos los días
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["24/7", "La IA puede recibir consultas a cualquier hora"],
              ["1 panel", "Para revisar conversaciones y tomar el control"],
              ["$0", "Para empezar con el plan Free"],
            ].map(([valor, texto]) => (
              <div key={valor} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-center">
                <p className="text-2xl font-bold text-white">{valor}</p>
                <p className="mt-1 text-sm text-zinc-500">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-blue-400">Qué hace NDI AI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Menos tiempo respondiendo lo mismo. Más tiempo para tu negocio.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {funciones.map(({ titulo, descripcion, icono: Icono }) => (
            <article key={titulo} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Icono className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{titulo}</h3>
              <p className="mt-3 leading-7 text-zinc-400">{descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-400">Cómo funciona</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              De cero a una IA atendiendo tu WhatsApp.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {pasos.map(([numero, titulo, descripcion]) => (
              <div key={numero} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <span className="text-sm font-bold text-blue-400">{numero}</span>
                <h3 className="mt-3 text-xl font-semibold">{titulo}</h3>
                <p className="mt-3 leading-7 text-zinc-400">{descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-blue-400">Planes</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Empezá gratis. Pasá a Pro cuando necesites más.
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <PlanCard
            nombre="Free"
            precio="$0"
            descripcion="Para probar NDI AI atendiendo consultas reales de tu negocio."
            features={freeFeatures}
          />
          <PlanCard
            nombre="Pro"
            precio="$14.999"
            sufijo="/ 30 días"
            descripcion="Para negocios que necesitan más volumen y herramientas para organizar la atención."
            features={proFeatures}
            destacado
          />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-zinc-600">
          Instagram y Facebook/Messenger se incorporarán cuando sus integraciones estén disponibles. No forman parte de las funciones activas actuales.
        </p>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-8">
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 px-6 py-12 sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Que una consulta no se pierda porque estabas ocupado.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-300">
              Creá tu cuenta gratis, cargá la información de tu negocio y prepará NDI AI para responder por vos.
            </p>
            <Link href="/register" className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-500">
              Empezar gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 NDI AI. Todos los derechos reservados.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacidad" className="transition hover:text-white">Privacidad</Link>
            <Link href="/terminos" className="transition hover:text-white">Términos</Link>
            <Link href="/login" className="transition hover:text-white">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PlanCard({
  nombre,
  precio,
  sufijo,
  descripcion,
  features,
  destacado = false,
}: {
  nombre: string;
  precio: string;
  sufijo?: string;
  descripcion: string;
  features: string[];
  destacado?: boolean;
}) {
  return (
    <article className={`relative rounded-3xl p-7 sm:p-8 ${
      destacado
        ? "border border-blue-500/30 bg-blue-500/5"
        : "border border-zinc-800 bg-zinc-900"
    }`}>
      {destacado && (
        <span className="absolute right-6 top-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Recomendado
        </span>
      )}

      <p className={destacado ? "text-sm font-medium text-blue-400" : "text-sm font-medium text-zinc-400"}>
        {nombre}
      </p>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold">{precio}</span>
        {sufijo && <span className="pb-1 text-sm text-zinc-500">{sufijo}</span>}
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{descripcion}</p>

      <div className="mt-7 space-y-3">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${destacado ? "text-blue-400" : "text-emerald-400"}`} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Link
        href="/register"
        className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold text-white transition ${
          destacado
            ? "bg-blue-600 hover:bg-blue-500"
            : "border border-zinc-700 hover:bg-zinc-800"
        }`}
      >
        {destacado ? "Crear cuenta" : "Empezar gratis"}
      </Link>
    </article>
  );
}