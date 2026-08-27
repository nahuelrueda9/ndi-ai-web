"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  deleteUser,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);

  // Estados para actualizar perfil
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");

  // Estados para seguridad y restablecimiento de contraseña
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [mensajeSeguridad, setMensajeSeguridad] = useState("");
  const [errorSeguridad, setErrorSeguridad] = useState("");

  // Estados para eliminar cuenta
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [confirmacionEliminacion, setConfirmacionEliminacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState("");

  const esCuentaGoogle = user?.providerData.some(
    (provider) => provider.providerId === "google.com"
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      setUser(currentUser);
      setNombre(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      const savedPhone = localStorage.getItem(`phone_${currentUser.uid}`) || "";
      setTelefono(savedPhone);
      setLoadingBase(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleActualizarPerfil(e: FormEvent) {
    e.preventDefault();
    if (!user || guardando) return;

    setGuardando(true);
    setErrorPerfil("");
    setMensajeExito("");

    try {
      // 1. Actualizar Nombre si cambió
      if (nombre.trim() !== (user.displayName || "")) {
        await updateProfile(user, {
          displayName: nombre.trim(),
        });
      }

      // 2. Actualizar Teléfono en almacenamiento local
      if (telefono.trim()) {
        localStorage.setItem(`phone_${user.uid}`, telefono.trim());
      }

      // 3. Actualizar Correo Electrónico si cambió y no es de Google
      if (!esCuentaGoogle && email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
        await updateEmail(user, email.trim().toLowerCase());
      }

      setMensajeExito("Perfil guardado correctamente.");
      setTimeout(() => setMensajeExito(""), 3500);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      if (error.code === "auth/requires-recent-login") {
        setErrorPerfil(
          "Por seguridad, para cambiar el correo electrónico debés cerrar sesión y volver a ingresar antes de guardarlo."
        );
      } else if (error.code === "auth/email-already-in-use") {
        setErrorPerfil("Ese correo electrónico ya está en uso por otra cuenta.");
      } else if (error.code === "auth/invalid-email") {
        setErrorPerfil("El formato del correo electrónico ingresado no es válido.");
      } else {
        setErrorPerfil("No se pudo actualizar el perfil. Por favor, intentá de nuevo.");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleEnviarResetPassword() {
    if (!user?.email || enviandoReset) return;

    setEnviandoReset(true);
    setErrorSeguridad("");
    setMensajeSeguridad("");

    try {
      await sendPasswordResetEmail(auth, user.email);
      setMensajeSeguridad(
        `Enviamos un enlace seguro para actualizar tu contraseña a ${user.email}. Revisá tu bandeja de entrada o carpeta de spam.`
      );
    } catch (error: any) {
      console.error("Error al enviar email de contraseña:", error);
      setErrorSeguridad(
        "No se pudo enviar el correo de restablecimiento. Intentá más tarde."
      );
    } finally {
      setEnviandoReset(false);
    }
  }

  async function handleEliminarCuenta() {
    if (!user || eliminando) return;

    if (confirmacionEliminacion.trim().toLowerCase() !== "eliminar") {
      setErrorEliminacion("Tenés que escribir ELIMINAR para confirmar.");
      return;
    }

    setEliminando(true);
    setErrorEliminacion("");

    try {
      await deleteUser(user);
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Error al eliminar la cuenta:", error);

      if (error.code === "auth/requires-recent-login") {
        setErrorEliminacion(
          "Por seguridad, necesitás volver a iniciar sesión antes de eliminar tu cuenta."
        );
      } else {
        setErrorEliminacion(
          "No se pudo eliminar la cuenta. Por favor, contactá a soporte."
        );
      }
    } finally {
      setEliminando(false);
    }
  }

  if (loadingBase) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[800px] px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          
          {/* BOTÓN VOLVER ATRÁS */}
          <div className="mb-4">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al panel principal
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Mi Perfil
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Administrá tu información personal y la seguridad de tu cuenta.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* INFORMACIÓN PERSONAL */}
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    Información Personal
                  </h2>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* LOGO OFICIAL NDI AI */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-md shadow-blue-500/5">
                    <Image
                      src="/logo-ndi.png"
                      alt="Logo NDI AI"
                      width={36}
                      height={36}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Identificador de cuenta NDI AI
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Cuenta activa de administrador en la plataforma.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleActualizarPerfil} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="nombre"
                      label="Nombre completo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Nahuel Rueda"
                      required
                    />

                    <Input
                      id="telefono"
                      label="Teléfono / WhatsApp"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: +54 9 388 657-5664"
                    />

                    <div className="sm:col-span-2">
                      <Input
                        id="email"
                        type="email"
                        label="Correo electrónico de acceso"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={esCuentaGoogle}
                        className={esCuentaGoogle ? "cursor-not-allowed opacity-70" : ""}
                        placeholder="tu-correo@gmail.com"
                        required
                      />
                      <p className="mt-1.5 text-[11px] text-slate-500 dark:text-zinc-500">
                        {esCuentaGoogle
                          ? "El correo está administrado por tu cuenta de Google."
                          : "Ingresá un correo real para recibir notificaciones y restablecer tu clave."}
                      </p>
                    </div>
                  </div>

                  {mensajeExito && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {mensajeExito}
                    </div>
                  )}

                  {errorPerfil && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorPerfil}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={guardando}>
                      {guardando ? (
                        "Guardando..."
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Guardar cambios
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>

            {/* SEGURIDAD & CONTRASEÑA */}
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    Seguridad & Contraseña
                  </h2>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {esCuentaGoogle ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-700 dark:text-blue-300">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Cuenta vinculada con Google</p>
                      <p className="mt-1 text-slate-600 dark:text-zinc-400 leading-relaxed">
                        Tu sesión se gestiona con los estándares de autenticación y doble factor de Google. La contraseña y seguridad se administran desde tu cuenta de Google.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                      Podés solicitar un enlace seguro a tu correo ({user?.email}) para actualizar tu clave de acceso en cualquier momento.
                    </p>

                    {mensajeSeguridad && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{mensajeSeguridad}</span>
                      </div>
                    )}

                    {errorSeguridad && (
                      <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                        {errorSeguridad}
                      </p>
                    )}

                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={enviandoReset}
                        onClick={handleEnviarResetPassword}
                        className="inline-flex items-center gap-2"
                      >
                        <KeyRound className="h-4 w-4" />
                        {enviandoReset
                          ? "Enviando correo..."
                          : "Cambiar o restablecer contraseña"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ZONA DE PELIGRO */}
            <Card className="overflow-hidden border-red-200 dark:border-red-900/30">
              <div className="border-b border-red-100 bg-red-50/50 px-5 py-4 dark:border-red-900/20 dark:bg-red-950/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                  <h2 className="text-base font-semibold text-red-600 dark:text-red-500">
                    Zona de Peligro
                  </h2>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Se borrará tu acceso y perderás el control de las empresas que hayas creado.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setMostrarModalEliminar(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-500/10 sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar mi cuenta
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL DE ELIMINAR CUENTA */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-zinc-800 sm:p-5">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="mt-1 text-base font-bold text-slate-950 dark:text-white sm:text-lg">
                    ¿Estás seguro?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                disabled={eliminando}
                onClick={() => {
                  setMostrarModalEliminar(false);
                  setConfirmacionEliminacion("");
                  setErrorEliminacion("");
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400 sm:text-sm">
                Esta acción es <strong className="text-red-600 dark:text-red-400">permanente e irreversible</strong>. Perderás el acceso a NDI AI inmediatamente.
              </p>

              <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm">
                Para confirmar, escribí <span className="font-bold text-slate-950 dark:text-white">ELIMINAR</span> abajo:
              </label>

              <input
                type="text"
                autoComplete="off"
                value={confirmacionEliminacion}
                disabled={eliminando}
                onChange={(e) => {
                  setConfirmacionEliminacion(e.target.value);
                  setErrorEliminacion("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-950 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white sm:py-3 sm:text-sm"
                placeholder="ELIMINAR"
              />

              {errorEliminacion && (
                <p className="mt-2.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {errorEliminacion}
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={eliminando}
                  onClick={() => {
                    setMostrarModalEliminar(false);
                    setConfirmacionEliminacion("");
                    setErrorEliminacion("");
                  }}
                >
                  Cancelar
                </Button>

                <button
                  type="button"
                  disabled={eliminando || confirmacionEliminacion.trim() !== "ELIMINAR"}
                  onClick={() => void handleEliminarCuenta()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  {eliminando ? "Eliminando..." : "Eliminar cuenta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}