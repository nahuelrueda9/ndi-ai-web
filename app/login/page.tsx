"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/empresas");
    } catch (err: unknown) {
      console.error("Error al iniciar sesión:", err);
      const codigo = typeof err === "object" && err !== null && "code" in err 
        ? String((err as { code?: unknown }).code) 
        : "";

      if (codigo === "auth/invalid-credential" || codigo === "auth/wrong-password" || codigo === "auth/user-not-found") {
        setError("El correo o la contraseña son incorrectos.");
      } else if (codigo === "auth/too-many-requests") {
        setError("Demasiados intentos fallidos. Intentá de nuevo en unos minutos.");
      } else {
        setError("Ocurrió un error al ingresar. Verificá tus datos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#080b11] text-zinc-100 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-sm rounded-3xl border border-zinc-800/80 bg-[#0f1420]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* LOGO LIMPIO */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center mb-4">
            <Image
              src="/logo-ndi.png"
              alt="Logo NDI"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 justify-center">
            <span>NDI</span>
            <span className="font-normal text-zinc-400">|</span>
            <span className="font-semibold text-zinc-300">Diseño & Web</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Ingresá a tu panel de control
          </p>
        </div>

        {/* ALERTA DE ERROR */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 text-center">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
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
              placeholder="correo@tunegocio.com"
              className="w-full rounded-xl border border-zinc-800 bg-[#141b2b] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Contraseña
              </label>
              <Link
                href="/recuperar-password"
                className="text-[11px] text-blue-400 hover:text-blue-300 transition"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                className="w-full rounded-xl border border-zinc-800 bg-[#141b2b] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition active:scale-95 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ingresando...</span>
              </>
            ) : (
              <span>Iniciar sesión</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-400 mb-2">¿Todavía no tenés una cuenta?</p>
          <Link
            href="/registro"
            className="inline-block w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
          >
            Crear mi cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}