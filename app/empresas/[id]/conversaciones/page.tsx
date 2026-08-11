"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type Conversacion = {
  id: string;
  empresaId?: string;
  visitanteId?: string;
  nombre?: string;
  nombreCliente?: string;
  email?: string;
  telefono?: string;
  canal?: string;
  origen?: string;
  tipo?: string;
  estado?: "abierta" | "cerrada";
  atendidoPor?: "ia" | "humano";
  ultimoMensaje?: string;
  ultimoRol?: "user" | "assistant";
  cantidadMensajes?: number;
  favorita?: boolean;
  puntuacionLead?: number;
  nivelInteres?: "bajo" | "medio" | "alto";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type Filtro = "todas" | "hoy" | "abiertas";

export default function ConversacionesPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authCargando, setAuthCargando] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setAuthCargando(false);
          router.replace("/login");
          return;
        }

        setUser(currentUser);
        setAuthCargando(false);
      }
    );

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
  if (!empresaId) {
    setError("No se encontró el ID de la empresa.");
    setLoading(false);
    return;
  }

  if (authCargando) {
    setLoading(true);
    return;
  }

  if (!user) {
    setLoading(false);
    return;
  }

  setLoading(true);
  setError("");

  const conversacionesQuery = query(
    collection(
      db,
      "companies",
      empresaId,
      "conversations"
    ),
    orderBy("updatedAt", "desc")
  );

  const unsubscribe = onSnapshot(
    conversacionesQuery,
    (snapshot) => {
      const lista = snapshot.docs.map((documento) => {
        const datos = documento.data();

        return {
          ...datos,
          id: documento.id,
        } as Conversacion;
      });

      setConversaciones(lista);
      setLoading(false);
    },
    (firebaseError) => {
      console.error(
        "Error al cargar conversaciones:",
        firebaseError
      );

      setError(
        firebaseError.code === "permission-denied"
          ? "No tenés permisos para ver estas conversaciones. Revisaremos las reglas de Firestore."
          : "No se pudieron cargar las conversaciones."
      );

      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [authCargando, empresaId, user]);

async function cambiarFavorita(
  conversacion: Conversacion
) {
  if (!empresaId) {
    return;
  }

  try {
    await updateDoc(
      doc(
        db,
        "companies",
        empresaId,
        "conversations",
        conversacion.id
      ),
      {
        favorita: !conversacion.favorita,
      }
    );
  } catch (firebaseError) {
    console.error(
      "Error al cambiar consulta favorita:",
      firebaseError
    );

    setError(
      "No se pudo cambiar la consulta favorita."
    );
  }
}

async function eliminarConversacion(
  conversacion: Conversacion
) {
  if (!empresaId) return;

  const confirmar = window.confirm(
    "¿Seguro que querés eliminar esta consulta y todos sus mensajes? Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  try {
    setEliminando(true);
    setError("");

    const usuario =
      auth.currentUser;

    if (!usuario) {
      throw new Error(
        "Tenés que iniciar sesión."
      );
    }

    const idToken =
      await usuario.getIdToken(
        true
      );

    const response = await fetch(
      "/api/conversations/delete",
      {
        method: "DELETE",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          empresaId,
          conversacionId:
            conversacion.id,
        }),
      }
    );

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "No se pudo eliminar la consulta."
      );
    }
  } catch (deleteError) {
    console.error(
      "Error eliminando consulta:",
      deleteError
    );

    setError(
      deleteError instanceof Error
        ? deleteError.message
        : "No se pudo eliminar la conversación."
    );
  } finally {
    setEliminando(false);
  }
}

const estadisticas = useMemo(() => {
  return {
    total: conversaciones.length,
    abiertas: conversaciones.filter(
      (c) => c.estado !== "cerrada"
    ).length,

    cerradas: conversaciones.filter(
      (c) => c.estado === "cerrada"
    ).length,

    ia: conversaciones.filter(
      (c) => c.atendidoPor !== "humano"
    ).length,

    humano: conversaciones.filter(
      (c) => c.atendidoPor === "humano"
    ).length,
  };
}, [conversaciones]);

  const conversacionesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return conversaciones.filter((conversacion) => {
      const coincideBusqueda =
        !texto ||
        conversacion.visitanteId?.toLowerCase().includes(texto) ||
        conversacion.ultimoMensaje?.toLowerCase().includes(texto) ||
        conversacion.id.toLowerCase().includes(texto);

      if (!coincideBusqueda) return false;

      if (filtro === "abiertas") {
        return conversacion.estado !== "cerrada";
      }

      if (filtro === "hoy") {
        const fecha =
          conversacion.updatedAt?.toDate() ||
          conversacion.createdAt?.toDate();

        if (!fecha) return false;

        const hoy = new Date();

        return (
          fecha.getDate() === hoy.getDate() &&
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        );
      }

      return true;
    });
  }, [busqueda, conversaciones, filtro]);

  if (!empresaId) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <h1 className="text-lg font-semibold text-slate-950 dark:text-white">
            No se pudo abrir Consultas
          </h1>

          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            No se encontró el ID de la empresa en la dirección.
          </p>
        </Card>



      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Actividad de clientes
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Consultas
            </h1>

            <Badge variant="info">
              {conversaciones.length} en total
            </Badge>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            Revisá las consultas que llegan desde tu página inteligente,
            el asistente web y los formularios del negocio.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push(`/empresas/${empresaId}`)}
        >
          Volver a la empresa
        </Button>
      </header>

<div className="mb-6 grid gap-4 md:grid-cols-5">
  <Card className="p-5">
    <p className="text-xs text-slate-500 dark:text-zinc-500">
      Consultas
    </p>

    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
      {estadisticas.total}
    </p>
  </Card>

  <Card className="p-5">
    <p className="text-xs text-slate-500 dark:text-zinc-500">
      Abiertas
    </p>

    <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
      {estadisticas.abiertas}
    </p>
  </Card>

  <Card className="p-5">
    <p className="text-xs text-slate-500 dark:text-zinc-500">
      Resueltas
    </p>

    <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
      {estadisticas.cerradas}
    </p>
  </Card>

  <Card className="p-5">
    <p className="text-xs text-slate-500 dark:text-zinc-500">
      Atendidas por IA
    </p>

    <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
      {estadisticas.ia}
    </p>
  </Card>

  <Card className="p-5">
    <p className="text-xs text-slate-500 dark:text-zinc-500">
      Atendidas por humano
    </p>

    <p className="mt-2 text-3xl font-bold text-amber-500 dark:text-yellow-400">
      {estadisticas.humano}
    </p>
  </Card>
</div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              id="buscarConversacion"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por cliente, consulta o ID..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filtro === "todas" ? "primary" : "ghost"}
              onClick={() => setFiltro("todas")}
            >
              Todas
            </Button>

            <Button
              size="sm"
              variant={filtro === "hoy" ? "primary" : "ghost"}
              onClick={() => setFiltro("hoy")}
            >
              Hoy
            </Button>

            <Button
              size="sm"
              variant={filtro === "abiertas" ? "primary" : "ghost"}
              onClick={() => setFiltro("abiertas")}
            >
              Abiertas
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium text-slate-950 dark:text-white">
            Cargando consultas...
          </p>
        </Card>
      ) : conversacionesFiltradas.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
            💬
          </div>

          <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
            {conversaciones.length === 0
              ? "Todavía no hay consultas"
              : "No encontramos resultados"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-500">
            {conversaciones.length === 0
              ? "Cuando alguien use tu página, el asistente o un formulario, la consulta aparecerá acá automáticamente."
              : "Probá con otra búsqueda o cambiá el filtro seleccionado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1.5fr)_120px_155px_105px_110px] gap-4 border-b border-slate-200 px-6 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:text-zinc-600 md:grid">
            <span>Cliente</span>
            <span>Última consulta</span>
            <span>Origen</span>
            <span>Última actividad</span>
            <span>Prioridad</span>
            <span className="text-right">Estado</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-zinc-800">
            {conversacionesFiltradas.map((conversacion) => {
              const nombreVisitante = obtenerNombreVisitante(
                conversacion,
              );

              return (
<div
  key={conversacion.id}
  role="button"
  tabIndex={0}
  onClick={() =>
    router.push(
      `/empresas/${empresaId}/conversaciones/${conversacion.id}`
    )
  }
  onKeyDown={(evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      router.push(
        `/empresas/${empresaId}/conversaciones/${conversacion.id}`
      );
    }
  }}
  className="grid w-full cursor-pointer gap-4 px-5 py-5 text-left transition hover:bg-slate-50 dark:hover:bg-zinc-800/40 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1.5fr)_120px_155px_105px_110px] md:items-center md:px-6"
>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={nombreVisitante} size="sm" />

                    <button
  type="button"
  onClick={(evento) => {
    evento.stopPropagation();
    cambiarFavorita(conversacion);
  }}
  className="shrink-0 text-xl text-amber-400 transition hover:scale-110"
  aria-label={
    conversacion.favorita
      ? "Quitar de favoritas"
      : "Marcar como favorita"
  }
>
  {conversacion.favorita ? "★" : "☆"}
</button>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                        {nombreVisitante}
                      </p>

                      <p className="mt-1 text-xs text-slate-600 dark:text-zinc-500">
                        {conversacion.cantidadMensajes ?? 0} mensajes · ID{" "}
                        {conversacion.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-800 dark:text-zinc-300">
                      {conversacion.ultimoMensaje ||
                        "Consulta sin mensajes"}
                    </p>

                    <p className="mt-1 text-xs text-slate-600 dark:text-zinc-500">
                      Respondido por{" "}
                      {conversacion.atendidoPor === "humano"
                        ? "una persona"
                        : "la IA"}
                    </p>
                  </div>

                  <div>
                    <Badge variant="info">
                      {obtenerOrigenConsulta(
                        conversacion,
                      )}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-slate-700 dark:text-zinc-400">
                      {formatDate(
                        conversacion.updatedAt ||
                          conversacion.createdAt
                      )}
                    </p>
                  </div>

<div>
  <Badge
    variant={
      conversacion.nivelInteres === "alto"
        ? "danger"
        : conversacion.nivelInteres === "medio"
        ? "warning"
        : "success"
    }
  >
    {conversacion.nivelInteres === "alto"
      ? "🔥 Alto"
      : conversacion.nivelInteres === "medio"
      ? "🟡 Medio"
      : "🟢 Bajo"}
  </Badge>
</div>

<div className="flex items-center justify-end gap-3">
  <Badge
    variant={
      conversacion.estado === "cerrada"
        ? "default"
        : "success"
    }
  >
    {conversacion.estado === "cerrada"
      ? "Cerrada"
      : "Abierta"}
  </Badge>

  <button
    type="button"
    disabled={eliminando}
    onClick={(evento) => {
      evento.stopPropagation();
      void eliminarConversacion(conversacion);
    }}
    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-500 dark:hover:text-red-400"
    title="Eliminar consulta"
  >
    🗑️
  </button>
</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </section>
  );
}

function obtenerNombreVisitante(
  conversacion: Conversacion,
) {
  const nombre =
    conversacion.nombreCliente?.trim() ||
    conversacion.nombre?.trim();

  if (nombre) {
    return nombre;
  }

  if (conversacion.email?.trim()) {
    return conversacion.email.trim();
  }

  if (conversacion.telefono?.trim()) {
    return conversacion.telefono.trim();
  }

  if (!conversacion.visitanteId) {
    return "Cliente";
  }

  const parteVisible = conversacion.visitanteId
    .replace("visitante-", "")
    .slice(0, 8);

  return `Visitante ${parteVisible}`;
}

function obtenerOrigenConsulta(
  conversacion: Conversacion,
) {
  const origen = [
    conversacion.origen,
    conversacion.canal,
    conversacion.tipo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    origen.includes("reserva") ||
    origen.includes("appointment") ||
    origen.includes("turno")
  ) {
    return "Reserva";
  }

  if (
    origen.includes("form") ||
    origen.includes("lead") ||
    origen.includes("contact") ||
    origen.includes("presupuesto")
  ) {
    return "Formulario";
  }

  if (
    origen.includes("whatsapp") ||
    origen.includes("instagram") ||
    origen.includes("messenger") ||
    origen.includes("facebook")
  ) {
    return "Canal externo";
  }

  return "Asistente web";
}

function formatDate(timestamp?: Timestamp) {
  if (!timestamp) return "Sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}