"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserPlus, Loader2, CheckCircle2, Copy, Users, Mail, Trash2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  empresaId: string;
};

type MiembroEmpresa = {
  id: string;
  email?: string;
  nombre?: string;
  rol?: string;
  estado?: string;
};

type InvitacionDoc = {
  id: string;
  email?: string;
  rol?: string;
  estado?: string;
  invitationUrl?: string;
};

export default function ModalInvitarColaborador({ empresaId }: Props) {
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"administrador" | "supervisor" | "operador">("administrador");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [miembros, setMiembros] = useState<MiembroEmpresa[]>([]);
  const [invitaciones, setInvitaciones] = useState<InvitacionDoc[]>([]);

  useEffect(() => {
    if (!empresaId) return;

    const cancelarMiembros = onSnapshot(
      collection(db, "companies", empresaId, "members"),
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<MiembroEmpresa, "id">),
        }));
        setMiembros(lista);
      },
      (err) => {
        console.error("Error leyendo colaboradores:", err);
      }
    );

    const cancelarInvitaciones = onSnapshot(
      collection(db, "companies", empresaId, "invitations"),
      (snapshot) => {
        const lista = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<InvitacionDoc, "id">),
        }));
        setInvitaciones(lista);
      },
      (err) => {
        console.error("Error leyendo invitaciones:", err);
      }
    );

    return () => {
      cancelarMiembros();
      cancelarInvitaciones();
    };
  }, [empresaId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    setInvitationUrl("");
    setCopiadoId(null);

    const correoLimpio = email.trim().toLowerCase();

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("Tenés que iniciar sesión.");
        setCargando(false);
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch("/api/invitaciones/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          empresaId,
          email: correoLimpio,
          rol,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo generar la invitación.");
      } else {
        setInvitationUrl(data.invitationUrl);
        setEmail("");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al generar la invitación.");
    } finally {
      setCargando(false);
    }
  }

  async function borrarInvitacion(invitacionId: string) {
    if (!empresaId || !invitacionId) return;
    setError("");
    setBorrandoId(invitacionId);

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("Tenés que iniciar sesión.");
        setBorrandoId(null);
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch("/api/invitaciones/eliminar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          empresaId,
          invitacionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo eliminar la invitación.");
      }
    } catch (err) {
      console.error("Error al borrar invitación:", err);
      setError("Error de conexión al eliminar la invitación.");
    } finally {
      setBorrandoId(null);
    }
  }

  function copiarAlPortapapeles(texto: string, clave: string) {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiadoId(clave);
    setTimeout(() => setCopiadoId(null), 2000);
  }

  const invitacionesPendientes = invitaciones.filter(
    (inv) => (inv.estado || "pendiente") === "pendiente"
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-[#ED192D]" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Invitar colaborador
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Correo electrónico del usuario
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colaborador@ejemplo.com"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Rol asignado
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as "administrador" | "supervisor" | "operador")}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-950 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          >
            <option value="administrador">Administrador</option>
            <option value="supervisor">Supervisor</option>
            <option value="operador">Operador</option>
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-xl bg-[#ED192D] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar enlace de invitación"}
        </button>
      </form>

      {invitationUrl && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Invitación creada correctamente
          </div>
          <p className="text-[11px] text-slate-600 dark:text-zinc-400">
            Enviale este enlace al usuario para que se sume a la empresa:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={invitationUrl}
              className="w-full text-[11px] p-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 font-mono"
            />
            <button
              type="button"
              onClick={() => copiarAlPortapapeles(invitationUrl, "ultimo")}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiadoId === "ultimo" ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {/* INVITACIONES PENDIENTES Y COLABORADORES */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-zinc-800 space-y-4">
        {invitacionesPendientes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Invitaciones pendientes
              </h4>
            </div>

            <div className="space-y-2">
              {invitacionesPendientes.map((inv) => {
                const estaBorrando = borrandoId === inv.id;

                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs dark:border-amber-500/20 dark:bg-amber-500/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {inv.email || inv.id}
                      </p>
                      <p className="text-[11px] capitalize text-amber-700 dark:text-amber-300">
                        Rol: {inv.rol || "colaborador"} · Pendiente
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {inv.invitationUrl && (
                        <button
                          type="button"
                          onClick={() => copiarAlPortapapeles(inv.invitationUrl!, inv.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-500 transition"
                        >
                          <Copy className="h-3 w-3" />
                          {copiadoId === inv.id ? "Copiado" : "Copiar link"}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={estaBorrando}
                        onClick={() => borrarInvitacion(inv.id)}
                        title="Eliminar invitación"
                        aria-label="Eliminar invitación"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950/40 transition"
                      >
                        {estaBorrando ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Borrar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Colaboradores del equipo
            </h4>
          </div>

          {miembros.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              Todavía no hay colaboradores sumados al equipo.
            </p>
          ) : (
            <div className="space-y-2">
              {miembros.map((miembro) => (
                <div
                  key={miembro.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {miembro.nombre || miembro.email || miembro.id}
                    </p>
                    {miembro.email && miembro.nombre && (
                      <p className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                        {miembro.email}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium capitalize text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {miembro.rol || "colaborador"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}