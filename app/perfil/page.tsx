"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  deleteUser,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);

  // Perfil
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");

  // Cambio directo de contraseña
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState("");
  const [errorPass, setErrorPass] = useState("");

  // Eliminar cuenta
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
      if (nombre.trim() !== (user.displayName || "")) {
        await updateProfile(user, { displayName: nombre.trim() });
      }

      if (telefono.trim()) {
        localStorage.setItem(`phone_${user.uid}`, telefono.trim());
      }

      if (!esCuentaGoogle && email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
        await verifyBeforeUpdateEmail(user, email.trim().toLowerCase());
        setMensajeExito(
          "Se envió un enlace de verificación al nuevo correo. Confirmalo para completar el cambio."
        );
      } else {
        setMensajeExito("Perfil actualizado correctamente.");
      }

      setTimeout(() => setMensajeExito(""), 5000);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      if (error.code === "auth/requires-recent-login") {
        setErrorPerfil("Por seguridad, cerrá sesión y volvé a entrar antes de modificar tu correo.");
      } else if (error.code === "auth/email-already-in-use") {
        setErrorPerfil("Ese correo ya está registrado en otra cuenta.");
      } else {
        setErrorPerfil(error.message || "Error al actualizar. Intentá de nuevo.");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function handleActualizarPassword(e: FormEvent) {
    e.preventDefault();
    if (!user || guardandoPass) return;
    if (nuevaPassword.length < 6) {
      setErrorPass("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardandoPass(true);
    setErrorPass("");
    setMensajePass("");

    try {
      await updatePassword(user, nuevaPassword);
      setMensajePass("Contraseña cambiada exitosamente.");
      setNuevaPassword("");
      setTimeout(() => setMensajePass(""), 4000);
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      if (error.code === "auth/requires-recent-login") {
        setErrorPass("Por seguridad, debés cerrar sesión y volver a ingresar para cambiar la contraseña.");
      } else {
        setErrorPass("No se pudo cambiar la contraseña. Intentá más tarde.");
      }
    } finally {
      setGuardandoPass(false);
    }
  }

  async function handleEliminarCuenta() {
    if (!user || eliminando) return;
    if (confirmacionEliminacion.trim().toLowerCase() !== "eliminar") {
      setErrorEliminacion("Escribí ELIMINAR para confirmar.");
      return;
    }

    setEliminando(true);
    setErrorEliminacion("");

    try {
      await deleteUser(user);
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Error al eliminar:", error);
      if (error.code === "auth/requires-recent-login") {
        setErrorEliminacion("Por seguridad, cerrá sesión y volvé a entrar antes de eliminar.");
      } else {
        setErrorEliminacion("No se pudo eliminar la cuenta.");
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
          
          <div className="mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </button>
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
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 p-2 shadow-md shadow-blue-600/20">
                    <Image
                      src="/logo-ndi.png"
                      alt="Logo NDI"
                      width={32}
                      height={32}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      Cuenta NDI AI
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Administrador de plataforma
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
                        label="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={esCuentaGoogle}
                        className={esCuentaGoogle ? "cursor-not-allowed opacity-70" : ""}
                        required
                      />
                    </div>
                  </div>

                  {mensajeExito && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {mensajeExito}
                    </div>
                  )}

                  {errorPerfil && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorPerfil}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={guardando}>
                      <Save className="h-4 w-4" />
                      {guardando ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>

            {/* CAMBIAR CONTRASEÑA */}
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
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-300">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Tu cuenta utiliza autenticación de Google. Tu contraseña se gestiona directamente desde Google.</p>
                  </div>
                ) : (
                  <form onSubmit={handleActualizarPassword} className="space-y-4">
                    <div className="max-w-md">
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Nueva contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="new-pass"
                          type={verPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)}
                          required
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setVerPassword(!verPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                          {verPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {mensajePass && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {mensajePass}
                      </div>
                    )}

                    {errorPass && (
                      <p className="text-xs text-red-400">{errorPass}</p>
                    )}

                    <Button type="submit" variant="secondary" disabled={guardandoPass || !nuevaPassword}>
                      <KeyRound className="h-4 w-4" />
                      {guardandoPass ? "Actualizando..." : "Actualizar contraseña"}
                    </Button>
                  </form>
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
                <p className="text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
                  Una vez eliminada la cuenta no hay vuelta atrás.
                </p>

                <div className="mt-4">
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

      {/* MODAL ELIMINAR */}
      {mostrarModalEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">¿Eliminar cuenta?</h3>
              <button onClick={() => setMostrarModalEliminar(false)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Escribí <b>ELIMINAR</b> para confirmar.</p>
            <input
              type="text"
              value={confirmacionEliminacion}
              onChange={(e) => setConfirmacionEliminacion(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white mb-3"
              placeholder="ELIMINAR"
            />
            {errorEliminacion && <p className="text-xs text-red-400 mb-3">{errorEliminacion}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setMostrarModalEliminar(false)}>Cancelar</Button>
              <button
                disabled={eliminando || confirmacionEliminacion !== "ELIMINAR"}
                onClick={handleEliminarCuenta}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}