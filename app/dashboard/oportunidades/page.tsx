"use client";

import {
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/Ui/Badge";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type Etapa =
  | "nuevo"
  | "contactado"
  | "presupuesto"
  | "negociacion"
  | "ganado"
  | "perdido";

type Empresa = {
  id: string;
  nombre: string;
};

type Oportunidad = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  visitanteId: string;
  email?: string;
  telefono?: string;
  ultimoMensaje?: string;
  puntuacionLead: number;
  nivelInteres: string;
  etiquetas: string[];
  etapa: Etapa;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

const COLUMNAS: {
  id: Etapa;
  titulo: string;
  descripcion: string;
}[] = [
  {
    id: "nuevo",
    titulo: "Nuevo",
    descripcion: "Lead detectado",
  },
  {
    id: "contactado",
    titulo: "Contactado",
    descripcion: "Primer contacto realizado",
  },
  {
    id: "presupuesto",
    titulo: "Presupuesto",
    descripcion: "Propuesta enviada",
  },
  {
    id: "negociacion",
    titulo: "Negociación",
    descripcion: "Cierre en proceso",
  },
  {
    id: "ganado",
    titulo: "Ganado",
    descripcion: "Venta cerrada",
  },
  {
    id: "perdido",
    titulo: "Perdido",
    descripcion: "Oportunidad descartada",
  },
];

export default function OportunidadesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [actualizandoId, setActualizandoId] = useState<string | null>(
    null
  );

  const oportunidadesPorEmpresaRef = useRef<
    Map<string, Oportunidad[]>
  >(new Map());

  const suscripcionesRef = useRef<Map<string, Unsubscribe>>(
    new Map()
  );

  useEffect(() => {
    return onAuthStateChanged(auth, (usuarioActual) => {
      if (!usuarioActual) {
        router.replace("/login");
        return;
      }

      setUsuario(usuarioActual);
    });
  }, [router]);

  useEffect(() => {
    if (!usuario) return;

    setCargando(true);
    setError("");

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", usuario.uid)
    );

    const cancelarEmpresas = onSnapshot(
      empresasQuery,
      (snapshotEmpresas) => {
        const empresas: Empresa[] = snapshotEmpresas.docs.map(
          (documento) => ({
            id: documento.id,
            nombre:
              documento.data().nombre || "Empresa sin nombre",
          })
        );

        const idsActuales = new Set(
          empresas.map((empresa) => empresa.id)
        );

        suscripcionesRef.current.forEach(
          (cancelar, empresaId) => {
            if (!idsActuales.has(empresaId)) {
              cancelar();
              suscripcionesRef.current.delete(empresaId);
              oportunidadesPorEmpresaRef.current.delete(empresaId);
            }
          }
        );

        if (empresas.length === 0) {
          setOportunidades([]);
          setCargando(false);
          return;
        }

        empresas.forEach((empresa) => {
          if (suscripcionesRef.current.has(empresa.id)) return;

          const conversacionesQuery = query(
            collection(
              db,
              "companies",
              empresa.id,
              "conversations"
            ),
            orderBy("updatedAt", "desc")
          );

          const cancelarConversaciones = onSnapshot(
            conversacionesQuery,
            (snapshotConversaciones) => {
              const lista: Oportunidad[] =
                snapshotConversaciones.docs
                  .map((documento) => {
                    const datos = documento.data();

                    return {
                      id: documento.id,
                      empresaId: empresa.id,
                      empresaNombre: empresa.nombre,
                      visitanteId:
                        datos.visitanteId ||
                        `anonimo-${documento.id}`,
                      email: datos.email || "",
                      telefono: datos.telefono || "",
                      ultimoMensaje: datos.ultimoMensaje || "",
                      puntuacionLead:
                        typeof datos.puntuacionLead === "number"
                          ? datos.puntuacionLead
                          : 0,
                      nivelInteres:
                        datos.nivelInteres || "bajo",
                      etiquetas: Array.isArray(datos.etiquetas)
                        ? datos.etiquetas
                        : [],
                      etapa: normalizarEtapa(
                        datos.etapaOportunidad
                      ),
                      updatedAt: datos.updatedAt,
                      createdAt: datos.createdAt,
                    };
                  })
                  .filter((oportunidad) => {
                    return (
                      oportunidad.puntuacionLead > 0 ||
                      oportunidad.email ||
                      oportunidad.telefono ||
                      oportunidad.etiquetas.length > 0
                    );
                  });

              oportunidadesPorEmpresaRef.current.set(
                empresa.id,
                lista
              );

              actualizarListaCompleta();
              setCargando(false);
            },
            (firebaseError) => {
              console.error(firebaseError);
              setError(
                "No se pudieron cargar algunas oportunidades."
              );
              setCargando(false);
            }
          );

          suscripcionesRef.current.set(
            empresa.id,
            cancelarConversaciones
          );
        });

        setCargando(false);
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("No se pudieron cargar las empresas.");
        setCargando(false);
      }
    );

    function actualizarListaCompleta() {
      const todas = Array.from(
        oportunidadesPorEmpresaRef.current.values()
      )
        .flat()
        .sort((a, b) => {
          const fechaA =
            a.updatedAt?.toMillis() ||
            a.createdAt?.toMillis() ||
            0;

          const fechaB =
            b.updatedAt?.toMillis() ||
            b.createdAt?.toMillis() ||
            0;

          return fechaB - fechaA;
        });

      setOportunidades(todas);
    }

    return () => {
      cancelarEmpresas();

      suscripcionesRef.current.forEach((cancelar) =>
        cancelar()
      );

      suscripcionesRef.current.clear();
      oportunidadesPorEmpresaRef.current.clear();
    };
  }, [usuario]);

  const oportunidadesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return oportunidades;

    return oportunidades.filter((oportunidad) => {
      return (
        oportunidad.empresaNombre
          .toLowerCase()
          .includes(texto) ||
        oportunidad.visitanteId.toLowerCase().includes(texto) ||
        oportunidad.email?.toLowerCase().includes(texto) ||
        oportunidad.telefono?.toLowerCase().includes(texto) ||
        oportunidad.ultimoMensaje
          ?.toLowerCase()
          .includes(texto) ||
        oportunidad.etiquetas.some((etiqueta) =>
          etiqueta.toLowerCase().includes(texto)
        )
      );
    });
  }, [busqueda, oportunidades]);

  async function cambiarEtapa(
    oportunidad: Oportunidad,
    etapa: Etapa
  ) {
    if (oportunidad.etapa === etapa) return;

    try {
      setActualizandoId(oportunidad.id);
      setError("");

      await updateDoc(
        doc(
          db,
          "companies",
          oportunidad.empresaId,
          "conversations",
          oportunidad.id
        ),
        {
          etapaOportunidad: etapa,
          updatedAt: new Date(),
        }
      );
    } catch (firebaseError) {
      console.error(firebaseError);
      setError("No se pudo cambiar la etapa.");
    } finally {
      setActualizandoId(null);
    }
  }

  function iniciarArrastre(
    event: DragEvent<HTMLDivElement>,
    oportunidad: Oportunidad
  ) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        id: oportunidad.id,
        empresaId: oportunidad.empresaId,
      })
    );

    event.dataTransfer.effectAllowed = "move";
  }

  function permitirSoltar(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function soltarEnColumna(
    event: DragEvent<HTMLDivElement>,
    etapa: Etapa
  ) {
    event.preventDefault();

    try {
      const datos = JSON.parse(
        event.dataTransfer.getData("application/json")
      );

      const oportunidad = oportunidades.find(
        (item) =>
          item.id === datos.id &&
          item.empresaId === datos.empresaId
      );

      if (oportunidad) {
        void cambiarEtapa(oportunidad, etapa);
      }
    } catch {
      setError("No se pudo mover la oportunidad.");
    }
  }

  function abrirConversacion(oportunidad: Oportunidad) {
    router.push(
      `/dashboard/conversations/${oportunidad.id}?empresaId=${oportunidad.empresaId}`
    );
  }

  const ganadas = oportunidades.filter(
    (oportunidad) => oportunidad.etapa === "ganado"
  ).length;

  const abiertas = oportunidades.filter(
    (oportunidad) =>
      oportunidad.etapa !== "ganado" &&
      oportunidad.etapa !== "perdido"
  ).length;

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-blue-400">
              CRM
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                Oportunidades
              </h1>

              <Badge variant="info">
                {oportunidades.length}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-zinc-400">
              Arrastrá cada oportunidad para cambiar su etapa.
            </p>
          </div>

          <div className="flex gap-3">
            <Resumen label="Abiertas" valor={abiertas} />
            <Resumen label="Ganadas" valor={ganadas} />
          </div>
        </header>

        <Card className="mb-5 p-4">
          <Input
            id="buscarOportunidades"
            value={busqueda}
            onChange={(event) =>
              setBusqueda(event.target.value)
            }
            placeholder="Buscar contacto, empresa, mensaje o etiqueta..."
          />
        </Card>

        {error && (
          <Card className="mb-5 border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {cargando ? (
          <Card className="p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

            <p className="mt-4 text-sm text-zinc-400">
              Cargando oportunidades...
            </p>
          </Card>
        ) : oportunidades.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              Todavía no hay oportunidades
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Aparecerán cuando la IA detecte interés, teléfono,
              email o intención de compra.
            </p>
          </Card>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1650px] grid-cols-6 gap-4">
              {COLUMNAS.map((columna) => {
                const elementos =
                  oportunidadesFiltradas.filter(
                    (oportunidad) =>
                      oportunidad.etapa === columna.id
                  );

                return (
                  <div
                    key={columna.id}
                    onDragOver={permitirSoltar}
                    onDrop={(event) =>
                      soltarEnColumna(event, columna.id)
                    }
                    className="min-h-[600px] rounded-2xl border border-zinc-800 bg-zinc-950/50 p-3"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3 px-1">
                      <div>
                        <h2 className="font-semibold text-white">
                          {columna.titulo}
                        </h2>

                        <p className="mt-1 text-xs text-zinc-500">
                          {columna.descripcion}
                        </p>
                      </div>

                      <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">
                        {elementos.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {elementos.map((oportunidad) => (
                        <div
                          key={`${oportunidad.empresaId}-${oportunidad.id}`}
                          draggable
                          onDragStart={(event) =>
                            iniciarArrastre(
                              event,
                              oportunidad
                            )
                          }
                          className={[
                            "cursor-grab rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg transition hover:border-zinc-700 active:cursor-grabbing",
                            actualizandoId === oportunidad.id
                              ? "opacity-50"
                              : "",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {obtenerNombreVisitante(
                                  oportunidad.visitanteId
                                )}
                              </p>

                              <p className="mt-1 truncate text-xs text-blue-400">
                                {oportunidad.empresaNombre}
                              </p>
                            </div>

                            <span
                              className={obtenerColorLead(
                                oportunidad.puntuacionLead
                              )}
                            >
                              {oportunidad.puntuacionLead}
                            </span>
                          </div>

                          <p className="mt-3 line-clamp-3 text-sm leading-5 text-zinc-400">
                            {oportunidad.ultimoMensaje ||
                              "Sin mensaje reciente"}
                          </p>

                          <div className="mt-3 space-y-1 text-xs text-zinc-500">
                            {oportunidad.telefono && (
                              <p>📞 {oportunidad.telefono}</p>
                            )}

                            {oportunidad.email && (
                              <p className="truncate">
                                ✉️ {oportunidad.email}
                              </p>
                            )}
                          </div>

                          {oportunidad.etiquetas.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {oportunidad.etiquetas
                                .slice(0, 3)
                                .map((etiqueta) => (
                                  <span
                                    key={etiqueta}
                                    className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] text-blue-400"
                                  >
                                    {etiqueta}
                                  </span>
                                ))}
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
                            <span className="text-[11px] text-zinc-600">
                              {formatearFecha(
                                oportunidad.updatedAt ||
                                  oportunidad.createdAt
                              )}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                abrirConversacion(
                                  oportunidad
                                )
                              }
                              className="text-xs font-medium text-blue-400 hover:text-blue-300"
                            >
                              Abrir chat
                            </button>
                          </div>
                        </div>
                      ))}

                      {elementos.length === 0 && (
                        <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
                          <p className="text-xs text-zinc-600">
                            Soltá una oportunidad acá
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

function normalizarEtapa(valor?: string): Etapa {
  const etapas: Etapa[] = [
    "nuevo",
    "contactado",
    "presupuesto",
    "negociacion",
    "ganado",
    "perdido",
  ];

  return etapas.includes(valor as Etapa)
    ? (valor as Etapa)
    : "nuevo";
}

function obtenerNombreVisitante(visitanteId: string) {
  return `Visitante ${visitanteId
    .replace("visitante-", "")
    .slice(0, 8)}`;
}

function obtenerColorLead(puntuacion: number) {
  if (puntuacion >= 70) {
    return "rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400";
  }

  if (puntuacion >= 40) {
    return "rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-400";
  }

  return "rounded-full bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400";
}

function formatearFecha(timestamp?: Timestamp) {
  if (!timestamp) return "";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(timestamp.toDate());
}

function Resumen({
  label,
  valor,
}: {
  label: string;
  valor: number;
}) {
  return (
    <div className="min-w-24 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">
        {valor}
      </p>
    </div>
  );
}