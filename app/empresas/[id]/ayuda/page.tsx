"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Code2,
  CreditCard,
  FileText,
  Globe2,
  MessageSquare,
  Package,
  Plug,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

type Disponibilidad =
  | "todos"
  | "completa"
  | "business"
  | "proximamente";

type Paso = {
  numero: number;
  titulo: string;
  descripcion: string;
  detalles: string[];
  ruta?: string;
  boton?: string;
  icono: React.ReactNode;
  disponibilidad: Disponibilidad;
};

function etiquetaDisponibilidad(
  disponibilidad: Disponibilidad,
) {
  switch (disponibilidad) {
    case "todos":
      return {
        texto: "Todos los planes",
        clase:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      };

    case "completa":
      return {
        texto: "Desde Página Completa",
        clase:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
      };

    case "business":
      return {
        texto: "Business IA",
        clase:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300",
      };

    case "proximamente":
      return {
        texto: "Próximamente",
        clase:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
      };
  }
}

export default function AyudaPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa,
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const pasos: Paso[] = [
    {
      numero: 1,
      titulo: "Prepará tu página",
      descripcion:
        "Cargá la información principal que van a ver tus clientes.",
      detalles: [
        "Completá nombre, descripción, teléfono, horarios y ubicación.",
        "Subí logo, portada e imágenes del negocio.",
        "Agregá redes sociales y elegí qué secciones querés mostrar.",
        "Definí una dirección para tu página y publicala cuando esté lista.",
      ],
      ruta: "",
      boton: "Ir a Mi página",
      icono: <Globe2 className="h-5 w-5" />,
      disponibilidad: "todos",
    },
    {
      numero: 2,
      titulo: "Cargá lo que ofrecés",
      descripcion:
        "Armá el catálogo que van a consultar tus clientes.",
      detalles: [
        "Página Simple permite cargar servicios, precios, duración e imágenes.",
        "Página Completa y Business IA también permiten cargar productos.",
        "Podés ocultar temporalmente un elemento sin eliminarlo.",
        "Mantené precios y descripciones actualizados.",
      ],
      ruta: "catalogo",
      boton: "Servicios y productos",
      icono: <Package className="h-5 w-5" />,
      disponibilidad: "todos",
    },
    {
      numero: 3,
      titulo: "Configurá Agenda y reservas",
      descripcion:
        "Definí cuándo pueden reservar tus clientes y administrá los turnos.",
      detalles: [
        "Elegí los días y horarios disponibles.",
        "Definí el intervalo entre turnos y los horarios de descanso.",
        "Los clientes podrán reservar desde la página pública.",
        "Confirmá, completá, cancelá o editá turnos desde el calendario.",
      ],
      ruta: "agenda",
      boton: "Abrir Agenda",
      icono: <CalendarDays className="h-5 w-5" />,
      disponibilidad: "completa",
    },
    {
      numero: 4,
      titulo: "Configurá el Asistente IA",
      descripcion:
        "Definí cómo debe presentarse, responder y comportarse la IA.",
      detalles: [
        "Elegí el nombre y rol del asistente.",
        "Definí su personalidad y objetivo principal.",
        "Agregá instrucciones claras sobre cómo debe atender.",
        "Indicá expresamente qué información no debe inventar.",
      ],
      ruta: "configuracion",
      boton: "Configurar Asistente IA",
      icono: <Bot className="h-5 w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 5,
      titulo: "Armá la Base de conocimiento",
      descripcion:
        "Agregá información real del negocio para mejorar las respuestas de la IA.",
      detalles: [
        "Cargá preguntas frecuentes, políticas y condiciones importantes.",
        "No dupliques precios o datos que ya estén correctamente cargados en el catálogo.",
        "Actualizá la información cuando cambie algo en el negocio.",
        "La IA usa esta base como contexto para responder con mayor precisión.",
      ],
      ruta: "conocimiento",
      boton: "Base de conocimiento",
      icono: <BookOpen className="h-5 w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 6,
      titulo: "Probá la IA antes de publicarla",
      descripcion:
        "Hacé consultas de prueba como si fueras un cliente.",
      detalles: [
        "Preguntá por servicios, precios, horarios y ubicación.",
        "Probá preguntas poco claras y preguntas de seguimiento.",
        "Si una respuesta está mal, corregí la información o las instrucciones.",
        "Repetí la prueba hasta que las respuestas sean consistentes.",
      ],
      ruta: "probar",
      boton: "Probar asistente",
      icono: <Sparkles className="h-5 w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 7,
      titulo: "Instalá el Widget web",
      descripcion:
        "Usá el asistente de NDI AI dentro de otra página web.",
      detalles: [
        "Personalizá nombre, bienvenida, colores, tema y posición.",
        "Copiá el script generado desde Widget web.",
        "Pegalo antes del cierre de </body> en el sitio donde quieras mostrarlo.",
        "En la página inteligente de NDI AI el asistente funciona sin instalar ese script.",
      ],
      ruta: "widget",
      boton: "Abrir Widget web",
      icono: <Code2 className="h-5 w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 8,
      titulo: "Revisá consultas y estadísticas",
      descripcion:
        "Usá el panel para entender qué hacen tus clientes.",
      detalles: [
        "Estadísticas muestra visitas, contactos y actividad de la página.",
        "Las consultas del asistente se registran en Business IA.",
        "Podés revisar conversaciones y tomar la atención manualmente cuando sea necesario.",
        "Usá estos datos para mejorar la página y la información del negocio.",
      ],
      ruta: "estadisticas",
      boton: "Ver Estadísticas",
      icono: <BarChart3 className="h-5 w-5" />,
      disponibilidad: "todos",
    },
  ];

  if (!empresaId) {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-red-700 dark:text-red-300">
            No se encontró la empresa.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-8 text-foreground sm:px-8">
      <header className="mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          <CircleHelp className="h-6 w-6" />
        </div>

        <p className="mt-5 text-sm font-medium text-blue-700 dark:text-blue-400">
          Centro de ayuda
        </p>

        <h1
          className="mt-2 text-3xl font-bold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          Cómo usar NDI AI
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-zinc-300">
          Seguí esta guía para preparar tu página inteligente,
          cargar lo que ofrecés y activar las funciones incluidas
          en tu plan.
        </p>
      </header>

      <Card className="mb-8 border-blue-200 bg-blue-50 p-6 dark:border-blue-500/20 dark:bg-blue-500/5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2
              className="font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              La idea principal
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              NDI AI te permite tener una página profesional para tu
              negocio, mostrar servicios y productos, recibir consultas
              y, según tu plan, gestionar reservas y atender clientes con
              inteligencia artificial.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {pasos.map((paso) => {
          const etiqueta =
            etiquetaDisponibilidad(
              paso.disponibilidad,
            );

          return (
            <Card
              key={paso.numero}
              className="p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {paso.icono}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-zinc-500">
                        Paso {paso.numero}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${etiqueta.clase}`}
                      >
                        {etiqueta.texto}
                      </span>
                    </div>

                    <h2
                      className="mt-1 text-xl font-semibold"
                      style={{
                        color: "var(--foreground)",
                      }}
                    >
                      {paso.titulo}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-zinc-300">
                      {paso.descripcion}
                    </p>

                    <div className="mt-4 space-y-2">
                      {paso.detalles.map(
                        (detalle) => (
                          <div
                            key={detalle}
                            className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            <span>{detalle}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {paso.ruta !== undefined &&
                  paso.boton && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() =>
                        router.push(
                          paso.ruta
                            ? `/empresas/${empresaId}/${paso.ruta}`
                            : `/empresas/${empresaId}`,
                        )
                      }
                    >
                      {paso.boton}
                    </Button>
                  )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-violet-700 dark:text-violet-400" />

            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Qué incluye cada plan
            </h2>
          </div>

          <div className="mt-5 space-y-5 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Página Simple
              </p>
              <p className="mt-1">
                Página pública, servicios, horarios, ubicación,
                contacto, WhatsApp directo, redes sociales y
                estadísticas básicas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Página Completa
              </p>
              <p className="mt-1">
                Todo lo anterior más productos, catálogo ampliado,
                presupuestos, QR, Agenda, reservas online y
                estadísticas avanzadas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Business IA
              </p>
              <p className="mt-1">
                Todo Página Completa más Asistente IA, Base de
                conocimiento, consultas, Widget web y atención humana.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="mt-5"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`,
              )
            }
          >
            Ver planes
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />

            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Renovación y facturación
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            <p>
              La contratación inicial incluye la puesta en marcha
              más la primera mensualidad.
            </p>

            <p>
              La renovación actual es manual: desde Planes podés
              renovar pagando únicamente la mensualidad correspondiente.
            </p>

            <p>
              Si renovás antes del vencimiento, los días nuevos se
              suman al período que todavía tengas vigente.
            </p>

            <p>
              Si el plan vence sin renovación, las funciones pagas
              quedan deshabilitadas hasta que vuelvas a activarlo.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/facturacion`,
              )
            }
          >
            Ir a Facturación
          </Button>
        </Card>
      </div>

      <Card className="mt-8 border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-500/5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <Plug className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="font-semibold"
                style={{
                  color: "var(--foreground)",
                }}
              >
                WhatsApp, Instagram y Facebook / Messenger
              </h2>

              <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                Próximamente
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Las integraciones automáticas con estos canales todavía
              no forman parte del servicio activo. No necesitás
              configurar Meta para usar la página inteligente de NDI AI.
              El botón normal de WhatsApp de tu página sí puede usarse
              con el número cargado en el negocio.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" />

            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Información legal
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            Podés consultar las condiciones generales del servicio y
            cómo NDI AI trata los datos personales.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/terminos"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Términos y Condiciones
            </Link>

            <Link
              href="/privacidad"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Política de Privacidad
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CircleHelp className="h-5 w-5 text-violet-700 dark:text-violet-400" />

            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Soporte
            </h2>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            Si algo no funciona como esperás, anotá qué estabas
            intentando hacer, qué mensaje apareció y, si es posible,
            guardá una captura de pantalla. Esa información facilita
            mucho la resolución del problema.
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            Utilizá el canal de soporte que NDI AI te haya informado
            al momento de la contratación.
          </p>
        </Card>
      </div>

      <Card className="mt-8 border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2
              className="font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              ¿No sabés por dónde empezar?
            </h2>

            <p className="mt-1 text-sm text-slate-700 dark:text-zinc-300">
              Empezá por Mi página, cargá la información básica del
              negocio y después seguí los pasos de esta guía.
            </p>
          </div>

          <Button
            type="button"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}`,
              )
            }
          >
            Empezar ahora
          </Button>
        </div>
      </Card>
    </section>
  );
}