"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  Check,
  Copy,
  Crown,
  Link2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  UserX,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

type RolEquipo =
  | "administrador"
  | "supervisor"
  | "operador";

type PlanEmpresa =
  | "free"
  | "pro"
  | "business";

type EmpresaData = {
  userId?: string;
  plan?: PlanEmpresa;
  subscriptionEndsAt?: unknown;
};

function convertirFechaPlan(valor: unknown) {
  if (!valor) return null;

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toDate" in valor &&
    typeof (valor as { toDate?: unknown }).toDate === "function"
  ) {
    return (valor as { toDate: () => Date }).toDate();
  }

  if (valor instanceof Date) {
    return valor;
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number"
  ) {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
      ? null
      : fecha;
  }

  return null;
}

function planPermiteEquipo(
  empresa: EmpresaData
) {
  if (empresa.plan === "business") {
    return true;
  }

  if (empresa.plan !== "pro") {
    return false;
  }

  const vencimiento =
    convertirFechaPlan(
      empresa.subscriptionEndsAt
    );

  return Boolean(
    vencimiento &&
      vencimiento.getTime() > Date.now()
  );
}

type MiembroAccesoData = {
  rol?: Exclude<RolEmpresa, "propietario">;
  estado?: "activo" | "inactivo";
};

type EstadoMiembro =
  | "activo"
  | "inactivo";

type EstadoInvitacion =
  | "pendiente"
  | "aceptada"
  | "cancelada";

type MiembroEquipo = {
  id: string;
  uid?: string;
  nombre: string;
  email: string;
  rol: RolEquipo;
  estado: EstadoMiembro;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type InvitacionEquipo = {
  id: string;
  email: string;
  rol: RolEquipo;
  estado: EstadoInvitacion;
  invitationUrl?: string;
  expiresAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type FormularioInvitacion = {
  email: string;
  rol: RolEquipo;
};

type RespuestaCrearInvitacion = {
  ok?: boolean;
  invitationId?: string;
  invitationUrl?: string;
  error?: string;
};

const FORMULARIO_INICIAL: FormularioInvitacion = {
  email: "",
  rol: "operador",
};

const ROLES: Record<
  RolEquipo,
  {
    nombre: string;
    descripcion: string;
    variant:
      | "default"
      | "info"
      | "success"
      | "danger"
      | "warning";
  }
> = {
  administrador: {
    nombre: "Administrador",
    descripcion:
      "Control total de la empresa, facturación y equipo.",
    variant: "danger",
  },
  supervisor: {
    nombre: "Supervisor",
    descripcion:
      "Gestiona conversaciones, operadores y reportes.",
    variant: "warning",
  },
  operador: {
    nombre: "Operador",
    descripcion:
      "Atiende conversaciones y gestiona contactos.",
    variant: "info",
  },
};

export default function EquipoPage() {
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

  const [miembros, setMiembros] = useState<
    MiembroEquipo[]
  >([]);

  const [invitaciones, setInvitaciones] =
    useState<InvitacionEquipo[]>([]);

  const [formulario, setFormulario] =
    useState<FormularioInvitacion>(
      FORMULARIO_INICIAL
    );

  const [
    mostrandoFormulario,
    setMostrandoFormulario,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [procesandoId, setProcesandoId] =
    useState<string | null>(null);

  const [copiadoId, setCopiadoId] =
    useState<string | null>(null);

  const [enlaceNuevo, setEnlaceNuevo] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] = useState("");

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [
    equipoHabilitado,
    setEquipoHabilitado,
  ] = useState(false);

  useEffect(() => {
    const cancelarAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!empresaId) {
          setError(
            "No se encontró la empresa."
          );
          setCargando(false);
          return;
        }

        const empresaIdSeguro = empresaId;
        const usuarioSeguro = currentUser;

        setAccesoVerificado(false);
        setError("");
        setCargando(true);

        try {
          const empresaReferencia = doc(
            db,
            "companies",
            empresaIdSeguro
          );

          const empresaSnapshot =
            await getDoc(
              empresaReferencia
            );

          if (!empresaSnapshot.exists()) {
            setError(
              "La empresa no existe."
            );
            setCargando(false);
            return;
          }

          const empresa =
            empresaSnapshot.data() as EmpresaData;

          const planHabilitado =
            planPermiteEquipo(
              empresa
            );

          setEquipoHabilitado(
            planHabilitado
          );

          if (
            empresa.userId ===
            usuarioSeguro.uid
          ) {
            setAccesoVerificado(true);

            if (!planHabilitado) {
              setCargando(false);
            }

            return;
          }

          const miembroReferencia = doc(
            db,
            "companies",
            empresaIdSeguro,
            "members",
            usuarioSeguro.uid
          );

          const miembroSnapshot =
            await getDoc(
              miembroReferencia
            );

          if (!miembroSnapshot.exists()) {
            router.replace("/empresas");
            return;
          }

          const miembro =
            miembroSnapshot.data() as MiembroAccesoData;

          const tieneAcceso =
            miembro.estado === "activo" &&
            miembro.rol ===
              "administrador";

          if (!tieneAcceso) {
            router.replace(
              `/empresas/${empresaIdSeguro}/conversaciones`
            );
            return;
          }

          setAccesoVerificado(true);

          if (!planHabilitado) {
            setCargando(false);
          }
        } catch (firebaseError) {
          console.error(
            "Error al verificar acceso al equipo:",
            firebaseError
          );

          setError(
            "No se pudo verificar el acceso a la empresa."
          );
          setCargando(false);
        }
      }
    );

    return () => cancelarAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (
      !empresaId ||
      !accesoVerificado ||
      !equipoHabilitado
    ) {
      return;
    }

    const empresaIdSeguro = empresaId;

    let miembrosCargados = false;
    let invitacionesCargadas = false;

    function actualizarCarga() {
      if (
        miembrosCargados &&
        invitacionesCargadas
      ) {
        setCargando(false);
      }
    }

    const miembrosQuery = query(
      collection(
        db,
        "companies",
        empresaIdSeguro,
        "members"
      ),
      orderBy("createdAt", "asc")
    );

    const invitacionesQuery = query(
      collection(
        db,
        "companies",
        empresaIdSeguro,
        "invitations"
      ),
      orderBy("createdAt", "desc")
    );

    const cancelarMiembros = onSnapshot(
      miembrosQuery,
      (snapshot) => {
        const lista = snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...(documento.data() as Omit<
              MiembroEquipo,
              "id"
            >),
          })
        );

        setMiembros(lista);
        miembrosCargados = true;
        setError("");
        actualizarCarga();
      },
      (firebaseError) => {
        console.error(
          "Error al cargar miembros:",
          firebaseError
        );

        miembrosCargados = true;
        setError(
          firebaseError.code ===
            "permission-denied"
            ? "No tenés permisos para ver el equipo."
            : "No se pudieron cargar los miembros."
        );

        actualizarCarga();
      }
    );

    const cancelarInvitaciones =
      onSnapshot(
        invitacionesQuery,
        (snapshot) => {
          const lista =
            snapshot.docs.map(
              (documento) => ({
                id: documento.id,
                ...(documento.data() as Omit<
                  InvitacionEquipo,
                  "id"
                >),
              })
            );

          setInvitaciones(lista);
          invitacionesCargadas = true;
          setError("");
          actualizarCarga();
        },
        (firebaseError) => {
          console.error(
            "Error al cargar invitaciones:",
            firebaseError
          );

          invitacionesCargadas = true;
          setError(
            firebaseError.code ===
              "permission-denied"
              ? "No tenés permisos para ver las invitaciones."
              : "No se pudieron cargar las invitaciones."
          );

          actualizarCarga();
        }
      );

    return () => {
      cancelarMiembros();
      cancelarInvitaciones();
    };
  }, [
    accesoVerificado,
    equipoHabilitado,
    empresaId,
  ]);

  const invitacionesPendientes =
    useMemo(
      () =>
        invitaciones.filter(
          (invitacion) =>
            invitacion.estado ===
            "pendiente"
        ),
      [invitaciones]
    );

  const resumen = useMemo(() => {
    const activos = miembros.filter(
      (miembro) =>
        miembro.estado === "activo"
    ).length;

    const supervisores =
      miembros.filter(
        (miembro) =>
          miembro.rol === "supervisor" &&
          miembro.estado === "activo"
      ).length;

    const operadores = miembros.filter(
      (miembro) =>
        miembro.rol === "operador" &&
        miembro.estado === "activo"
    ).length;

    return {
      total: miembros.length,
      activos,
      supervisores,
      operadores,
    };
  }, [miembros]);

  function actualizarFormulario<
    Clave extends keyof FormularioInvitacion
  >(
    clave: Clave,
    valor: FormularioInvitacion[Clave]
  ) {
    setFormulario((actual) => ({
      ...actual,
      [clave]: valor,
    }));
  }

  async function crearInvitacion(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (!empresaId || guardando) {
      return;
    }

    setError("");
    setMensaje("");
    setEnlaceNuevo("");

    const email = formulario.email
      .trim()
      .toLowerCase();

    if (!email) {
      setError(
        "Escribí el email del usuario."
      );
      return;
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      );

    if (!emailValido) {
      setError(
        "Ingresá un email válido."
      );
      return;
    }

    const yaEsMiembro = miembros.some(
      (miembro) =>
        miembro.email
          .trim()
          .toLowerCase() === email
    );

    if (yaEsMiembro) {
      setError(
        "Ese usuario ya pertenece al equipo."
      );
      return;
    }

    const yaFueInvitado =
      invitacionesPendientes.some(
        (invitacion) =>
          invitacion.email
            .trim()
            .toLowerCase() === email
      );

    if (yaFueInvitado) {
      setError(
        "Ya existe una invitación pendiente para ese email."
      );
      return;
    }

    const usuario = auth.currentUser;

    if (!usuario) {
      setError(
        "Tu sesión venció. Volvé a iniciar sesión."
      );
      return;
    }

    setGuardando(true);

    try {
      const idToken =
        await usuario.getIdToken(true);

      const respuesta = await fetch(
        "/api/invitaciones/crear",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            empresaId,
            email,
            rol: formulario.rol,
          }),
        }
      );

      const datos =
        (await respuesta.json()) as RespuestaCrearInvitacion;

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo crear la invitación."
        );
      }

      if (!datos.invitationUrl) {
        throw new Error(
          "La invitación se creó, pero no se recibió el enlace."
        );
      }

      setFormulario(
        FORMULARIO_INICIAL
      );

      setMostrandoFormulario(false);
      setEnlaceNuevo(
        datos.invitationUrl
      );

      setMensaje(
        "Invitación creada. Copiá el enlace y envíaselo al usuario."
      );
    } catch (requestError) {
      console.error(
        "Error al crear invitación:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo crear la invitación."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function copiarEnlace(
    enlace: string,
    id: string
  ) {
    if (!enlace) {
      setError(
        "Esta invitación no tiene un enlace disponible."
      );
      return;
    }

    setError("");

    try {
      await navigator.clipboard.writeText(
        enlace
      );

      setCopiadoId(id);
      setMensaje(
        "Enlace copiado al portapapeles."
      );

      window.setTimeout(() => {
        setCopiadoId((actual) =>
          actual === id ? null : actual
        );
      }, 2000);
    } catch (clipboardError) {
      console.error(
        "Error al copiar enlace:",
        clipboardError
      );

      setError(
        "No se pudo copiar el enlace. Seleccionalo y copialo manualmente."
      );
    }
  }

  async function cambiarRol(
    miembro: MiembroEquipo,
    rol: RolEquipo
  ) {
    if (
      !empresaId ||
      procesandoId ||
      miembro.rol === rol
    ) {
      return;
    }

    setProcesandoId(miembro.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "members",
          miembro.id
        ),
        {
          rol,
          updatedAt:
            serverTimestamp(),
        }
      );

      setMensaje(
        `Rol actualizado a ${ROLES[
          rol
        ].nombre}.`
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar rol:",
        firebaseError
      );

      setError(
        "No se pudo cambiar el rol."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function cambiarEstado(
    miembro: MiembroEquipo
  ) {
    if (
      !empresaId ||
      procesandoId
    ) {
      return;
    }

    const nuevoEstado:
      EstadoMiembro =
      miembro.estado === "activo"
        ? "inactivo"
        : "activo";

    setProcesandoId(miembro.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "members",
          miembro.id
        ),
        {
          estado: nuevoEstado,
          updatedAt:
            serverTimestamp(),
        }
      );

      setMensaje(
        nuevoEstado === "activo"
          ? "Miembro activado."
          : "Miembro desactivado."
      );
    } catch (firebaseError) {
      console.error(
        "Error al cambiar estado:",
        firebaseError
      );

      setError(
        "No se pudo actualizar el miembro."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function cancelarInvitacion(
    invitacion: InvitacionEquipo
  ) {
    if (
      !empresaId ||
      procesandoId
    ) {
      return;
    }

    setProcesandoId(invitacion.id);
    setError("");
    setMensaje("");

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "invitations",
          invitacion.id
        ),
        {
          estado: "cancelada",
          updatedAt:
            serverTimestamp(),
        }
      );

      setMensaje(
        "Invitación cancelada."
      );
    } catch (firebaseError) {
      console.error(
        "Error al cancelar invitación:",
        firebaseError
      );

      setError(
        "No se pudo cancelar la invitación."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminarMiembro(
    miembro: MiembroEquipo
  ) {
    if (
      !empresaId ||
      procesandoId
    ) {
      return;
    }

    const confirmar =
      window.confirm(
        `¿Seguro que querés eliminar a ${miembro.nombre || miembro.email} del equipo?`
      );

    if (!confirmar) {
      return;
    }

    setProcesandoId(miembro.id);
    setError("");
    setMensaje("");

    try {
      await deleteDoc(
        doc(
          db,
          "companies",
          empresaId,
          "members",
          miembro.id
        )
      );

      setMensaje(
        "Miembro eliminado del equipo."
      );
    } catch (firebaseError) {
      console.error(
        "Error al eliminar miembro:",
        firebaseError
      );

      setError(
        "No se pudo eliminar el miembro."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  if (
    accesoVerificado &&
    !equipoHabilitado
  ) {
    return (
      <section className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Users className="h-8 w-8" />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Función Pro
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white">
            Equipo
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            La gestión de operadores, supervisores e invitaciones está disponible en los planes Pro y Empresa.
          </p>

          <Button
            type="button"
            className="mt-7"
            onClick={() =>
              router.push(
                `/empresas/${empresaId}/planes`
              )
            }
          >
            Ver plan Pro
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            Gestión de usuarios
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Equipo
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Administrá operadores,
            supervisores y permisos de tu
            empresa.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setMostrandoFormulario(
              (actual) => !actual
            );
            setError("");
            setMensaje("");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />

          {mostrandoFormulario
            ? "Cancelar"
            : "Invitar miembro"}
        </Button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          titulo="Miembros"
          valor={resumen.total}
          icono={
            <Users className="h-5 w-5" />
          }
        />

        <ResumenCard
          titulo="Activos"
          valor={resumen.activos}
          icono={
            <UserCheck className="h-5 w-5" />
          }
        />

        <ResumenCard
          titulo="Supervisores"
          valor={resumen.supervisores}
          icono={
            <ShieldCheck className="h-5 w-5" />
          }
        />

        <ResumenCard
          titulo="Operadores"
          valor={resumen.operadores}
          icono={
            <UserRound className="h-5 w-5" />
          }
        />
      </div>

      {mensaje && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300">
            {mensaje}
          </p>

          {enlaceNuevo && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={enlaceNuevo}
                readOnly
                aria-label="Enlace de invitación"
                className="min-w-0 flex-1 rounded-xl border border-emerald-500/20 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 outline-none"
                onFocus={(evento) =>
                  evento.currentTarget.select()
                }
              />

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  copiarEnlace(
                    enlaceNuevo,
                    "nuevo"
                  )
                }
              >
                {copiadoId === "nuevo" ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}

                {copiadoId === "nuevo"
                  ? "Copiado"
                  : "Copiar enlace"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </Card>
      )}

      {mostrandoFormulario && (
        <Card className="mb-6 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Invitar miembro
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Se generará un enlace seguro,
              válido durante 7 días. Después
              podés copiarlo y enviarlo por
              WhatsApp, email u otro medio.
            </p>
          </div>

          <form
            onSubmit={crearInvitacion}
            className="space-y-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                id="emailMiembro"
                label="Email"
                type="email"
                value={formulario.email}
                onChange={(evento) =>
                  actualizarFormulario(
                    "email",
                    evento.target.value
                  )
                }
                placeholder="operador@empresa.com"
              />

              <div>
                <label
                  htmlFor="rolMiembro"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Rol
                </label>

                <select
                  id="rolMiembro"
                  value={formulario.rol}
                  onChange={(evento) =>
                    actualizarFormulario(
                      "rol",
                      evento.target
                        .value as RolEquipo
                    )
                  }
                  className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="operador">
                    Operador
                  </option>

                  <option value="supervisor">
                    Supervisor
                  </option>

                  <option value="administrador">
                    Administrador
                  </option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {(
                Object.keys(
                  ROLES
                ) as RolEquipo[]
              ).map((rol) => (
                <div
                  key={rol}
                  className={[
                    "rounded-xl border p-4",
                    formulario.rol === rol
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-zinc-800 bg-zinc-950/40",
                  ].join(" ")}
                >
                  <p className="font-medium text-white">
                    {ROLES[rol].nombre}
                  </p>

                  <p className="mt-2 text-sm leading-5 text-zinc-500">
                    {ROLES[rol].descripcion}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col justify-end gap-3 border-t border-zinc-800 pt-5 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMostrandoFormulario(
                    false
                  );
                  setFormulario(
                    FORMULARIO_INICIAL
                  );
                  setError("");
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
                  : "Crear invitación"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {invitacionesPendientes.length >
        0 && (
        <Card className="mb-6 overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-amber-400" />

              <div>
                <h2 className="font-semibold text-white">
                  Invitaciones pendientes
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {
                    invitacionesPendientes.length
                  }{" "}
                  pendientes de aceptación
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-zinc-800">
            {invitacionesPendientes.map(
              (invitacion) => (
                <div
                  key={invitacion.id}
                  className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {invitacion.email}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          ROLES[
                            invitacion.rol
                          ].variant
                        }
                      >
                        {
                          ROLES[
                            invitacion.rol
                          ].nombre
                        }
                      </Badge>

                      <Badge variant="warning">
                        Pendiente
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {invitacion.invitationUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          copiarEnlace(
                            invitacion.invitationUrl!,
                            invitacion.id
                          )
                        }
                      >
                        {copiadoId ===
                        invitacion.id ? (
                          <Check className="mr-2 h-4 w-4" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}

                        {copiadoId ===
                        invitacion.id
                          ? "Copiado"
                          : "Copiar enlace"}
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        Invitación antigua sin
                        enlace. Cancelala y creá
                        una nueva.
                      </span>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={
                        procesandoId ===
                        invitacion.id
                      }
                      onClick={() =>
                        cancelarInvitacion(
                          invitacion
                        )
                      }
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      {cargando ? (
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />

          <p className="mt-4 text-sm text-zinc-400">
            Cargando equipo...
          </p>
        </Card>
      ) : miembros.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Users className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Todavía no hay miembros
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Invitá operadores y
            supervisores para trabajar en
            conjunto.
          </p>

          <Button
            type="button"
            className="mt-6"
            onClick={() =>
              setMostrandoFormulario(true)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Invitar primer miembro
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {miembros.map((miembro) => (
            <Card
              key={miembro.id}
              className="p-5 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    {miembro.rol ===
                    "administrador" ? (
                      <Crown className="h-6 w-6" />
                    ) : miembro.rol ===
                      "supervisor" ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <UserRound className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-white">
                        {miembro.nombre ||
                          miembro.email}
                      </h2>

                      <Badge
                        variant={
                          miembro.estado ===
                          "activo"
                            ? "success"
                            : "default"
                        }
                      >
                        {miembro.estado ===
                        "activo"
                          ? "Activo"
                          : "Inactivo"}
                      </Badge>
                    </div>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {miembro.email}
                    </p>

                    <div className="mt-2">
                      <Badge
                        variant={
                          ROLES[miembro.rol]
                            .variant
                        }
                      >
                        {
                          ROLES[miembro.rol]
                            .nombre
                        }
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Cambiar rol"
                    value={miembro.rol}
                    disabled={
                      procesandoId ===
                      miembro.id
                    }
                    onChange={(evento) =>
                      cambiarRol(
                        miembro,
                        evento.target
                          .value as RolEquipo
                      )
                    }
                    className="h-10 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 outline-none transition focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="operador">
                      Operador
                    </option>

                    <option value="supervisor">
                      Supervisor
                    </option>

                    <option value="administrador">
                      Administrador
                    </option>
                  </select>

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      procesandoId ===
                      miembro.id
                    }
                    onClick={() =>
                      cambiarEstado(miembro)
                    }
                  >
                    {miembro.estado ===
                    "activo" ? (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activar
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    disabled={
                      procesandoId ===
                      miembro.id
                    }
                    onClick={() =>
                      eliminarMiembro(miembro)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Eliminar miembro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6 border-blue-500/20 bg-blue-500/5 p-5">
        <div className="flex gap-3">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

          <div>
            <p className="font-medium text-white">
              Invitaciones reales activadas
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Cada enlace es personal, vence
              a los 7 días y solo puede ser
              aceptado por el correo invitado.
              Al aceptarlo, el usuario obtiene
              los permisos de su rol.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ResumenCard({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {titulo}
        </p>

        <div className="text-emerald-400">
          {icono}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {valor}
      </p>
    </Card>
  );
}