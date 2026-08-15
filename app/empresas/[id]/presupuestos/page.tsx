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

function fechaPresupuesto(
  valor: string | null,
) {
  if (!valor) {
    return "Recién recibido";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime(),
    )
  ) {
    return "Recién recibido";
  }

  return fecha.toLocaleString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function claseEstado(
  estado: EstadoPresupuesto,
) {
  if (estado === "nuevo") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }

  if (
    estado === "contactado"
  ) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  }

  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
}

export default function PresupuestosPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const parametroEmpresa =
    params.id ??
    params.empresaId;

  const empresaId =
    Array.isArray(
      parametroEmpresa,
    )
      ? parametroEmpresa[0]
      : (
          parametroEmpresa as
            | string
            | undefined
        );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    cargandoAccion,
    setCargandoAccion,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    presupuestos,
    setPresupuestos,
  ] = useState<Presupuesto[]>(
    [],
  );

  const [
    filtro,
    setFiltro,
  ] = useState<Filtro>(
    "todos",
  );

  async function cargarPresupuestos(
    token: string,
  ) {
    if (!empresaId) {
      return;
    }

    const response =
      await fetch(
        `/api/companies/${encodeURIComponent(
          empresaId,
        )}/presupuestos`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        },
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    if (!response.ok) {
      if (
        response.status === 401
      ) {
        router.replace(
          "/login",
        );
        return;
      }

      if (
        response.status === 403 ||
        response.status === 404
      ) {
        router.replace(
          `/empresas/${empresaId}/dashboard`,
        );
        return;
      }

      throw new Error(
        data?.error ||
          "No se pudieron cargar los presupuestos.",
      );
    }

    setPresupuestos(
      Array.isArray(
        data?.presupuestos,
      )
        ? data.presupuestos
        : [],
    );
  }

  useEffect(() => {
    if (!empresaId) {
      return;
    }

    let activo = true;

    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (usuario) => {
          if (!usuario) {
            if (activo) {
              router.replace(
                "/login",
              );
            }

            return;
          }

          if (activo) {
            setCargando(true);
            setError("");
          }

          try {
            const token =
              await usuario.getIdToken();

            if (!activo) {
              return;
            }

            await cargarPresupuestos(
              token,
            );
          } catch (
            cargarError
          ) {
            console.error(
              "Error cargando presupuestos:",
              cargarError,
            );

            if (activo) {
              setError(
                cargarError instanceof
                Error
                  ? cargarError.message
                  : "No se pudieron cargar los presupuestos.",
              );
            }
          } finally {
            if (activo) {
              setCargando(false);
            }
          }
        },
      );

    return () => {
      activo = false;
      cancelarAuth();
    };
  }, [
    empresaId,
    router,
  ]);

  const presupuestosFiltrados =
    useMemo(
      () =>
        presupuestos.filter(
          (presupuesto) =>
            filtro === "todos" ||
            presupuesto.estado ===
              filtro,
        ),
      [
        filtro,
        presupuestos,
      ],
    );

  const contadores =
    useMemo(
      () => ({
        nuevos:
          presupuestos.filter(
            (presupuesto) =>
              presupuesto.estado ===
              "nuevo",
          ).length,
        contactados:
          presupuestos.filter(
            (presupuesto) =>
              presupuesto.estado ===
              "contactado",
          ).length,
        cerrados:
          presupuestos.filter(
            (presupuesto) =>
              presupuesto.estado ===
              "cerrado",
          ).length,
      }),
      [presupuestos],
    );

  async function cambiarEstado(
    presupuestoId: string,
    estado: EstadoPresupuesto,
  ) {
    if (
      !empresaId ||
      cargandoAccion
    ) {
      return;
    }

    const usuario =
      auth.currentUser;

    if (!usuario) {
      router.replace(
        "/login",
      );
      return;
    }

    setCargandoAccion(
      presupuestoId,
    );
    setError("");

    try {
      const token =
        await usuario.getIdToken();

      const response =
        await fetch(
          `/api/companies/${encodeURIComponent(
            empresaId,
          )}/presupuestos`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              presupuestoId,
              estado,
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        if (
          response.status ===
            401
        ) {
          router.replace(
            "/login",
          );
          return;
        }

        if (
          response.status ===
            403
        ) {
          router.replace(
            `/empresas/${empresaId}/dashboard`,
          );
          return;
        }

        throw new Error(
          data?.error ||
            "No se pudo actualizar el presupuesto.",
        );
      }

      setPresupuestos(
        (actuales) =>
          actuales.map(
            (presupuesto) =>
              presupuesto.id ===
              presupuestoId
                ? {
                    ...presupuesto,
                    estado,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : presupuesto,
          ),
      );
    } catch (
      actualizarError
    ) {
      console.error(
        "Error actualizando presupuesto:",
        actualizarError,
      );

      setError(
        actualizarError instanceof
        Error
          ? actualizarError.message
          : "No se pudo actualizar el presupuesto.",
      );
    } finally {
      setCargandoAccion(
        "",
      );
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-500">
            Solicitudes comerciales
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Presupuestos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Acá aparecen las solicitudes de presupuesto recibidas desde la página pública.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Contador
            titulo="Nuevos"
            valor={
              contadores.nuevos
            }
          />

          <Contador
            titulo="Contactados"
            valor={
              contadores.contactados
            }
          />

          <Contador
            titulo="Cerrados"
            valor={
              contadores.cerrados
            }
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["todos", "Todos"],
            ["nuevo", "Nuevos"],
            ["contactado", "Contactados"],
            ["cerrado", "Cerrados"],
          ] as [
            Filtro,
            string,
          ][]
        ).map(
          ([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setFiltro(id)
              }
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filtro === id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {presupuestosFiltrados.length ===
      0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <FileText className="mx-auto h-8 w-8 text-slate-400 dark:text-zinc-600" />

          <h2 className="mt-4 text-lg font-bold">
            No hay presupuestos en esta vista
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-500">
            Cuando alguien solicite una cotización desde la página pública va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {presupuestosFiltrados.map(
            (presupuesto) => (
              <PresupuestoCard
                key={
                  presupuesto.id
                }
                presupuesto={
                  presupuesto
                }
                procesando={
                  cargandoAccion ===
                  presupuesto.id
                }
                onEstado={
                  cambiarEstado
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function Contador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="min-w-24 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xl font-bold">
        {valor}
      </p>

      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-zinc-500">
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
  onEstado: (
    id: string,
    estado: EstadoPresupuesto,
  ) => Promise<void>;
}) {
  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white dark:bg-zinc-900 ${
        presupuesto.estado ===
        "nuevo"
          ? "border-blue-400/60 ring-1 ring-blue-500/20 dark:border-blue-500/40"
          : "border-slate-200 dark:border-zinc-800"
      }`}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black">
                {presupuesto.nombre ||
                  "Cliente"}
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${claseEstado(
                  presupuesto.estado,
                )}`}
              >
                {
                  ETIQUETA_ESTADO[
                    presupuesto.estado
                  ]
                }
              </span>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
              <Clock3 className="h-3.5 w-3.5" />

              {fechaPresupuesto(
                presupuesto.createdAt,
              )}
            </p>
          </div>

          <FileText className="h-5 w-5 shrink-0 text-blue-500" />
        </div>

        <div className="mt-5 space-y-2">
          {presupuesto.telefono && (
            <a
              href={`tel:${presupuesto.telefono}`}
              className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
            >
              <Phone className="h-4 w-4" />
              {presupuesto.telefono}
            </a>
          )}

          {presupuesto.email && (
            <a
              href={`mailto:${presupuesto.email}`}
              className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
            >
              <Mail className="h-4 w-4" />
              {presupuesto.email}
            </a>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-600">
            Solicitud
          </p>

          <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700 dark:text-zinc-300">
            {presupuesto.mensaje ||
              "Sin detalle."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {presupuesto.estado ===
            "nuevo" && (
            <>
              <Accion
                icono={
                  <Phone className="h-4 w-4" />
                }
                texto="Marcar contactado"
                disabled={
                  procesando
                }
                principal
                onClick={() =>
                  void onEstado(
                    presupuesto.id,
                    "contactado",
                  )
                }
              />

              <Accion
                icono={
                  <CheckCircle2 className="h-4 w-4" />
                }
                texto="Cerrar"
                disabled={
                  procesando
                }
                onClick={() =>
                  void onEstado(
                    presupuesto.id,
                    "cerrado",
                  )
                }
              />
            </>
          )}

          {presupuesto.estado ===
            "contactado" && (
            <>
              <Accion
                icono={
                  <CheckCircle2 className="h-4 w-4" />
                }
                texto="Cerrar presupuesto"
                disabled={
                  procesando
                }
                principal
                onClick={() =>
                  void onEstado(
                    presupuesto.id,
                    "cerrado",
                  )
                }
              />

              <Accion
                icono={
                  <RotateCcw className="h-4 w-4" />
                }
                texto="Volver a nuevo"
                disabled={
                  procesando
                }
                onClick={() =>
                  void onEstado(
                    presupuesto.id,
                    "nuevo",
                  )
                }
              />
            </>
          )}

          {presupuesto.estado ===
            "cerrado" && (
            <Accion
              icono={
                <RotateCcw className="h-4 w-4" />
              }
              texto="Reabrir"
              disabled={
                procesando
              }
              onClick={() =>
                void onEstado(
                  presupuesto.id,
                  "nuevo",
                )
              }
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
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        principal
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {disabled ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icono
      )}

      {texto}
    </button>
  );
}