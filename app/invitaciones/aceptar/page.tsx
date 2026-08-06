"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

type RolEquipo =
  | "administrador"
  | "supervisor"
  | "operador";

type InvitacionInfo = {
  empresaId: string;
  empresaNombre: string;
  email: string;
  rol: RolEquipo;
  estado: "pendiente";
};

type RespuestaApi = Partial<InvitacionInfo> & {
  ok?: boolean;
  error?: string;
};

const ROLES: Record<
  RolEquipo,
  {
    nombre: string;
    descripcion: string;
  }
> = {
  administrador: {
    nombre: "Administrador",
    descripcion:
      "Acceso completo a configuración, equipo, integraciones y conversaciones.",
  },
  supervisor: {
    nombre: "Supervisor",
    descripcion:
      "Puede gestionar conversaciones, operadores, automatizaciones y reportes.",
  },
  operador: {
    nombre: "Operador",
    descripcion:
      "Puede atender conversaciones, gestionar contactos y usar la agenda.",
  },
};

function obtenerInvitacionUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    new URLSearchParams(
      window.location.search
    ).get("invitation") ?? ""
  ).trim();
}

function construirRutaActual(
  invitation: string
) {
  return `/invitaciones/aceptar?invitation=${encodeURIComponent(
    invitation
  )}`;
}

function construirRutaLogin({
  invitation,
  email,
}: {
  invitation: string;
  email?: string;
}) {
  const parametros =
    new URLSearchParams();

  parametros.set(
    "invitation",
    invitation
  );

  parametros.set(
    "next",
    construirRutaActual(invitation)
  );

  if (email) {
    parametros.set("email", email);
  }

  return `/login?${parametros.toString()}`;
}

function construirRutaRegistro({
  invitation,
  email,
}: {
  invitation: string;
  email?: string;
}) {
  const parametros =
    new URLSearchParams();

  parametros.set(
    "invitation",
    invitation
  );

  parametros.set(
    "next",
    construirRutaActual(invitation)
  );

  if (email) {
    parametros.set("email", email);
  }

  return `/register?${parametros.toString()}`;
}

export default function AceptarInvitacionPage() {
  const [invitation, setInvitation] =
    useState("");

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [authCargando, setAuthCargando] =
    useState(true);

  const [invitacion, setInvitacion] =
    useState<InvitacionInfo | null>(
      null
    );

  const [cargando, setCargando] =
    useState(true);

  const [aceptando, setAceptando] =
    useState(false);

  const [cerrandoSesion, setCerrandoSesion] =
    useState(false);

  const [error, setError] =
    useState("");

  const [aceptada, setAceptada] =
    useState(false);

  useEffect(() => {
    const token =
      obtenerInvitacionUrl();

    setInvitation(token);

    const cancelar =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUsuario(currentUser);
          setAuthCargando(false);
        }
      );

    return () => cancelar();
  }, []);

  useEffect(() => {
    if (!invitation) {
      setCargando(false);
      setError(
        "Falta el código de invitación."
      );
      return;
    }

    let activo = true;

    async function cargarInvitacion() {
      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(
          `/api/invitaciones/aceptar?invitation=${encodeURIComponent(
            invitation
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const datos =
          (await respuesta.json()) as RespuestaApi;

        if (!respuesta.ok) {
          throw new Error(
            datos.error ||
              "No se pudo cargar la invitación."
          );
        }

        if (
          !datos.empresaId ||
          !datos.empresaNombre ||
          !datos.email ||
          !datos.rol
        ) {
          throw new Error(
            "La invitación está incompleta."
          );
        }

        if (!activo) {
          return;
        }

        setInvitacion({
          empresaId: datos.empresaId,
          empresaNombre:
            datos.empresaNombre,
          email: datos.email,
          rol: datos.rol,
          estado: "pendiente",
        });
      } catch (requestError) {
        console.error(
          "Error al cargar invitación:",
          requestError
        );

        if (activo) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo cargar la invitación."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarInvitacion();

    return () => {
      activo = false;
    };
  }, [invitation]);

  const emailUsuario = useMemo(
    () =>
      usuario?.email
        ?.trim()
        .toLowerCase() ?? "",
    [usuario]
  );

  const emailInvitado = useMemo(
    () =>
      invitacion?.email
        .trim()
        .toLowerCase() ?? "",
    [invitacion]
  );

  const correoCoincide =
    Boolean(emailUsuario) &&
    Boolean(emailInvitado) &&
    emailUsuario === emailInvitado;

  async function aceptarInvitacion() {
    if (
      !usuario ||
      !invitation ||
      !invitacion ||
      aceptando
    ) {
      return;
    }

    if (!correoCoincide) {
      setError(
        "La sesión actual usa un correo distinto al de la invitación."
      );
      return;
    }

    setAceptando(true);
    setError("");

    try {
      const idToken =
        await usuario.getIdToken(true);

      const respuesta = await fetch(
        "/api/invitaciones/aceptar",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            invitation,
          }),
        }
      );

      const datos =
        (await respuesta.json()) as RespuestaApi;

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo aceptar la invitación."
        );
      }

      setAceptada(true);

      window.setTimeout(() => {
        window.location.href = `/empresas/${invitacion.empresaId}/conversaciones`;
      }, 1400);
    } catch (requestError) {
      console.error(
        "Error al aceptar invitación:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo aceptar la invitación."
      );
    } finally {
      setAceptando(false);
    }
  }

  async function cambiarCuenta() {
    if (cerrandoSesion) {
      return;
    }

    setCerrandoSesion(true);

    try {
      await signOut(auth);

      window.location.href =
        construirRutaLogin({
          invitation,
          email:
            invitacion?.email,
        });
    } catch {
      setError(
        "No se pudo cerrar la sesión."
      );
      setCerrandoSesion(false);
    }
  }

  if (cargando || authCargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="mt-5 font-medium">
            Cargando invitación...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Estamos verificando el acceso.
          </p>
        </div>
      </main>
    );
  }

  if (aceptada && invitacion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl">
            ✓
          </div>

          <h1 className="mt-6 text-2xl font-bold">
            Invitación aceptada
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ya formás parte de{" "}
            <strong className="text-white">
              {invitacion.empresaNombre}
            </strong>
            . Estamos abriendo el panel.
          </p>
        </div>
      </main>
    );
  }

  if (error && !invitacion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Invitación no disponible
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <a
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </main>
    );
  }

  if (!invitacion) {
    return null;
  }

  const rol =
    ROLES[invitacion.rol];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <a
            href="/"
            className="text-3xl font-bold"
          >
            NDI AI
          </a>

          <p className="mt-2 text-sm text-slate-500">
            Invitación al equipo
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 bg-gradient-to-br from-blue-600/20 to-transparent p-7 sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl">
              🏢
            </div>

            <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
              Te invitaron a{" "}
              {invitacion.empresaNombre}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Aceptá la invitación para
              comenzar a trabajar dentro de
              esta empresa.
            </p>
          </div>

          <div className="space-y-5 p-7 sm:p-9">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Tu rol
              </p>

              <p className="mt-2 text-xl font-semibold text-blue-400">
                {rol.nombre}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {rol.descripcion}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Correo invitado
              </p>

              <p className="mt-2 break-all font-medium text-white">
                {invitacion.email}
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-400">
                {error}
              </p>
            )}

            {!usuario ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-slate-400">
                  Iniciá sesión o creá una
                  cuenta con el correo
                  invitado para continuar.
                </p>

                <a
                  href={construirRutaLogin({
                    invitation,
                    email:
                      invitacion.email,
                  })}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
                >
                  Iniciar sesión
                </a>

                <a
                  href={construirRutaRegistro({
                    invitation,
                    email:
                      invitacion.email,
                  })}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10"
                >
                  Crear cuenta
                </a>
              </div>
            ) : correoCoincide ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <p className="text-sm text-emerald-300">
                    Sesión iniciada como{" "}
                    <strong>
                      {usuario.email}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    aceptarInvitacion
                  }
                  disabled={aceptando}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aceptando
                    ? "Aceptando..."
                    : "Aceptar invitación"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm leading-6 text-amber-300">
                    Iniciaste sesión como{" "}
                    <strong>
                      {usuario.email}
                    </strong>
                    , pero la invitación
                    pertenece a{" "}
                    <strong>
                      {invitacion.email}
                    </strong>
                    .
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cambiarCuenta}
                  disabled={
                    cerrandoSesion
                  }
                  className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cerrandoSesion
                    ? "Cerrando sesión..."
                    : "Usar otra cuenta"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}