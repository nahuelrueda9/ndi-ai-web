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
    estado: "disponible",
    ruta: "whatsapp",
    detallePlan: "Incluido en Free",
  },
  {
    id: "instagram",
    nombre: "Instagram",
    descripcion:
      "La integración con mensajes de Instagram está en preparación y se habilitará más adelante.",
    icono: "📸",
    estado: "proximamente",
    detallePlan: "Próximamente",
  },
  {
    id: "messenger",
    nombre: "Facebook Messenger",
    descripcion:
      "La integración con Facebook Messenger todavía no está disponible.",
    icono: "📨",
    estado: "proximamente",
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
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-zinc-400">
            Verificando acceso a
            integraciones...
          </p>
        </Card>
      </section>
    );
  }

  if (error || !accesoVerificado) {
    return (
      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <Card className="border-red-500/20 bg-red-500/10 p-6">
          <p className="text-sm text-red-400">
            {error ||
              "No tenés permisos para acceder a esta sección."}
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-5"
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
    <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-400">
          Canales
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Integraciones
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          Empezá conectando WhatsApp, el canal principal de NDI AI.
          Las demás integraciones se habilitarán cuando estén listas.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {integraciones.map(
          (integracion) => (
            <Card
              key={integracion.id}
              className="flex min-h-64 flex-col p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
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

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-white">
                  {integracion.nombre}
                </h2>

                {integracion.detallePlan && (
                  <span
                    className={
                      integracion.estado === "disponible"
                        ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
                        : "rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-400"
                    }
                  >
                    {integracion.detallePlan}
                  </span>
                )}
              </div>

              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">
                {
                  integracion.descripcion
                }
              </p>

              <Button
                type="button"
                className="mt-6 w-full"
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