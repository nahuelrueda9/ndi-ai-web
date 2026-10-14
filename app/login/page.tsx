"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [loading, setLoading] = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMensaje("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/dashboard");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  async function recuperarContrasena() {
    const correo = email.trim();

    setError("");
    setMensaje("");

    if (!correo) {
      setError("Escribí tu correo electrónico para recuperar la contraseña.");
      return;
    }

    setEnviandoRecuperacion(true);

    try {
      await sendPasswordResetEmail(auth, correo);
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 p-1.5 shadow-sm shadow-blue-600/30">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={20}
                height={20}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            NDI <span className="text-slate-400 font-normal">| Diseño & Web</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Ingresá a tu panel de control
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@tunegocio.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 text-sm"
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
                onClick={recuperarContrasena}
                disabled={enviandoRecuperacion}
                className="text-xs font-medium text-blue-400 transition hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviandoRecuperacion ? "Enviando..." : "¿Olvidaste tu contraseña?"}
              </button>
            </div>

            <div className="relative">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 text-sm"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword((actual) => !actual)}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                title={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-white"
              >
                {mostrarPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {error}
            </p>
          )}

          {mensaje && (
            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || enviandoRecuperacion}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-blue-600/30"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <div className="border-t border-slate-800 pt-5 text-center">
            <p className="text-xs text-slate-400">
              ¿Todavía no tenés una cuenta?
            </p>
            <Link
              href="/register"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10"
            >
              Crear mi cuenta
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}