"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function crearCuenta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombreLimpio || !apellidoLimpio) {
      setError("Completá tu nombre y apellido.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!aceptaTerminos) {
      setError("Tenés que aceptar los términos para crear la cuenta.");
      return;
    }

    setLoading(true);

    try {
      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailLimpio,
        password
      );

      const nombreCompleto = `${nombreLimpio} ${apellidoLimpio}`.trim();

      await updateProfile(credencial.user, {
        displayName: nombreCompleto,
      });

      await setDoc(
        doc(db, "users", credencial.user.uid),
        {
          uid: credencial.user.uid,
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          nombreCompleto,
          email: emailLimpio,
          plan: "gratis",
          onboardingCompletado: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      window.location.href = "/onboarding";
    } catch (firebaseError) {
      console.error("Error creando la cuenta:", firebaseError);

      const codigo =
        typeof firebaseError === "object" &&
        firebaseError !== null &&
        "code" in firebaseError
          ? String(firebaseError.code)
          : "";

      if (codigo.includes("email-already-in-use")) {
        setError("Ese correo ya está registrado. Probá iniciar sesión.");
      } else if (codigo.includes("invalid-email")) {
        setError("El correo electrónico no es válido.");
      } else if (codigo.includes("weak-password")) {
        setError("La contraseña es demasiado débil.");
      } else {
        setError("No se pudo crear la cuenta. Intentá nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <a href="/" className="text-3xl font-bold text-white">
            NDI AI
          </a>

          <h1 className="mt-5 text-2xl font-semibold text-white">
            Creá tu cuenta gratis
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Configurá tu empresa y tu asistente inteligente.
          </p>
        </div>

        <form onSubmit={crearCuenta} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-slate-300">
                Nombre
              </label>
              <input
                id="nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                autoComplete="given-name"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                placeholder="Ingresá tu nombre"
              />
            </div>

            <div>
              <label htmlFor="apellido" className="mb-2 block text-sm font-medium text-slate-300">
                Apellido
              </label>
              <input
                id="apellido"
                value={apellido}
                onChange={(event) => setApellido(event.target.value)}
                autoComplete="family-name"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                placeholder="Ingresá tu apellido"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              placeholder="correo@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmarPassword" className="mb-2 block text-sm font-medium text-slate-300">
              Confirmar contraseña
            </label>
            <input
              id="confirmarPassword"
              type="password"
              value={confirmarPassword}
              onChange={(event) => setConfirmarPassword(event.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              placeholder="Repetí tu contraseña"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(event) => setAceptaTerminos(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-600"
            />
            <span className="text-sm leading-6 text-slate-400">
              Acepto los términos de uso y la política de privacidad de NDI AI.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
          </button>

          <div className="border-t border-slate-800 pt-5 text-center">
            <p className="text-sm text-slate-400">¿Ya tenés una cuenta?</p>
            <a
              href="/login"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 font-semibold text-white transition hover:border-blue-500 hover:bg-blue-500/10"
            >
              Iniciar sesión
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}