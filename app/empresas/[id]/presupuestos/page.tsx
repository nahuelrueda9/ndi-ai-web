"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  auth,
} from "@/lib/firebase";

type EstadoPresupuesto =
  | "nuevo"
  | "contactado"
  | "cerrado";

type Presupuesto = {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  mensaje: string;
  estado: EstadoPresupuesto;
  createdAt: string | null;
  updatedAt: string | null;
};

type Filtro =
  | "todos"
  | EstadoPresupuesto;

const ETIQUETA_ESTADO: Record<
  EstadoPresupuesto,
  string
> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cerrado: "Cerrado",
};

function tiempoTranscurrido(valor: string | null) {
  if (!valor) return "Recién";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Recién";
  
  const ahora = new Date();
  const difMs = ahora.getTime() - fecha.getTime();
  const difMinutos = Math.floor(difMs / 60000);

  if (difMinutos < 1) return "Recién";
  if (difMinutos < 60) return `Hace ${difMinutos} min`;
  
  const difHoras = Math.floor(difMinutos / 60);
  if (difHoras < 24) return `Hace ${difHoras} h`;
  
  const difDias = Math.floor(difHoras / 24);
  if (difDias === 1) return "Ayer";
  
  return `Hace ${difDias} días`;
}

function fechaPresupuesto(valor: string | null) {
  if (!valor) return "Recién recibido";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Recién recibido";

  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function claseEstado(estado: EstadoPresupuesto) {
  if (estado === "nuevo") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
  }
  if (estado === "contactado") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
}

export default function PresupuestosPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;
  const empresaId = Array.isArray(parametroEmpresa) ? parametroEmpresa[0] : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);
  const [cargandoAccion, setCargandoAccion] = useState("");
  const [error, setError] = useState("");
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  async function cargarPresupuestos(token: string) {
    if (!empresaId) return;

    const response = await fetch(
      `/api/companies/${encodeURIComponent(empresaId)}/presupuestos`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 403 || response.status === 404) {
        router.replace(`/empresas/${empresaId}/dashboard`);
        return;
      }
      throw new Error(data?.error || "No se pudieron cargar los presupuestos.");
    }

    setPresupuestos(Array.isArray(data?.presupuestos) ? data.presupuestos : []);
  }

  useEffect(() => {
    if (!empresaId) return;

    let activo = true;

    const cancelarAuth = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        if (activo) router.replace("/login");
        return;
      }

      if (activo) {
        setCargando(true);
        setError("");
      }

      try {
        const token = await usuario.getIdToken();
        if (!activo) return;
        await cargarPresupuestos(token);
      } catch (cargarError) {
        console.error("Error cargando presupuestos:", cargarError);
        if (activo) {
          setError(
            cargarError instanceof Error
              ? cargarError.message
              : "No se pudieron cargar los presupuestos.",
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    });

    return () => {
      activo = false;
      cancelarAuth();
    };
  }, [empresaId, router]);

  const presupuestosFiltrados = useMemo(
    () =>
      presupuestos.filter(
        (presupuesto) =>
          filtro === "todos" || presupuesto.estado === filtro,
      ),
    [filtro, presupuestos],
  );

  const contadores = useMemo(
    () => ({
      nuevos: presupuestos.filter((p) => p.estado === "nuevo").length,
      contactados: presupuestos.filter((p) => p.estado === "contactado").length,
      cerrados: presupuestos.filter((p) => p.estado === "cerrado").length,
    }),
    [presupuestos],
  );

  async function cambiarEstado(
    presupuestoId: string,
    estado: EstadoPresupuesto,
  ) {
    if (!empresaId || cargandoAccion) return;

    const usuario = auth.currentUser;

    if (!usuario) {
      router.replace("/login");
      return;
    }

    setCargandoAccion(presupuestoId);
    setError("");

    try {
      const token = await usuario.getIdToken();

      const response = await fetch(
        `/api/companies/${encodeURIComponent(empresaId)}/presupuestos`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            presupuestoId,
            estado,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 403) {
          router.replace(`/empresas/${empresaId}/dashboard`);
          return;
        }
        throw new Error(data?.error || "No se pudo actualizar el presupuesto.");
      }

      setPresupuestos((actuales) =>
        actuales.map((presupuesto) =>
          presupuesto.id === presupuestoId
            ? {
                ...presupuesto,
                estado,
                updatedAt: new Date().toISOString(),
              }
            : presupuesto,
        ),
      );
    } catch (actualizarError) {
      console.error("Error actualizando presupuesto:", actualizarError);
      setError(
        actualizarError instanceof Error
          ? actualizarError.message
          : "No se pudo actualizar el presupuesto.",
      );
    } finally {
      setCargandoAccion("");
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-xs">
            Solicitudes comerciales
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Presupuestos
          </h1>

          <p className="mt-1.5 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
            Administrá las solicitudes de cotización recibidas desde la página pública.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Contador titulo="Nuevos" valor={contadores.nuevos} activo={filtro === "nuevo" || filtro === "todos"} />
          <Contador titulo="Contactados" valor={contadores.contactados} activo={filtro === "contactado" || filtro === "todos"} />
          <Contador titulo="Cerrados" valor={contadores.cerrados} activo={filtro === "cerrado" || filtro === "todos"} />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 sm:mt-6">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/50 sm:mt-8 sm:inline-flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["todos", "Todos"],
            ["nuevo", "Nuevos"],
            ["contactado", "Contactados"],
            ["cerrado", "Cerrados"],
          ] as [Filtro, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFiltro(id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:px-5 sm:text-sm ${
              filtro === id
                ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {presupuestosFiltrados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950 sm:mt-6 sm:p-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-600 sm:h-16 sm:w-16">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>

          <h2 className="mt-4 text-base font-bold text-slate-950 dark:text-white sm:mt-5 sm:text-xl">
            No hay presupuestos en esta vista
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-zinc-500 sm:mt-3 sm:text-sm sm:leading-6">
            Cuando un cliente complete el formulario de solicitud de presupuesto en tu página pública, aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-5 xl:grid-cols-2">
          {presupuestosFiltrados.map((presupuesto) => (
            <PresupuestoCard
              key={presupuesto.id}
              presupuesto={presupuesto}
              procesando={cargandoAccion === presupuesto.id}
              onEstado={cambiarEstado}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Contador({
  titulo,
  valor,
  activo,
}: {
  titulo: string;
  valor: number;
  activo: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-xl border p-2.5 text-center transition-colors sm:min-w-28 sm:rounded-2xl sm:p-4 ${activo ? "border-slate-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900" : "border-transparent bg-transparent opacity-60"}`}>
      <p className="text-xl font-bold text-slate-950 dark:text-white sm:text-3xl">
        {valor}
      </p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
        {titulo}
      </p>
    </div>
  );
}

function PresupuestoCard({
  presupuesto,
  procesando,
  onEstado,
}: {
  presupuesto: Presupuesto;
  procesando: boolean;
  onEstado: (id: string, estado: EstadoPresupuesto) => Promise<void>;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition-all dark:bg-zinc-950 sm:rounded-3xl ${
        presupuesto.estado === "nuevo"
          ? "border-blue-300 shadow-md ring-1 ring-blue-500/10 dark:border-blue-500/30"
          : "border-slate-200 shadow-sm dark:border-zinc-800"
      }`}
    >
      <div className="p-4 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="truncate text-base font-bold text-slate-950 dark:text-white sm:text-xl">
                {presupuesto.nombre || "Cliente"}
              </h2>

              <span
                className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:px-2.5 sm:py-1 sm:text-[10px] ${claseEstado(
                  presupuesto.estado,
                )}`}
              >
                {ETIQUETA_ESTADO[presupuesto.estado]}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 sm:mt-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-zinc-400 sm:text-xs">
                <Clock3 className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{tiempoTranscurrido(presupuesto.createdAt)}</span>
                <span>({fechaPresupuesto(presupuesto.createdAt)})</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
          {presupuesto.telefono && (
            <a
              href={`tel:${presupuesto.telefono}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {presupuesto.telefono}
            </a>
          )}

          {presupuesto.email && (
            <a
              href={`mailto:${presupuesto.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-sm"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {presupuesto.email}
            </a>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-zinc-800/50 dark:bg-zinc-900/50 sm:mt-6 sm:rounded-2xl sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            Detalle de la solicitud
          </p>

          <p className="mt-2 whitespace-pre-line break-words text-[11px] leading-relaxed text-slate-800 dark:text-zinc-300 sm:mt-3 sm:text-sm sm:leading-7">
            {presupuesto.mensaje || "El cliente no dejó un mensaje adicional."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-zinc-800 sm:mt-6 sm:gap-3 sm:pt-6">
          {presupuesto.estado === "nuevo" && (
            <>
              <Accion
                icono={<Phone className="h-4 w-4 shrink-0" />}
                texto="Marcar contactado"
                disabled={procesando}
                principal
                onClick={() => void onEstado(presupuesto.id, "contactado")}
              />

              <Accion
                icono={<CheckCircle2 className="h-4 w-4" />}
                texto="Cerrar"
                disabled={procesando}
                onClick={() => void onEstado(presupuesto.id, "cerrado")}
              />
            </>
          )}

          {presupuesto.estado === "contactado" && (
            <>
              <Accion
                icono={<CheckCircle2 className="h-4 w-4" />}
                texto="Cerrar presupuesto"
                disabled={procesando}
                principal
                onClick={() => void onEstado(presupuesto.id, "cerrado")}
              />

              <Accion
                icono={<RotateCcw className="h-4 w-4" />}
                texto="Volver a nuevo"
                disabled={procesando}
                onClick={() => void onEstado(presupuesto.id, "nuevo")}
              />
            </>
          )}

          {presupuesto.estado === "cerrado" && (
            <Accion
              icono={<RotateCcw className="h-4 w-4" />}
              texto="Reabrir"
              disabled={procesando}
              onClick={() => void onEstado(presupuesto.id, "nuevo")}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function Accion({
  icono,
  texto,
  disabled,
  onClick,
  principal = false,
}: {
  icono: ReactNode;
  texto: string;
  disabled: boolean;
  onClick: () => void;
  principal?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
        principal
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : icono}
      {texto}
    </button>
  );
}