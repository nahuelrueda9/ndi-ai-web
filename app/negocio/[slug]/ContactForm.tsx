"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { CheckCircle2, Loader2, Mail, MessageSquareText, Phone, Send, UserRound } from "lucide-react";

type ContactoFormProps = {
  slug: string;
  nombreNegocio: string;
  tema?: "oscuro" | "claro"; // Lo dejamos por compatibilidad de tipos, pero ya no dirige el diseño
};

type EstadoFormulario = "idle" | "enviando" | "exito" | "error";

const VISITOR_KEY = "ndi-ai-public-page-visitor-id";

function obtenerVisitanteId() {
  if (typeof window === "undefined") return "";
  const existente = window.localStorage.getItem(VISITOR_KEY);
  if (existente) return existente;
  const nuevo = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitante-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(VISITOR_KEY, nuevo);
  return nuevo;
}

async function registrarLeadSubmit(slug: string) {
  const visitanteId = obtenerVisitanteId();
  if (!visitanteId) return;
  try {
    await fetch("/api/public/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, tipo: "lead_submit", visitanteId }),
      keepalive: true,
    });
  } catch (error) {
    console.error("No se pudo registrar lead_submit:", error);
  }
}

export default function ContactoForm({ slug, nombreNegocio }: ContactoFormProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [website, setWebsite] = useState("");
  const [estado, setEstado] = useState<EstadoFormulario>("idle");
  const [error, setError] = useState("");

  async function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (estado === "enviando") return;

    setError("");
    setEstado("enviando");

    try {
      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, nombre, email, telefono, mensaje, website }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "No se pudo enviar la consulta.");

      await registrarLeadSubmit(slug);

      setEstado("exito");
      setNombre("");
      setEmail("");
      setTelefono("");
      setMensaje("");
      setWebsite("");
    } catch (errorFormulario) {
      setEstado("error");
      setError(errorFormulario instanceof Error ? errorFormulario.message : "No se pudo enviar la consulta.");
    }
  }

  if (estado === "exito") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-colors dark:border-emerald-500/20 dark:bg-emerald-500/[0.06] sm:rounded-3xl sm:p-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-12 sm:w-12 sm:rounded-2xl">
          <CheckCircle2 className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>

        <h3 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white sm:mt-5 sm:text-xl">
          Consulta enviada
        </h3>

        <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
          {nombreNegocio} recibió tus datos y tu mensaje. Podrán contactarte usando el teléfono o email que dejaste.
        </p>

        <button
          type="button"
          onClick={() => setEstado("idle")}
          className="mt-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] sm:mt-5 sm:px-4 sm:py-2.5 sm:text-sm"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-white/20 dark:focus:bg-black/40 sm:px-4 sm:py-3 sm:text-sm";

  return (
    <form onSubmit={enviarFormulario} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-8">
      <div className="mb-4 sm:mb-7">
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 sm:text-sm">
          Contacto
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
          Enviá tu consulta
        </h3>
        <p className="mt-1.5 text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
          Dejanos tus datos y un mensaje. {nombreNegocio} podrá responderte usando el teléfono o email que ingreses.
        </p>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-3 sm:space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Campo icono={<UserRound className="h-4 w-4" />} label="Nombre" required>
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={100}
              required
              placeholder="Tu nombre"
              className={inputClass}
            />
          </Campo>

          <Campo icono={<Phone className="h-4 w-4" />} label="Teléfono">
            <input
              value={telefono}
              onChange={(event) => setTelefono(event.target.value)}
              maxLength={50}
              inputMode="tel"
              placeholder="+54 9..."
              className={inputClass}
            />
          </Campo>
        </div>

        <Campo icono={<Mail className="h-4 w-4" />} label="Email" detalle="Necesitamos teléfono o email">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={180}
            type="email"
            placeholder="tu@email.com"
            className={inputClass}
          />
        </Campo>

        <Campo icono={<MessageSquareText className="h-4 w-4" />} label="Mensaje" required>
          <textarea
            value={mensaje}
            onChange={(event) => setMensaje(event.target.value)}
            maxLength={2000}
            required
            rows={5}
            placeholder={`¿Qué querés consultar a ${nombreNegocio}?`}
            className={`${inputClass} h-24 resize-none sm:h-auto`}
          />
        </Campo>

        {estado === "error" && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/[0.06] dark:text-red-300 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={estado === "enviando"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:w-auto sm:px-5 sm:py-3"
        >
          {estado === "enviando" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Enviar consulta
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Campo({
  icono,
  label,
  detalle,
  required = false,
  children,
}: {
  icono: ReactNode;
  label: string;
  detalle?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 sm:mb-2 sm:gap-2 sm:text-sm">
        <span className="text-slate-400 dark:text-zinc-500">{icono}</span>
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        {detalle && (
          <span className="ml-auto text-[10px] font-normal text-slate-400 dark:text-zinc-600 sm:text-xs">
            {detalle}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}