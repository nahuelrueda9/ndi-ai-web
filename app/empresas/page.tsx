"use client";

import type { FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  AlertTriangle,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  collectionGroup,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentReference,
  type Timestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneSuscripcionActiva,
  obtenerNombrePlan,
  type PlanId,
} from "@/lib/plans/planAccess";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type RolEquipo =
  | "administrador"
  | "supervisor"
  | "operador";

type TipoAcceso =
  | "propietario"
  | "miembro";

interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
  email: string;
  telefono: string;
  userId: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: Timestamp;
  createdAt?: Timestamp;
  acceso: TipoAcceso;
  rol?: RolEquipo;
}

interface Membresia {
  uid?: string;
  rol?: RolEquipo;
  estado?: "activo" | "inactivo";
}

const NOMBRES_ROL: Record<
  RolEquipo,
  string
> = {
  administrador: "Administrador",
  supervisor: "Supervisor",
  operador: "Operador",
};

export default function EmpresasPage() {
  const [authCargando, setAuthCargando] =
    useState(true);

  const [user, setUser] =
    useState<User | null>(null);

  const [
    empresasPropias,
    setEmpresasPropias,
  ] = useState<Empresa[]>([]);

  const [
    empresasCompartidas,
    setEmpresasCompartidas,
  ] = useState<Empresa[]>([]);

  const [
    cargandoPropias,
    setCargandoPropias,
  ] = useState(true);

  const [
    cargandoCompartidas,
    setCargandoCompartidas,
  ] = useState(true);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [nombre, setNombre] =
    useState("");

  const [rubro, setRubro] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  const [
    errorPropias,
    setErrorPropias,
  ] = useState("");

  const [
    errorCompartidas,
    setErrorCompartidas,
  ] = useState("");

  const [
    empresaAEliminar,
    setEmpresaAEliminar,
  ] = useState<Empresa | null>(null);

  const [
    confirmacionEliminacion,
    setConfirmacionEliminacion,
  ] = useState("");

  const [
    eliminandoEmpresa,
    setEliminandoEmpresa,
  ] = useState(false);

  const [
    errorEliminacion,
    setErrorEliminacion,
  ] = useState("");

  useEffect(() => {
    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (!currentUser) {
            window.location.href =
              "/login";
            return;
          }

          setUser(currentUser);
          setAuthCargando(false);
        }
      );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setCargandoPropias(true);
    setCargandoCompartidas(true);
    setErrorPropias("");
    setErrorCompartidas("");

    let activo = true;
    let cargaCompartidasActual = 0;

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const membresiasQuery = query(
      collectionGroup(db, "members"),
      where("uid", "==", user.uid),
      where("estado", "==", "activo")
    );

    const unsubscribeEmpresas =
      onSnapshot(
        empresasQuery,
        (snapshot) => {
          if (!activo) {
            return;
          }

          const empresasData =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...(documento.data() as Omit<
                  Empresa,
                  "id" | "acceso"
                >),
                acceso:
                  "propietario" as const,
              })
            );

          setEmpresasPropias(
            empresasData
          );

          setErrorPropias("");
          setCargandoPropias(false);
        },
        (firebaseError) => {
          console.error(
            "Error al cargar empresas propias:",
            firebaseError
          );

          if (!activo) {
            return;
          }

          setErrorPropias(
            "No se pudieron cargar tus empresas."
          );

          setCargandoPropias(false);
        }
      );

    const unsubscribeMembresias =
      onSnapshot(
        membresiasQuery,
        async (snapshot) => {
          const numeroCarga =
            ++cargaCompartidasActual;

          try {
            const empresasPorId =
              new Map<
                string,
                {
                  rol: RolEquipo;
                  referencia: DocumentReference;
                }
              >();

            snapshot.docs.forEach(
              (documento) => {
                const empresaReferencia =
                  documento.ref.parent.parent;

                if (!empresaReferencia) {
                  return;
                }

                const membresia =
                  documento.data() as Membresia;

                empresasPorId.set(
                  empresaReferencia.id,
                  {
                    rol:
                      membresia.rol ??
                      "operador",
                    referencia:
                      empresaReferencia,
                  }
                );
              }
            );

            const resultados =
              await Promise.all(
                Array.from(
                  empresasPorId.entries()
                ).map(
                  async ([
                    empresaId,
                    acceso,
                  ]) => {
                    const empresaSnapshot =
                      await getDoc(
                        acceso.referencia
                      );

                    if (
                      !empresaSnapshot.exists()
                    ) {
                      return null;
                    }

                    return {
                      id: empresaId,
                      ...(empresaSnapshot.data() as Omit<
                        Empresa,
                        | "id"
                        | "acceso"
                        | "rol"
                      >),
                      acceso:
                        "miembro" as const,
                      rol: acceso.rol,
                    };
                  }
                )
              );

            if (
              !activo ||
              numeroCarga !==
                cargaCompartidasActual
            ) {
              return;
            }

setEmpresasCompartidas(
  resultados.filter(
    (empresa) => empresa !== null
  )
);

            setErrorCompartidas("");
          } catch (firebaseError) {
            console.error(
              "Error al cargar empresas compartidas:",
              firebaseError
            );

            if (
              activo &&
              numeroCarga ===
                cargaCompartidasActual
            ) {
              setErrorCompartidas(
                "No se pudieron cargar las empresas donde participás."
              );
            }
          } finally {
            if (
              activo &&
              numeroCarga ===
                cargaCompartidasActual
            ) {
              setCargandoCompartidas(
                false
              );
            }
          }
        },
        (firebaseError) => {
          console.error(
            "Error al cargar membresías:",
            firebaseError
          );

          if (!activo) {
            return;
          }

          setErrorCompartidas(
            firebaseError.code ===
              "failed-precondition"
              ? "Firestore necesita crear un índice para mostrar las empresas compartidas."
              : "No se pudieron cargar las empresas donde participás."
          );

          setCargandoCompartidas(false);
        }
      );

    return () => {
      activo = false;
      unsubscribeEmpresas();
      unsubscribeMembresias();
    };
  }, [user]);

  const empresas = useMemo(() => {
    const resultado =
      new Map<string, Empresa>();

    empresasPropias.forEach(
      (empresa) => {
        resultado.set(
          empresa.id,
          empresa
        );
      }
    );

    empresasCompartidas.forEach(
      (empresa) => {
        if (
          !resultado.has(empresa.id)
        ) {
          resultado.set(
            empresa.id,
            empresa
          );
        }
      }
    );

    return Array.from(
      resultado.values()
    );
  }, [
    empresasPropias,
    empresasCompartidas,
  ]);

  const loading =
    authCargando ||
    (Boolean(user) &&
      (cargandoPropias ||
        cargandoCompartidas));

  const error =
    errorFormulario ||
    errorPropias ||
    errorCompartidas;

  async function handleCrearEmpresa(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!user || guardando) {
      return;
    }

    const nombreLimpio =
      nombre.trim();

    const rubroLimpio =
      rubro.trim();

    if (!nombreLimpio) {
      setErrorFormulario(
        "Ingresá el nombre de la empresa."
      );
      return;
    }

    if (!rubroLimpio) {
      setErrorFormulario(
        "Ingresá el rubro de la empresa."
      );
      return;
    }

    setErrorFormulario("");
    setGuardando(true);

    try {
      await addDoc(
        collection(db, "companies"),
        {
          nombre: nombreLimpio,
          rubro: rubroLimpio,
          email: email.trim(),
          telefono: telefono.trim(),
          userId: user.uid,

          /*
           * "free" se conserva únicamente como ID interno
           * compatible para Página Simple.
           *
           * NO guardamos subscriptionStatus ni vencimiento acá:
           * la empresa queda SIN PLAN ACTIVO hasta que Mercado Pago
           * confirme una compra desde el backend.
           */
          plan: "free",

          createdAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp(),
        }
      );

      setNombre("");
      setRubro("");
      setEmail("");
      setTelefono("");
      setMostrarFormulario(false);
    } catch (firebaseError) {
      console.error(
        "Error al crear empresa:",
        firebaseError
      );

      setErrorFormulario(
        "No se pudo guardar la empresa."
      );
    } finally {
      setGuardando(false);
    }
  }

  function abrirEliminarEmpresa(
    empresa: Empresa,
  ) {
    setEmpresaAEliminar(empresa);
    setConfirmacionEliminacion("");
    setErrorEliminacion("");
  }

  function cerrarEliminarEmpresa() {
    if (eliminandoEmpresa) {
      return;
    }

    setEmpresaAEliminar(null);
    setConfirmacionEliminacion("");
    setErrorEliminacion("");
  }

  async function handleEliminarEmpresa() {
    if (
      !user ||
      !empresaAEliminar ||
      eliminandoEmpresa
    ) {
      return;
    }

    const confirmacion =
      confirmacionEliminacion.trim();

    if (
      confirmacion !==
      empresaAEliminar.nombre.trim()
    ) {
      setErrorEliminacion(
        "Escribí exactamente el nombre de la empresa para confirmar.",
      );
      return;
    }

    setEliminandoEmpresa(true);
    setErrorEliminacion("");

    try {
      const idToken =
        await user.getIdToken(true);

      const response =
        await fetch(
          "/api/companies/delete",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              empresaId:
                empresaAEliminar.id,
              confirmacion,
            }),
          },
        );

      const data =
        (await response.json()) as {
          ok?: boolean;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudo eliminar la empresa.",
        );
      }

      setEmpresaAEliminar(null);
      setConfirmacionEliminacion("");
      setErrorEliminacion("");
    } catch (deleteError) {
      console.error(
        "Error al eliminar empresa:",
        deleteError,
      );

      setErrorEliminacion(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la empresa.",
      );
    } finally {
      setEliminandoEmpresa(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium">
            Cargando empresas...
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            Estamos preparando tu espacio
            de trabajo.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-7">
        <div className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 shadow-lg shadow-blue-600/10 dark:border-blue-500/20 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-950">
          <div className="relative px-5 py-5 sm:px-6 sm:py-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-32 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-blue-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tus espacios en NDI AI
                </div>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Administrá tus negocios
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-5 text-blue-100">
                  Entrá al negocio que quieras administrar, revisá su plan o creá un nuevo espacio de trabajo.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <Avatar
                    name={
                      user?.displayName ||
                      user?.email ||
                      "Usuario"
                    }
                    src={
                      user?.photoURL ||
                      undefined
                    }
                    size="sm"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.displayName || "Usuario"}
                    </p>

                    <p className="max-w-56 truncate text-xs text-blue-100">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(
                      (estadoAnterior) =>
                        !estadoAnterior
                    );

                    setErrorFormulario("");
                  }}
                  className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                    mostrarFormulario
                      ? "border border-white/20 bg-white/10 text-white hover:bg-white/15"
                      : "bg-white text-blue-700 shadow-lg shadow-blue-950/10 hover:bg-blue-50"
                  }`}
                >
                  {mostrarFormulario ? (
                    "Cancelar"
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Nueva empresa
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Empresas
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {empresas.length}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Propias
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {empresasPropias.length}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Compartidas
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {empresasCompartidas.length}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <UsersRound className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Tus espacios
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Empresas
            </h2>
          </div>

          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Entrá al panel de la empresa que quieras administrar.
          </p>
        </div>

        {mostrarFormulario && (
          <Card className="mb-5 overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Crear una nueva empresa
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                Cargá los datos principales.
                Después elegís el plan que querés
                contratar para este negocio.
              </p>
            </div>

            <form
              onSubmit={
                handleCrearEmpresa
              }
              className="grid gap-4 p-5 md:grid-cols-2"
            >
              <Input
                id="nombre"
                label="Nombre de la empresa"
                value={nombre}
                onChange={(event) =>
                  setNombre(
                    event.target.value
                  )
                }
                placeholder="Ejemplo: Clínica Norte"
                required
              />

              <Input
                id="rubro"
                label="Rubro"
                value={rubro}
                onChange={(event) =>
                  setRubro(
                    event.target.value
                  )
                }
                placeholder="Ejemplo: Consultorio odontológico"
                required
              />

              <Input
                id="emailEmpresa"
                label="Correo"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="contacto@tunegocio.com"
              />

              <Input
                id="telefono"
                label="Teléfono"
                type="tel"
                value={telefono}
                onChange={(event) =>
                  setTelefono(
                    event.target.value
                  )
                }
                placeholder="+54 9 11 1234-5678"
              />

              <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMostrarFormulario(
                      false
                    );

                    setErrorFormulario(
                      ""
                    );
                  }}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={guardando}
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar empresa"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </Card>
        )}

        {empresas.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
              🏢
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
              Todavía no tenés empresas
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-zinc-500">
              Creá una empresa o aceptá una
              invitación para comenzar a
              trabajar en NDI AI.
            </p>

            <Button
              className="mt-6"
              onClick={() =>
                setMostrarFormulario(true)
              }
            >
              Crear primera empresa
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {empresas.map((empresa) => {
              const esPropietario =
                empresa.acceso ===
                "propietario";

              const nombreRol =
                empresa.rol
                  ? NOMBRES_ROL[
                      empresa.rol
                    ]
                  : "Propietario";

              const planInterno: PlanId =
                empresa.plan === "pro" ||
                empresa.plan === "business"
                  ? empresa.plan
                  : "free";

              const suscripcionActiva =
                empresaTieneSuscripcionActiva(
                  empresa
                );

              const nombrePlan =
                suscripcionActiva
                  ? obtenerNombrePlan(
                      planInterno
                    )
                  : "Sin plan activo";

              return (
                <Card
                  key={empresa.id}
                  className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl dark:hover:border-zinc-700"
                >
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={
                            empresa.nombre
                          }
                          size="sm"
                        />

                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                            {empresa.nombre}
                          </h2>

                          <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-zinc-500">
                            {empresa.rubro ||
                              "Sin rubro"}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          esPropietario
                            ? "success"
                            : "info"
                        }
                      >
                        {esPropietario
                          ? "Propietario"
                          : nombreRol}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <InfoRow
                        label="Correo"
                        value={
                          empresa.email ||
                          "Sin correo"
                        }
                      />

                      <InfoRow
                        label="Teléfono"
                        value={
                          empresa.telefono ||
                          "Sin teléfono"
                        }
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <MiniMetric
                        label="Acceso"
                        value={
                          esPropietario
                            ? "Propietario"
                            : "Equipo"
                        }
                      />

                      <MiniMetric
                        label="Rol"
                        value={nombreRol}
                      />

                      <MiniMetric
                        label="Plan"
                        value={nombrePlan}
                      />
                    </div>

                    {esPropietario &&
                      !suscripcionActiva && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            Todavía no hay un plan activo.
                          </p>

                          <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                            Elegí Página Simple, Página Completa o Business IA para activar las funciones comerciales del negocio.
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-slate-200 p-3 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          esPropietario &&
                          !suscripcionActiva
                            ? `/empresas/${empresa.id}/planes`
                            : `/empresas/${empresa.id}/dashboard`;
                      }}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
                    >
                      {esPropietario &&
                      !suscripcionActiva ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}

                      {esPropietario &&
                      !suscripcionActiva
                        ? "Elegir plan"
                        : "Entrar al panel"}

                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          esPropietario
                            ? `/empresas/${empresa.id}`
                            : `/empresas/${empresa.id}/dashboard`;
                      }}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                    >
                      <Settings2 className="h-4 w-4" />
                      {esPropietario
                        ? "Configurar"
                        : "Ver panel"}
                    </button>

                    {esPropietario && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEliminarEmpresa(
                            empresa,
                          )
                        }
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-red-500/10"
                        aria-label={`Eliminar ${empresa.nombre}`}
                        title="Eliminar empresa"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:hidden">
                          Eliminar
                        </span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {empresaAEliminar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-eliminar-empresa"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-zinc-800">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
                    Acción permanente
                  </p>

                  <h2
                    id="titulo-eliminar-empresa"
                    className="mt-1 text-xl font-bold text-slate-950 dark:text-white"
                  >
                    Eliminar empresa
                  </h2>
                </div>
              </div>

              <button
                type="button"
                disabled={eliminandoEmpresa}
                onClick={cerrarEliminarEmpresa}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">
                Se eliminará el espacio de{" "}
                <strong className="text-slate-950 dark:text-white">
                  {empresaAEliminar.nombre}
                </strong>{" "}
                junto con sus datos guardados en NDI AI, como catálogo,
                turnos, conversaciones, estadísticas y configuraciones.
              </p>

              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                Esta acción no se puede deshacer.
              </div>

              <label
                htmlFor="confirmarEliminarEmpresa"
                className="mt-5 block text-sm font-medium text-slate-700 dark:text-zinc-300"
              >
                Para confirmar, escribí{" "}
                <span className="font-bold text-slate-950 dark:text-white">
                  {empresaAEliminar.nombre}
                </span>
              </label>

              <input
                id="confirmarEliminarEmpresa"
                type="text"
                autoComplete="off"
                value={confirmacionEliminacion}
                disabled={eliminandoEmpresa}
                onChange={(event) => {
                  setConfirmacionEliminacion(
                    event.target.value,
                  );
                  setErrorEliminacion("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder={empresaAEliminar.nombre}
              />

              {errorEliminacion && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {errorEliminacion}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={eliminandoEmpresa}
                  onClick={cerrarEliminarEmpresa}
                >
                  Cancelar
                </Button>

                <button
                  type="button"
                  disabled={
                    eliminandoEmpresa ||
                    confirmacionEliminacion.trim() !==
                      empresaAEliminar.nombre.trim()
                  }
                  onClick={() =>
                    void handleEliminarEmpresa()
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />

                  {eliminandoEmpresa
                    ? "Eliminando..."
                    : "Eliminar definitivamente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-500 dark:text-zinc-500">
        {label}
      </span>

      <span title={value} className="max-w-[68%] truncate text-right text-slate-800 dark:text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="truncate text-[10px] text-slate-500 dark:text-zinc-500">
        {label}
      </p>

      <p title={value} className="mt-0.5 truncate text-[11px] font-medium text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}