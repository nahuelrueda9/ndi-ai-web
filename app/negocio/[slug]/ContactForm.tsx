"use client";

import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  UserRound,
} from "lucide-react";

type ContactoFormProps = {
  slug: string;
  nombreNegocio: string;
  tema?: "oscuro" | "claro";
};

type EstadoFormulario =
  | "idle"
  | "enviando"
  | "exito"
  | "error";

const VISITOR_KEY =
  "ndi-ai-public-page-visitor-id";

function obtenerVisitanteId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existente =
    window.localStorage.getItem(
      VISITOR_KEY,
    );

  if (existente) {
    return existente;
  }

  const nuevo =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitante-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  window.localStorage.setItem(
    VISITOR_KEY,
    nuevo,
  );

  return nuevo;
}

async function registrarLeadSubmit(
  slug: string,
) {
  const visitanteId =
    obtenerVisitanteId();

  if (!visitanteId) {
    return;
  }

  try {
    await fetch(
      "/api/public/analytics",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          slug,
          tipo: "lead_submit",
          visitanteId,
        }),
        keepalive: true,
      },
    );
  } catch (error) {
    console.error(
      "No se pudo registrar lead_submit:",
      error,
    );
  }
}

export default function ContactoForm({
  slug,
  nombreNegocio,
  tema = "oscuro",
}: ContactoFormProps) {
  const esClaro = tema === "claro";

  const [nombre, setNombre] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [telefono, setTelefono] =
    useState("");
  const [mensaje, setMensaje] =
    useState("");
  const [website, setWebsite] =
    useState("");

  const [estado, setEstado] =
    useState<EstadoFormulario>(
      "idle",
    );

  const [error, setError] =
    useState("");

  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (estado === "enviando") {
      return;
    }

    setError("");
    setEstado("enviando");

    try {
      const response = await fetch(
        "/api/public/leads",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            slug,
            nombre,
            email,
            telefono,
            mensaje,
            website,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo enviar la consulta.",
        );
      }

      await registrarLeadSubmit(
        slug,
      );

      setEstado("exito");
      setNombre("");
      setEmail("");
      setTelefono("");
      setMensaje("");
      setWebsite("");
    } catch (errorFormulario) {
      setEstado("error");
      setError(
        errorFormulario instanceof Error
          ? errorFormulario.message
          : "No se pudo enviar la consulta.",
      );
    }
  }

  if (estado === "exito") {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-8 ${
          esClaro
            ? "border-emerald-200 bg-emerald-50"
            : "border-emerald-500/20 bg-emerald-500/[0.06]"
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            esClaro
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h3
          className={`mt-5 text-xl font-semibold ${
            esClaro
              ? "text-slate-950"
              : "text-white"
          }`}
        >
          Consulta enviada
        </h3>

        <p
          className={`mt-2 max-w-xl text-sm leading-6 ${
            esClaro
              ? "text-slate-600"
              : "text-zinc-400"
          }`}
        >
          {nombreNegocio} recibió tus
          datos y tu mensaje. Podrán
          contactarte usando el teléfono
          o email que dejaste.
        </p>

        <button
          type="button"
          onClick={() =>
            setEstado("idle")
          }
          className={`mt-5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            esClaro
              ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          }`}
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  const inputClass = [
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
    esClaro
      ? "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-500 focus:bg-white"
      : "border-white/10 bg-black/30 text-white placeholder:text-zinc-600 focus:border-white/20 focus:bg-black/40",
  ].join(" ");

  return (
    <form
      onSubmit={enviarFormulario}
      className={`rounded-3xl border p-6 sm:p-8 ${
        esClaro
          ? "border-slate-200 bg-white shadow-sm"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="mb-7">
        <p
          className={`text-sm font-medium ${
            esClaro
              ? "text-slate-500"
              : "text-zinc-500"
          }`}
        >
          Contacto
        </p>

        <h3
          className={`mt-1 text-2xl font-bold ${
            esClaro
              ? "text-slate-950"
              : "text-white"
          }`}
        >
          Enviá tu consulta
        </h3>

        <p
          className={`mt-2 text-sm leading-6 ${
            esClaro
              ? "text-slate-600"
              : "text-zinc-400"
          }`}
        >
          Dejanos tus datos y un mensaje.
          {nombreNegocio} podrá responderte
          usando el teléfono o email que
          ingreses.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor="website">
          Website
        </label>

        <input
          id="website"
          name="website"
          value={website}
          onChange={(event) =>
            setWebsite(
              event.target.value,
            )
          }
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            icono={
              <UserRound className="h-4 w-4" />
            }
            label="Nombre"
            required
            claro={esClaro}
          >
            <input
              value={nombre}
              onChange={(event) =>
                setNombre(
                  event.target.value,
                )
              }
              maxLength={100}
              required
              placeholder="Tu nombre"
              className={inputClass}
            />
          </Campo>

          <Campo
            icono={
              <Phone className="h-4 w-4" />
            }
            label="Teléfono"
            claro={esClaro}
          >
            <input
              value={telefono}
              onChange={(event) =>
                setTelefono(
                  event.target.value,
                )
              }
              maxLength={50}
              inputMode="tel"
              placeholder="+54 9..."
              className={inputClass}
            />
          </Campo>
        </div>

        <Campo
          icono={
            <Mail className="h-4 w-4" />
          }
          label="Email"
          detalle="Necesitamos teléfono o email"
          claro={esClaro}
        >
          <input
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            maxLength={180}
            type="email"
            placeholder="tu@email.com"
            className={inputClass}
          />
        </Campo>

        <Campo
          icono={
            <MessageSquareText className="h-4 w-4" />
          }
          label="Mensaje"
          required
          claro={esClaro}
        >
          <textarea
            value={mensaje}
            onChange={(event) =>
              setMensaje(
                event.target.value,
              )
            }
            maxLength={2000}
            required
            rows={5}
            placeholder={`¿Qué querés consultar a ${nombreNegocio}?`}
            className={`${inputClass} resize-none`}
          />
        </Campo>

        {estado === "error" &&
          error && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                esClaro
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-red-500/20 bg-red-500/[0.06] text-red-300"
              }`}
            >
              {error}
            </div>
          )}

        <button
          type="submit"
          disabled={
            estado === "enviando"
          }
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
            esClaro
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {estado ===
          "enviando" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar consulta
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
  claro = false,
  children,
}: {
  icono: ReactNode;
  label: string;
  detalle?: string;
  required?: boolean;
  claro?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div
        className={`mb-2 flex items-center gap-2 text-sm font-medium ${
          claro
            ? "text-slate-700"
            : "text-zinc-300"
        }`}
      >
        <span
          className={
            claro
              ? "text-slate-400"
              : "text-zinc-500"
          }
        >
          {icono}
        </span>

        <span>
          {label}
          {required ? " *" : ""}
        </span>

        {detalle && (
          <span
            className={`ml-auto text-xs font-normal ${
              claro
                ? "text-slate-400"
                : "text-zinc-600"
            }`}
          >
            {detalle}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}