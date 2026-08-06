"use client";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

function obtenerParametro(nombre: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(
    window.location.search
  ).get(nombre) ?? "";
}

function obtenerDestinoSeguro() {
  const destino = obtenerParametro("next");

  if (
    destino.startsWith("/") &&
    !destino.startsWith("//")
  ) {
    return destino;
  }

  return "/dashboard";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    enviandoRecuperacion,
    setEnviandoRecuperacion,
  ] = useState(false);

  const [desdeInvitacion, setDesdeInvitacion] =
    useState(false);

  useEffect(() => {
    const emailInvitado =
      obtenerParametro("email");

    const invitacion =
      obtenerParametro("invitation");

    if (emailInvitado) {
      setEmail(emailInvitado);
    }

    setDesdeInvitacion(
      Boolean(invitacion)
    );
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const correo = email
      .trim()
      .toLowerCase();

    setError("");
    setMensaje("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      window.location.href =
        obtenerDestinoSeguro();
    } catch {
      setError(
        "Correo o contraseña incorrectos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function recuperarContrasena() {
    const correo = email
      .trim()
      .toLowerCase();

    setError("");
    setMensaje("");

    if (!correo) {
      setError(
        "Escribí tu correo electrónico para recuperar la contraseña."
      );
      return;
    }

    setEnviandoRecuperacion(true);

    try {
      await sendPasswordResetEmail(
        auth,
        correo
      );

      setMensaje(
        "Te enviamos un correo para restablecer tu contraseña. Revisá también la carpeta de spam."
      );
    } catch {
      setError(
        "No se pudo enviar el correo de recuperación. Revisá que el email sea correcto."
      );
    } finally {
      setEnviandoRecuperacion(false);
    }
  }

  function obtenerEnlaceRegistro() {
    if (typeof window === "undefined") {
      return "/register";
    }

    const parametros =
      new URLSearchParams(
        window.location.search
      );

    const registro =
      new URLSearchParams();

    const emailInvitado =
      parametros.get("email");

    const invitacion =
      parametros.get("invitation");

    const destino =
      parametros.get("next");

    if (emailInvitado) {
      registro.set(
        "email",
        emailInvitado
      );
    }

    if (invitacion) {
      registro.set(
        "invitation",
        invitacion
      );
    }

    if (destino) {
      registro.set("next", destino);
    }

    const consulta =
      registro.toString();

    return consulta
      ? `/register?${consulta}`
      : "/register";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            NDI AI
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {desdeInvitacion
              ? "Ingresá para aceptar la invitación al equipo"
              : "Ingresá a tu plataforma inteligente"}
          </p>
        </div>

        {desdeInvitacion && (
          <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="text-sm leading-6 text-blue-300">
              Fuiste invitado a trabajar
              en una empresa. Iniciá sesión
              con el mismo correo que recibió
              la invitación.
            </p>
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="correo@empresa.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Contraseña
              </label>

              <button
                type="button"
                onClick={
                  recuperarContrasena
                }
                disabled={
                  enviandoRecuperacion
                }
                className="text-sm font-medium text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviandoRecuperacion
                  ? "Enviando..."
                  : "¿Olvidaste tu contraseña?"}
              </button>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Ingresá tu contraseña"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              enviandoRecuperacion
            }
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>

          <div className="border-t border-slate-800 pt-5 text-center">
            <p className="text-sm text-slate-400">
              ¿Todavía no tenés una cuenta?
            </p>

            <a
              href={obtenerEnlaceRegistro()}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10"
            >
              Crear cuenta gratis
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}