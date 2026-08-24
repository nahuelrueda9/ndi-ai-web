"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  LogOut,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Avatar from "@/components/Ui/Avatar";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingBase, setLoadingBase] = useState(true);

  // Estados para actualizar perfil
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");

  // Estados para eliminar cuenta
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [confirmacionEliminacion, setConfirmacionEliminacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      setUser(currentUser);
      setNombre(currentUser.displayName || "");
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
      await updateProfile(user, {
        displayName: nombre.trim(),
      });
      setMensajeExito("Perfil actualizado correctamente.");
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setMensajeExito(""), 3000);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setErrorPerfil("No se pudo actualizar el perfil. Intentá de nuevo.");
    } finally {
      setGuardando(false);
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
      // Elimina el usuario de Firebase Auth
      await deleteUser(user);
      
      // Si se eliminó correctamente, lo mandamos al login
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Error al eliminar la cuenta:", error);
      
      // Firebase requiere que el usuario haya iniciado sesión recientemente para eliminar la cuenta
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
          
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Mi Perfil
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Administrá tu información personal y la configuración de tu cuenta.
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* TARJETA DE INFORMACIÓN PERSONAL */}
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
                  <Avatar
                    name={user?.displayName || user?.email || "Usuario"}
                    src={user?.photoURL || undefined}
                    size="lg"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-950 dark:text-white">
                      Foto de perfil
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500">
                      Se obtiene automáticamente de tu cuenta de Google.
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
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                    
                    <Input
                      id="email"
                      label="Correo electrónico"
                      value={user?.email || ""}
                      disabled
                      className="cursor-not-allowed opacity-70"
                    />
                  </div>

                  {mensajeExito && (
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {mensajeExito}
                    </p>
                  )}

                  {errorPerfil && (
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {errorPerfil}
                    </p>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={guardando || nombre.trim() === user?.displayName}>
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
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Una vez que elimines tu cuenta, no hay vuelta atrás. Se borrará tu acceso y perderás el control de las empresas que hayas creado.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setMostrarModalEliminar(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-500/10"
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
                  <h2 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">
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
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Esta acción es <strong className="text-red-600 dark:text-red-400">permanente e irreversible</strong>. Perderás el acceso a NDI AI inmediatamente.
              </p>

              <label className="mt-5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
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
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="ELIMINAR"
              />

              {errorEliminacion && (
                <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                  {errorEliminacion}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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