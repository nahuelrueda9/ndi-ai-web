"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Bot,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Code2,
  CreditCard,
  MessageSquare,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

type Paso = {
  numero: number;
  titulo: string;
  descripcion: string;
  detalles: string[];
  ruta?: string;
  boton?: string;
  icono: React.ReactNode;
  pro?: boolean;
};

export default function AyudaPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const pasos: Paso[] = [
    {
      numero: 1,
      titulo: "Configurá tu negocio",
      descripcion:
        "Contale a NDI AI quién sos y cómo querés que atienda a tus clientes.",
      detalles: [
        "Completá el nombre, rubro, teléfono, dirección y horarios.",
        "Definí el objetivo del agente y su forma de responder.",
        "Escribí qué cosas no debe inventar ni prometer.",
        "Guardá los cambios antes de continuar.",
      ],
      ruta: "configuracion",
      boton: "Ir a Configuración",
      icono: <Settings className="h-5 w-5" />,
    },
    {
      numero: 2,
      titulo: "Cargá la base de conocimiento",
      descripcion:
        "La IA necesita información real para responder bien.",
      detalles: [
        "Agregá servicios, productos, precios y formas de pago.",
        "Cargá preguntas frecuentes, políticas y horarios.",
        "Podés sumar documentos o información de tu negocio.",
        "Si un dato cambia, actualizalo para evitar respuestas viejas.",
      ],
      ruta: "conocimiento",
      boton: "Ir a Conocimiento",
      icono: <BookOpen className="h-5 w-5" />,
    },
    {
      numero: 3,
      titulo: "Probá el agente",
      descripcion:
        "Antes de conectarlo con clientes, hacé preguntas como si fueras uno de ellos.",
      detalles: [
        "Preguntá precios, horarios, ubicación y servicios.",
        "Probá preguntas poco claras o de seguimiento.",
        "Si responde mal, corregí Configuración o Conocimiento.",
        "Repetí la prueba hasta que las respuestas sean confiables.",
      ],
      ruta: "probar",
      boton: "Probar la IA",
      icono: <Bot className="h-5 w-5" />,
    },
    {
      numero: 4,
      titulo: "Conectá WhatsApp",
      descripcion:
        "WhatsApp es el canal principal de NDI AI para responder por vos.",
      detalles: [
        "Entrá a Integraciones y abrí WhatsApp.",
        "Cargá los datos de WhatsApp Business Platform que te solicita NDI AI.",
        "Usá la prueba de conexión para verificar que los datos sean correctos.",
        "Cuando un cliente escriba, la IA podrá responder automáticamente.",
      ],
      ruta: "integraciones",
      boton: "Ir a Integraciones",
      icono: <Plug className="h-5 w-5" />,
    },
    {
      numero: 5,
      titulo: "Manejá las conversaciones",
      descripcion:
        "Desde Conversaciones podés ver qué está hablando la IA con cada cliente.",
      detalles: [
        "Revisá mensajes y datos del contacto.",
        "Podés tomar una conversación para responder personalmente.",
        "Cuando terminás, devolvé la atención a la IA.",
        "También podés cerrar o reabrir conversaciones.",
      ],
      ruta: "conversaciones",
      boton: "Ver Conversaciones",
      icono: <MessageSquare className="h-5 w-5" />,
    },
    {
      numero: 6,
      titulo: "Automatizaciones",
      descripcion:
        "Creá reglas que reaccionen automáticamente a situaciones frecuentes.",
      detalles: [
        "Respondé cuando aparezca una palabra o frase.",
        "Derivá una consulta a una persona.",
        "Agregá etiquetas o cerrá conversaciones.",
        "Podés pausar una automatización sin borrarla.",
      ],
      ruta: "automatizaciones",
      boton: "Ver Automatizaciones",
      icono: <Zap className="h-5 w-5" />,
      pro: true,
    },
    {
      numero: 7,
      titulo: "Agenda y turnos",
      descripcion:
        "Organizá citas, confirmaciones y seguimientos desde NDI AI.",
      detalles: [
        "Creá un turno con fecha, hora y datos del cliente.",
        "Marcá turnos como pendientes, confirmados o completados.",
        "Usá el calendario para revisar la actividad del mes.",
      ],
      ruta: "agenda",
      boton: "Abrir Agenda",
      icono: <CalendarDays className="h-5 w-5" />,
      pro: true,
    },
    {
      numero: 8,
      titulo: "Equipo",
      descripcion:
        "Invitá personas para ayudarte a atender y administrar.",
      detalles: [
        "Invitá por correo electrónico.",
        "Asigná roles de operador, supervisor o administrador.",
        "Activá, desactivá o eliminá miembros cuando sea necesario.",
      ],
      ruta: "equipo",
      boton: "Administrar Equipo",
      icono: <Users className="h-5 w-5" />,
      pro: true,
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

        <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Cómo usar NDI AI
        </h1>

        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700 dark:text-zinc-300">
          Seguí estos pasos para preparar la IA, conectarla con WhatsApp
          y empezar a atender consultas de tus clientes automáticamente.
        </p>
      </header>

      <Card className="mb-8 border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
              La idea principal
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-zinc-300">
              Tus clientes escriben al WhatsApp de tu emprendimiento y NDI AI
              responde por vos usando la información que cargaste. En cualquier
              momento podés entrar a Conversaciones y tomar el control manualmente.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {pasos.map((paso) => (
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

                    {paso.pro && (
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                        Pro
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1 text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                    {paso.titulo}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-zinc-300">
                    {paso.descripcion}
                  </p>

                  <div className="mt-4 space-y-2">
                    {paso.detalles.map((detalle) => (
                      <div
                        key={detalle}
                        className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{detalle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {paso.ruta && paso.boton && (
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() =>
                    router.push(
                      `/empresas/${empresaId}/${paso.ruta}`
                    )
                  }
                >
                  {paso.boton}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Free y Pro
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            <p>
              <strong className="text-slate-950 dark:text-white">Free:</strong>{" "}
              WhatsApp + IA, hasta 50 conversaciones y 250 respuestas
              de IA por mes. La primera respuesta automática de cada
              conversación lleva la firma “Respondido con NDI AI”.
            </p>

            <p>
              <strong className="text-slate-950 dark:text-white">Pro:</strong>{" "}
              $14.999 por 30 días, hasta 1.000 conversaciones y
              5.000 respuestas de IA por mes, además de widget web,
              automatizaciones, agenda, equipo y sin firma de NDI AI.
            </p>
          </div>

          <Button
            type="button"
            className="mt-5"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`
              )
            }
          >
            Ver planes
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              Consejos para buenas respuestas
            </h2>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-zinc-300">
            <p>
              No dependas de instrucciones generales para datos importantes:
              cargá precios, horarios, condiciones y políticas en Conocimiento.
            </p>

            <p>
              Cuando cambies información del negocio, actualizala también en
              NDI AI y hacé una prueba antes de dejar que responda a clientes.
            </p>

            <p>
              Si una conversación necesita una persona, tomala desde
              Conversaciones y respondé manualmente.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-8 border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
              ¿No sabés por dónde empezar?
            </h2>
            <p className="mt-1 text-sm text-slate-700 dark:text-zinc-300">
              Empezá por Configuración y seguí los pasos en orden.
            </p>
          </div>

          <Button
            type="button"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/configuracion`
              )
            }
          >
            Empezar configuración
          </Button>
        </div>
      </Card>
    </section>
  );
}