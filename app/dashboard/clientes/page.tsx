"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge from "@/components/Ui/Badge";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type Empresa = {
  id: string;
  nombre: string;
};

type Lead = {
  id: string;
  empresaId: string;
  empresaNombre: string;
  visitanteId: string;
  chatId: string;
  email?: string;
  telefono?: string;
  puntuacionLead?: number;
  nivelInteres?: string;
  etiquetas?: string[];
  cantidadMensajes?: number;
  estado?: string;
  updatedAt?: Timestamp;
  createdAt?: Timestamp;
};

type Cliente = {
  id: string;
  visitanteId: string;
  empresaId: string;
  empresaNombre: string;
  email?: string;
  telefono?: string;
  puntuacionLead: number;
  nivelInteres: string;
  etiquetas: string[];
  conversaciones: number;
  mensajes: number;
  ultimaActividad?: Timestamp;
  ultimoChatId: string;
};

export default function ClientesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

    const cancelaciones: Unsubscribe[] = [];
    const leadsPorEmpresa = new Map<string, Lead[]>();

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", usuario.uid)
    );

    const cancelarEmpresas = onSnapshot(
      empresasQuery,
      (snapshotEmpresas) => {
        setCargando(true);
        setError("");

        cancelaciones.forEach((cancelar) => cancelar());
        cancelaciones.length = 0;
        leadsPorEmpresa.clear();

        const empresas: Empresa[] = snapshotEmpresas.docs.map((documento) => ({
          id: documento.id,
          nombre: documento.data().nombre || "Empresa sin nombre",
        }));

        if (empresas.length === 0) {
          setLeads([]);
          setCargando(false);
          return;
        }

        const empresasCargadas = new Set<string>();

        empresas.forEach((empresa) => {
          const conversacionesQuery = query(
            collection(db, "companies", empresa.id, "conversations"),
            orderBy("updatedAt", "desc")
          );

          const cancelar = onSnapshot(
            conversacionesQuery,
            (snapshotConversaciones) => {
              const lista: Lead[] = snapshotConversaciones.docs.map(
                (documento) => {
                  const datos = documento.data();

                  return {
                    id: documento.id,
                    chatId: documento.id,
                    empresaId: empresa.id,
                    empresaNombre: empresa.nombre,
                    visitanteId:
                      datos.visitanteId || `anonimo-${documento.id}`,
                    email: datos.email || "",
                    telefono: datos.telefono || "",
                    puntuacionLead:
                      typeof datos.puntuacionLead === "number"
                        ? datos.puntuacionLead
                        : 0,
                    nivelInteres: datos.nivelInteres || "bajo",
                    etiquetas: Array.isArray(datos.etiquetas)
                      ? datos.etiquetas
                      : [],
                    cantidadMensajes:
                      typeof datos.cantidadMensajes === "number"
                        ? datos.cantidadMensajes
                        : 0,
                    estado: datos.estado || "abierta",
                    updatedAt: datos.updatedAt,
                    createdAt: datos.createdAt,
                  };
                }
              );

              leadsPorEmpresa.set(empresa.id, lista);
              setLeads(Array.from(leadsPorEmpresa.values()).flat());

              empresasCargadas.add(empresa.id);

              if (empresasCargadas.size >= empresas.length) {
                setCargando(false);
              }
            },
            (firebaseError) => {
              console.error(firebaseError);
              setError("No se pudieron cargar algunas conversaciones.");
              setCargando(false);
            }
          );

          cancelaciones.push(cancelar);
        });
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError("No se pudieron cargar las empresas.");
        setCargando(false);
      }
    );

    return () => {
      cancelarEmpresas();
      cancelaciones.forEach((cancelar) => cancelar());
    };
  }, [usuario]);

  const clientes = useMemo(() => {
    const mapa = new Map<string, Cliente>();

    leads.forEach((lead) => {
      const clave = `${lead.empresaId}-${lead.visitanteId}`;
      const existente = mapa.get(clave);
      const fechaLead = lead.updatedAt || lead.createdAt;

      if (!existente) {
        mapa.set(clave, {
          id: clave,
          visitanteId: lead.visitanteId,
          empresaId: lead.empresaId,
          empresaNombre: lead.empresaNombre,
          email: lead.email,
          telefono: lead.telefono,
          puntuacionLead: lead.puntuacionLead || 0,
          nivelInteres: lead.nivelInteres || "bajo",
          etiquetas: lead.etiquetas || [],
          conversaciones: 1,
          mensajes: lead.cantidadMensajes || 0,
          ultimaActividad: fechaLead,
          ultimoChatId: lead.chatId,
        });

        return;
      }

      existente.conversaciones += 1;
      existente.mensajes += lead.cantidadMensajes || 0;
      existente.puntuacionLead = Math.max(
        existente.puntuacionLead,
        lead.puntuacionLead || 0
      );
      existente.email = existente.email || lead.email;
      existente.telefono = existente.telefono || lead.telefono;
      existente.etiquetas = Array.from(
        new Set([...existente.etiquetas, ...(lead.etiquetas || [])])
      );

      const fechaExistente = existente.ultimaActividad?.toMillis() || 0;
      const fechaNueva = fechaLead?.toMillis() || 0;

      if (fechaNueva > fechaExistente) {
        existente.ultimaActividad = fechaLead;
        existente.ultimoChatId = lead.chatId;
        existente.nivelInteres =
          lead.nivelInteres || existente.nivelInteres;
      }
    });

    return Array.from(mapa.values()).sort((a, b) => {
      return (
        (b.ultimaActividad?.toMillis() || 0) -
        (a.ultimaActividad?.toMillis() || 0)
      );
    });
  }, [leads]);

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      return (
        cliente.visitanteId.toLowerCase().includes(texto) ||
        cliente.empresaNombre.toLowerCase().includes(texto) ||
        cliente.email?.toLowerCase().includes(texto) ||
        cliente.telefono?.toLowerCase().includes(texto) ||
        cliente.etiquetas.some((etiqueta) =>
          etiqueta.toLowerCase().includes(texto)
        )
      );
    });
  }, [busqueda, clientes]);

  const abrirCliente = (cliente: Cliente) => {
    router.push(
      `/dashboard/conversations/${cliente.ultimoChatId}?empresaId=${cliente.empresaId}`
    );
  };

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-sm font-medium text-blue-400">CRM</p>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Clientes</h1>

            <Badge variant="info">{clientes.length}</Badge>
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            Contactos detectados automáticamente desde las conversaciones.
          </p>
        </header>

        <Card className="mb-5 p-4">
          <Input
            id="buscarClientes"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar cliente, teléfono, email, empresa o etiqueta..."
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
              Cargando clientes...
            </p>
          </Card>
        ) : clientesFiltrados.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <p className="text-xl font-semibold text-white">
              No hay clientes todavía
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Aparecerán automáticamente cuando alguien escriba al widget.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-zinc-800 bg-zinc-900/60">
                  <tr className="text-xs uppercase text-zinc-500">
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Contacto</th>
                    <th className="px-5 py-4">Empresa</th>
                    <th className="px-5 py-4">Lead</th>
                    <th className="px-5 py-4">Etiquetas</th>
                    <th className="px-5 py-4">Actividad</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800">
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-zinc-800/30"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-white">
                          {obtenerNombreVisitante(cliente.visitanteId)}
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                          {cliente.conversaciones} conversaciones ·{" "}
                          {cliente.mensajes} mensajes
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <p className="text-zinc-300">
                          {cliente.telefono || "Sin teléfono"}
                        </p>

                        <p className="mt-1 text-zinc-500">
                          {cliente.email || "Sin email"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-zinc-300">
                        {cliente.empresaNombre}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {cliente.puntuacionLead}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-xs ${obtenerColorInteres(
                              cliente.nivelInteres
                            )}`}
                          >
                            {cliente.nivelInteres}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {cliente.etiquetas.length === 0 ? (
                            <span className="text-sm text-zinc-600">
                              Sin etiquetas
                            </span>
                          ) : (
                            cliente.etiquetas.slice(0, 4).map((etiqueta) => (
                              <span
                                key={etiqueta}
                                className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400"
                              >
                                {etiqueta}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-zinc-400">
                        {formatearFecha(cliente.ultimaActividad)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => abrirCliente(cliente)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                        >
                          Abrir chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </DashboardLayout>
  );
}

function obtenerNombreVisitante(visitanteId: string) {
  const idVisible = visitanteId.replace("visitante-", "").slice(0, 8);

  return `Visitante ${idVisible}`;
}

function obtenerColorInteres(nivel: string) {
  const valor = nivel.toLowerCase();

  if (valor === "alto") {
    return "bg-emerald-500/10 text-emerald-400";
  }

  if (valor === "medio") {
    return "bg-amber-500/10 text-amber-400";
  }

  return "bg-zinc-700 text-zinc-300";
}

function formatearFecha(timestamp?: Timestamp) {
  if (!timestamp) return "Sin actividad";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}