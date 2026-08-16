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
      <section className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-8 sm:py-12">
        <Card className="border-emerald-200 bg-emerald-50 p-5 text-center sm:p-12 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-16 sm:w-16 sm:rounded-2xl">
            <Users className="h-5 w-5 sm:h-8 sm:w-8" />
          </div>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400 sm:mt-6 sm:text-sm sm:tracking-[0.18em]">
            Función Pro
          </p>

          <h1 className="mt-1.5 text-xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
            Equipo
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-3 sm:text-sm sm:leading-6">
            La gestión de operadores, supervisores e invitaciones está disponible en los planes Pro y Empresa.
          </p>

          <Button
            type="button"
            className="mt-4 sm:mt-7"
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
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-4 flex items-end justify-between gap-2 sm:mb-8 sm:flex-col sm:items-stretch sm:gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:text-sm">
            Gestión de usuarios
          </p>

          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
            Equipo
          </h1>

          <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
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
          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />

          {mostrandoFormulario
            ? "Cancelar"
            : "Invitar miembro"}
        </Button>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <Card className="mb-3 border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:text-sm">
            {mensaje}
          </p>

          {enlaceNuevo && (
            <div className="mt-2 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:gap-3">
              <input
                value={enlaceNuevo}
                readOnly
                aria-label="Enlace de invitación"
                className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none dark:border-emerald-500/20 dark:bg-zinc-950 dark:text-zinc-300 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
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
        <Card className="mb-3 border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10 sm:mb-6 sm:p-4">
          <p className="text-xs text-red-700 dark:text-red-400 sm:text-sm">
            {error}
          </p>
        </Card>
      )}

      {mostrandoFormulario && (
        <Card className="mb-3 p-3 sm:mb-6 sm:p-6">
          <div className="mb-3 sm:mb-6">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-xl">
              Invitar miembro
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
              Se generará un enlace seguro,
              válido durante 7 días. Después
              podés copiarlo y enviarlo por
              WhatsApp, email u otro medio.
            </p>
          </div>

          <form
            onSubmit={crearInvitacion}
            className="space-y-3 sm:space-y-5"
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-2">
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
                  className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:text-sm"
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
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[10px] text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white sm:h-12 sm:rounded-xl sm:px-4 sm:text-sm"
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

            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 md:grid-cols-3">
              {(
                Object.keys(
                  ROLES
                ) as RolEquipo[]
              ).map((rol) => (
                <div
                  key={rol}
                  className={[
                    "rounded-lg border p-2 sm:rounded-xl sm:p-4",
                    formulario.rol === rol
                      ? "border-emerald-300 bg-emerald-50 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-medium text-slate-950 dark:text-white sm:text-base">
                    {ROLES[rol].nombre}
                  </p>

                  <p className="mt-1 text-[8px] leading-3 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-5">
                    {ROLES[rol].descripcion}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 dark:border-zinc-800 sm:flex sm:justify-end sm:gap-3 sm:pt-5">
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
        <Card className="mb-3 overflow-hidden sm:mb-6">
          <div className="border-b border-slate-200 px-3 py-2.5 dark:border-zinc-800 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />

              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">
                  Invitaciones pendientes
                </h2>

                <p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                  {
                    invitacionesPendientes.length
                  }{" "}
                  pendientes de aceptación
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-zinc-800">
            {invitacionesPendientes.map(
              (invitacion) => (
                <div
                  key={invitacion.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:px-6 sm:py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-slate-950 dark:text-white sm:text-base">
                      {invitacion.email}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-1 sm:mt-2 sm:gap-2">
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

                  <div className="flex shrink-0 flex-wrap items-center gap-1 sm:gap-2">
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
                      <span className="max-w-[150px] text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:max-w-none sm:text-xs sm:leading-normal">
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
        <Card className="p-6 text-center sm:p-10">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-zinc-700 dark:border-t-emerald-500 sm:h-8 sm:w-8" />

          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
            Cargando equipo...
          </p>
        </Card>
      ) : miembros.length === 0 ? (
        <Card className="border-dashed p-6 text-center sm:p-12">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Users className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>

          <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-white sm:mt-5 sm:text-xl">
            Todavía no hay miembros
          </h2>

          <p className="mx-auto mt-1 max-w-lg text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-6">
            Invitá operadores y
            supervisores para trabajar en
            conjunto.
          </p>

          <Button
            type="button"
            className="mt-3 sm:mt-6"
            onClick={() =>
              setMostrandoFormulario(true)
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            Invitar primer miembro
          </Button>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-4">
          {miembros.map((miembro) => (
            <Card
              key={miembro.id}
              className="p-3 sm:p-6"
            >
              <div className="flex flex-col justify-between gap-2.5 sm:gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-12 sm:w-12 sm:rounded-2xl">
                    {miembro.rol ===
                    "administrador" ? (
                      <Crown className="h-4 w-4 sm:h-6 sm:w-6" />
                    ) : miembro.rol ===
                      "supervisor" ? (
                      <ShieldCheck className="h-4 w-4 sm:h-6 sm:w-6" />
                    ) : (
                      <UserRound className="h-4 w-4 sm:h-6 sm:w-6" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex shrink-0 flex-wrap items-center gap-1 sm:gap-2">
                      <h2 className="truncate font-semibold text-slate-950 dark:text-white">
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

                    <p className="mt-0.5 truncate text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm">
                      {miembro.email}
                    </p>

                    <div className="mt-1 sm:mt-2">
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
                    className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[10px] text-slate-700 outline-none transition focus:border-blue-500 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 sm:h-10 sm:rounded-xl sm:px-3 sm:text-sm"
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
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:h-10 sm:w-10 sm:rounded-xl"
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

      <Card className="mt-3 border-blue-200 bg-blue-50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5 sm:mt-6 sm:p-5">
        <div className="flex gap-2 sm:gap-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />

          <div>
            <p className="text-[10px] font-medium text-slate-950 dark:text-white sm:text-base">
              Invitaciones reales activadas
            </p>

            <p className="mt-0.5 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:text-sm sm:leading-6">
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
    <Card className="p-2.5 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] text-slate-500 dark:text-zinc-500 sm:text-sm">
          {titulo}
        </p>

        <div className="text-emerald-700 dark:text-emerald-400">
          {icono}
        </div>
      </div>

      <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:mt-3 sm:text-3xl">
        {valor}
      </p>
    </Card>
  );
}