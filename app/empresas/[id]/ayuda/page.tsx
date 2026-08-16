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
        "Definí una dirección única para tu página y publicala cuando esté lista.",
      ],
      ruta: "",
      boton: "Ir a Mi página",
      icono: <Globe2 className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "todos",
    },
    {
      numero: 2,
      titulo: "Cargá servicios y productos",
      descripcion:
        "Armá el catálogo básico que van a consultar tus clientes.",
      detalles: [
        "Página Simple permite mostrar servicios, productos o menú básico con hasta 1 imagen por elemento.",
        "Página Completa y Business IA amplían el catálogo y permiten hasta 3 imágenes por elemento.",
        "Podés cargar precio, descripción, duración cuando corresponda y ocultar elementos sin eliminarlos.",
        "Mantené precios, disponibilidad y descripciones actualizados.",
      ],
      ruta: "catalogo",
      boton: "Servicios y productos",
      icono: <Package className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "todos",
    },
    {
      numero: 3,
      titulo: "Configurá Agenda y reservas",
      descripcion:
        "Definí cuándo pueden reservar tus clientes y administrá la disponibilidad.",
      detalles: [
        "Elegí los días, horarios, intervalos y descansos disponibles.",
        "Consultorios y barberías pueden recibir turnos desde la página pública.",
        "Hoteles y alojamientos pueden gestionar reservas según su configuración.",
        "Los horarios ocupados dejan de ofrecerse automáticamente para evitar reservas superpuestas.",
      ],
      ruta: "agenda",
      boton: "Abrir Agenda",
      icono: <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "completa",
    },
    {
      numero: 4,
      titulo: "Recibí solicitudes de presupuesto",
      descripcion:
        "Permití que los clientes pidan una cotización desde tu página.",
      detalles: [
        "La función está disponible desde Página Completa.",
        "Activá la opción de presupuesto desde Mi página cuando quieras mostrarla.",
        "Las solicitudes quedan separadas de las consultas del asistente.",
        "Revisalas desde Presupuestos y continuá el contacto con el cliente.",
      ],
      ruta: "presupuestos",
      boton: "Abrir Presupuestos",
      icono: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "completa",
    },
    {
      numero: 5,
      titulo: "Usá las funciones de tu rubro",
      descripcion:
        "Página Completa y Business IA habilitan herramientas específicas según el tipo de negocio.",
      detalles: [
        "Restaurantes pueden recibir pedidos online y reservas de mesa.",
        "Hoteles y hostales pueden recibir reservas.",
        "Consultorios y barberías pueden administrar turnos.",
        "Tiendas aprovechan el catálogo ampliado con hasta 3 imágenes por producto.",
      ],
      icono: <Plug className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "completa",
    },
    {
      numero: 6,
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
      icono: <Bot className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 7,
      titulo: "Armá la Base de conocimiento",
      descripcion:
        "Agregá información real del negocio para mejorar las respuestas de la IA.",
      detalles: [
        "Cargá preguntas frecuentes, políticas y condiciones importantes.",
        "No dupliques precios o datos que ya estén correctamente cargados en el catálogo.",
        "Actualizá la información cuando cambie algo en el negocio.",
        "La IA usa esta base junto con los datos reales del negocio para responder con mayor precisión.",
      ],
      ruta: "conocimiento",
      boton: "Base de conocimiento",
      icono: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 8,
      titulo: "Probá la IA antes de publicarla",
      descripcion:
        "Hacé consultas de prueba como si fueras un cliente.",
      detalles: [
        "Preguntá por servicios, productos, precios, horarios y ubicación.",
        "Probá preguntas poco claras y preguntas de seguimiento.",
        "Si una respuesta está mal, corregí la información o las instrucciones.",
        "Repetí la prueba hasta que las respuestas sean consistentes.",
      ],
      ruta: "probar",
      boton: "Probar asistente",
      icono: <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 9,
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
      icono: <Code2 className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "business",
    },
    {
      numero: 10,
      titulo: "Revisá consultas y estadísticas",
      descripcion:
        "Usá el panel para entender qué hacen tus clientes y cómo rinde tu página.",
      detalles: [
        "Página Simple incluye estadísticas básicas de la página.",
        "Página Completa y Business IA incorporan estadísticas avanzadas.",
        "En Business IA las consultas del asistente quedan guardadas y podés tomar la atención manualmente.",
        "Revisá el consumo mensual de IA desde Facturación cuando uses Business IA.",
      ],
      ruta: "estadisticas",
      boton: "Ver Estadísticas",
      icono: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />,
      disponibilidad: "todos",
    },
  ];

  if (!empresaId) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-10">
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10 sm:p-6">
          <p className="text-red-700 dark:text-red-300">
            No se encontró la empresa.
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-4 text-foreground sm:px-8 sm:py-8">
      <header className="mb-4 sm:mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 sm:h-12 sm:w-12 sm:rounded-2xl">
          <CircleHelp className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>

        <p className="mt-2 text-[10px] font-medium text-blue-700 dark:text-blue-400 sm:mt-5 sm:text-sm">
          Centro de ayuda
        </p>

        <h1
          className="mt-0.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          Cómo usar NDI AI
        </h1>

        <p className="mt-1 max-w-2xl text-[10px] font-medium leading-4 text-slate-700 dark:text-zinc-300 sm:mt-3 sm:max-w-3xl sm:text-sm sm:leading-6">
          Seguí esta guía para preparar tu página inteligente,
          cargar lo que ofrecés y activar las funciones incluidas
          en tu plan.
        </p>
      </header>

      <Card className="mb-4 border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5 sm:mb-8 sm:p-6">
        <div className="flex gap-2.5 sm:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 sm:h-10 sm:w-10 sm:rounded-xl">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <div>
            <h2
              className="text-xs font-semibold sm:text-base"
              style={{ color: "var(--foreground)" }}
            >
              La idea principal
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-1 sm:text-sm sm:leading-6">
              NDI AI te permite tener una página profesional para tu
              negocio, mostrar servicios y productos y, según tu plan,
              recibir presupuestos, gestionar turnos, reservas o pedidos
              y atender clientes con inteligencia artificial.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-2.5 sm:space-y-5">
        {pasos.map((paso) => {
          const etiqueta =
            etiquetaDisponibilidad(
              paso.disponibilidad,
            );

          return (
            <Card
              key={paso.numero}
              className="p-3 sm:p-6"
            >
              <div className="flex flex-col gap-2.5 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-2.5 sm:gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 sm:h-11 sm:w-11 sm:rounded-2xl">
                    {paso.icono}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-zinc-500 sm:text-xs sm:tracking-[0.16em]">
                        Paso {paso.numero}
                      </span>

                      <span
                        className={`rounded-full border px-1.5 py-0.5 text-[8px] font-medium sm:px-2 sm:text-[11px] ${etiqueta.clase}`}
                      >
                        {etiqueta.texto}
                      </span>
                    </div>

                    <h2
                      className="mt-0.5 text-sm font-semibold sm:mt-1 sm:text-xl"
                      style={{
                        color: "var(--foreground)",
                      }}
                    >
                      {paso.titulo}
                    </h2>

                    <p className="mt-1 max-w-2xl text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-2 sm:text-sm sm:leading-6">
                      {paso.descripcion}
                    </p>

                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 sm:mt-4 sm:block sm:space-y-2">
                      {paso.detalles.map(
                        (detalle) => (
                          <div
                            key={detalle}
                            className="flex gap-1.5 text-[9px] leading-3.5 text-slate-700 dark:text-zinc-300 sm:gap-2 sm:text-sm sm:leading-normal"
                          >
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500 sm:h-4 sm:w-4" />
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
                      className="shrink-0 self-start"
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

      <div className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-5 lg:grid-cols-2">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <CreditCard className="h-5 w-5 text-violet-700 dark:text-violet-400" />

            <h2
              className="text-sm font-semibold sm:text-lg"
              style={{ color: "var(--foreground)" }}
            >
              Qué incluye cada plan
            </h2>
          </div>

          <div className="mt-2.5 space-y-2.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-5 sm:space-y-5 sm:text-sm sm:leading-6">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Página Simple
              </p>
              <p className="mt-0.5 sm:mt-1">
                Página pública, catálogo básico de servicios y productos,
                hasta 1 imagen por elemento, horarios, ubicación, contacto,
                WhatsApp directo, redes sociales y estadísticas básicas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Página Completa
              </p>
              <p className="mt-0.5 sm:mt-1">
                Todo lo anterior más catálogo ampliado con hasta 3 imágenes,
                presupuestos, QR, Agenda, turnos o reservas, funciones
                específicas por rubro y estadísticas avanzadas.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Business IA
              </p>
              <p className="mt-0.5 sm:mt-1">
                Todo Página Completa más Asistente IA, Base de
                conocimiento, consultas guardadas, Widget web,
                atención humana y página sin marca NDI AI.
              </p>
            </div>
          </div>

          <Button
            type="button"
            className="mt-3 sm:mt-5"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`,
              )
            }
          >
            Ver planes
          </Button>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />

            <h2
              className="text-sm font-semibold sm:text-lg"
              style={{ color: "var(--foreground)" }}
            >
              Renovación y facturación
            </h2>
          </div>

          <div className="mt-2.5 space-y-2 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-4 sm:space-y-3 sm:text-sm sm:leading-6">
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
              Si el plan vence sin renovación, sus funciones quedan
              bloqueadas hasta que lo renueves. El plan contratado se
              conserva y no se reemplaza automáticamente por otro.
            </p>

            <p>
              Desde Facturación podés revisar el estado, vencimiento,
              mensualidad contratada y el último pago registrado.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 sm:mt-5"
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

      <Card className="mt-4 border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5 sm:mt-8 sm:p-6">
        <div className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 sm:h-10 sm:w-10 sm:rounded-xl">
            <Plug className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2
                className="text-xs font-semibold sm:text-base"
                style={{
                  color: "var(--foreground)",
                }}
              >
                WhatsApp, Instagram y Facebook / Messenger
              </h2>

              <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 sm:px-2.5 sm:py-1 sm:text-xs">
                Próximamente
              </span>
            </div>

            <p className="mt-1 max-w-3xl text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-2 sm:text-sm sm:leading-6">
              Las integraciones automáticas con estos canales todavía
              no forman parte del servicio activo. No necesitás
              configurar Meta para usar la página inteligente de NDI AI.
              El botón normal de WhatsApp de tu página sí puede usarse
              con el número cargado en el negocio.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-2.5 sm:mt-8 sm:gap-5 lg:grid-cols-2">
        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <FileText className="h-5 w-5 text-blue-700 dark:text-blue-400" />

            <h2
              className="text-sm font-semibold sm:text-lg"
              style={{ color: "var(--foreground)" }}
            >
              Información legal
            </h2>
          </div>

          <p className="mt-1.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-3 sm:text-sm sm:leading-6">
            Podés consultar las condiciones generales del servicio y
            cómo NDI AI trata los datos personales.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="/terminos"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-center text-[9px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Términos y Condiciones
            </Link>

            <Link
              href="/privacidad"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-center text-[9px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Política de Privacidad
            </Link>
          </div>
        </Card>

        <Card className="p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <CircleHelp className="h-5 w-5 text-violet-700 dark:text-violet-400" />

            <h2
              className="text-sm font-semibold sm:text-lg"
              style={{ color: "var(--foreground)" }}
            >
              Soporte
            </h2>
          </div>

          <p className="mt-1.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-3 sm:text-sm sm:leading-6">
            Si algo no funciona como esperás, anotá qué estabas
            intentando hacer, qué mensaje apareció y, si es posible,
            guardá una captura de pantalla. Esa información facilita
            mucho la resolución del problema.
          </p>

          <p className="mt-1.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-3 sm:text-sm sm:leading-6">
            Utilizá el canal de soporte que NDI AI te haya informado
            al momento de la contratación.
          </p>
        </Card>
      </div>

      <Card className="mt-4 border-slate-200 bg-white p-3 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900 sm:mt-8 sm:p-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4 sm:flex-row sm:items-center">
          <div>
            <h2
              className="font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              ¿No sabés por dónde empezar?
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-700 dark:text-zinc-300 sm:mt-1 sm:text-sm sm:leading-normal">
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