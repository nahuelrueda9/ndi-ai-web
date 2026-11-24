"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Ajustá según tu instancia cliente de Firebase
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setExito(false);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setExito(true);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo enviar el correo. Verificá que la dirección sea correcta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0c0d0e] flex items-center justify-center p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
        </Link>

        <div>
          <h1 className="text-xl font-bold text-white">Recuperar contraseña</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu clave.
          </p>
        </div>

        {exito ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">¡Correo enviado!</p>
              <p className="mt-1">Revisá tu bandeja de entrada (y la carpeta de spam) para crear una nueva contraseña.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-white outline-none focus:border-blue-600 transition"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando || !email}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {enviando ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}