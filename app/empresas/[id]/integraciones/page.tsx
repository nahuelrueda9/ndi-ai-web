"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { auth, db } from "@/lib/firebase";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

type EmpresaData = {
  userId?: string;
};

type MiembroData = {
  rol?: Exclude<
    RolEmpresa,
    "propietario"
  >;
  estado?: "activo" | "inactivo";
};

type Integracion = {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  estado:
    | "disponible"
    | "proximamente";
  ruta?: string;
  detallePlan?: string;
};

const integraciones: Integracion[] = [
  {
    id: "whatsapp",
    nombre: "WhatsApp",
    descripcion:
      "Conectá WhatsApp Business para que NDI AI reciba consultas y responda automáticamente por tu negocio.",
    icono: "💬",
    estado: "proximamente",
    ruta: "whatsapp",
    detallePlan: "Próximamente",
  },
  {
    id: "instagram",
    nombre: "Instagram",
    descripcion:
      "Conectá una cuenta profesional de Instagram para recibir mensajes directos y gestionarlos desde NDI AI.",
    icono: "📸",
    estado: "proximamente",
    ruta: "instagram",
    detallePlan: "Próximamente",
  },
  {
    id: "messenger",
    nombre: "Facebook Messenger",
    descripcion:
      "Conectá una Página de Facebook para recibir mensajes de Messenger y gestionarlos desde NDI AI.",
    icono: "📨",
    estado: "proximamente",
    ruta: "messenger",
    detallePlan: "Próximamente",
  },
];

export default function IntegracionesPage() {
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

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró el ID de la empresa."
            );
            setCargando(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          const usuarioSeguro =
            currentUser;

          setAccesoVerificado(false);
          setError("");
          setCargando(true);

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe."
              );
              setCargando(false);
              return;
            }

            const empresa =
              empresaSnapshot.data() as EmpresaData;

            if (
              empresa.userId ===
              usuarioSeguro.uid
            ) {
              setAccesoVerificado(true);
              setCargando(false);
              return;
            }

            const miembroReferencia =
              doc(
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

            if (
              !miembroSnapshot.exists()
            ) {
              router.replace(
                "/empresas"
              );
              return;
            }

            const miembro =
              miembroSnapshot.data() as MiembroData;

            const tieneAcceso =
              miembro.estado ===
                "activo" &&
              (
                miembro.rol ===
                  "administrador" ||
                miembro.rol ===
                  "supervisor"
              );

            if (!tieneAcceso) {
              router.replace(
                `/empresas/${empresaIdSeguro}/conversaciones`
              );
              return;
            }

            setAccesoVerificado(true);
            setCargando(false);
          } catch (firebaseError) {
            console.error(
              "Error al verificar acceso a integraciones:",
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

  function abrirIntegracion(
    integracion: Integracion
  ) {
    if (
      !empresaId ||
      !accesoVerificado ||
      integracion.estado !==
        "disponible" ||
      !integracion.ruta
    ) {
      return;
    }

    router.push(
      `/empresas/${empresaId}/integraciones/${integracion.ruta}`
    );
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="p-6 text-center sm:p-10">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 sm:h-8 sm:w-8" />

          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 sm:mt-4 sm:text-sm">
            Verificando acceso a
            integraciones...
          </p>
        </Card>
      </section>
    );
  }

  if (error || !accesoVerificado) {
    return (
      <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10 sm:p-6">
          <p className="text-xs text-red-700 dark:text-red-400 sm:text-sm">
            {error ||
              "No tenés permisos para acceder a esta sección."}
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 sm:mt-5"
            onClick={() =>
              router.push("/empresas")
            }
          >
            Volver a empresas
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-4 sm:mb-8">
        <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
          Canales
        </p>

        <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-2 sm:text-3xl">
          Integraciones
        </h1>

        <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:max-w-2xl sm:text-sm sm:leading-6">
          Conectá los canales que usa tu negocio para centralizar
          conversaciones y atención desde NDI AI.
        </p>
      </header>

      <div className="grid gap-2.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {integraciones.map(
          (integracion) => (
            <Card
              key={integracion.id}
              className="flex min-h-0 flex-col p-3 sm:min-h-64 sm:p-6"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-zinc-800 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-2xl">
                  {integracion.icono}
                </div>

                <Badge
                  variant={
                    integracion.estado ===
                    "disponible"
                      ? "success"
                      : "default"
                  }
                >
                  {integracion.estado ===
                  "disponible"
                    ? "Disponible"
                    : "Próximamente"}
                </Badge>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-5 sm:gap-2">
                <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-xl">
                  {integracion.nombre}
                </h2>

                {integracion.detallePlan && (
                  <span
                    className={
                      integracion.estado === "disponible"
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 sm:px-2.5 sm:py-1 sm:text-[11px]"
                        : "rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 sm:px-2.5 sm:py-1 sm:text-[11px]"
                    }
                  >
                    {integracion.detallePlan}
                  </span>
                )}
              </div>

              <p className="mt-1.5 flex-1 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                {
                  integracion.descripcion
                }
              </p>

              <Button
                type="button"
                className="mt-3 w-full sm:mt-6"
                variant={
                  integracion.estado ===
                  "disponible"
                    ? "primary"
                    : "secondary"
                }
                disabled={
                  integracion.estado !==
                  "disponible"
                }
                onClick={() =>
                  abrirIntegracion(
                    integracion
                  )
                }
              >
                {integracion.estado ===
                "disponible"
                  ? "Configurar"
                  : "Próximamente"}
              </Button>
            </Card>
          )
        )}
      </div>
    </section>
  );
}