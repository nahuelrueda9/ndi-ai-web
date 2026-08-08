"use client";

import type { FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  MessageSquareText,
  Plus,
  Settings2,
  Sparkles,
  UsersRound,
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
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 shadow-xl shadow-blue-600/10 dark:border-blue-500/20 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-950">
          <div className="relative px-6 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-32 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Workspace de NDI AI
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Bienvenido{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Elegí la empresa con la que querés trabajar o creá un nuevo espacio para empezar a atender clientes con NDI AI.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
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
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
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

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Empresas
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                  {empresas.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Propias
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                  {empresasPropias.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                  Compartidas
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                  {empresasCompartidas.length}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                <UsersRound className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Tus espacios
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Empresas
            </h2>
          </div>

          <p className="text-sm text-slate-500 dark:text-zinc-500">
            Entrá al panel de la empresa que quieras administrar.
          </p>
        </div>

        {mostrarFormulario && (
          <Card className="mb-6 overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Crear una nueva empresa
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
                Cargá los datos principales.
                Después podrás configurar su
                agente y la base de
                conocimiento.
              </p>
            </div>

            <form
              onSubmit={
                handleCrearEmpresa
              }
              className="grid gap-5 p-6 md:grid-cols-2"
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
                placeholder="Ejemplo: Santa Cornelia SRL"
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
                placeholder="Ejemplo: Ganadería"
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
                placeholder="empresa@correo.com"
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
                placeholder="+54 9 388..."
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
          <div className="grid gap-5 lg:grid-cols-2">
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

              return (
                <Card
                  key={empresa.id}
                  className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl dark:hover:border-zinc-700"
                >
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar
                          name={
                            empresa.nombre
                          }
                          size="md"
                        />

                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                            {empresa.nombre}
                          </h2>

                          <p className="mt-1 truncate text-sm text-slate-600 dark:text-zinc-500">
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

                    <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
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

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <MiniMetric
                        label="Acceso"
                        value={
                          esPropietario
                            ? "Completo"
                            : "Equipo"
                        }
                      />

                      <MiniMetric
                        label="Rol"
                        value={nombreRol}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 border-t border-slate-200 p-4 dark:border-zinc-800 sm:grid-cols-[1fr_auto]">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/empresas/${empresa.id}/conversaciones`;
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Entrar al panel
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          esPropietario
                            ? `/empresas/${empresa.id}`
                            : `/empresas/${empresa.id}/agenda`;
                      }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                    >
                      <Settings2 className="h-4 w-4" />
                      {esPropietario
                        ? "Configurar"
                        : "Agenda"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
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
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 dark:text-zinc-500">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-slate-800 dark:text-zinc-300">
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
      <p className="text-xs text-slate-500 dark:text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}