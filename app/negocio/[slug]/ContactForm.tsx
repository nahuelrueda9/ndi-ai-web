"use client";

import {
  FormEvent,
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
      VISITOR_KEY
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
    nuevo
  );

  return nuevo;
}

async function registrarLeadSubmit(
  slug: string
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
      }
    );
  } catch (error) {
    console.error(
      "No se pudo registrar lead_submit:",
      error
    );
  }
}

export default function ContactoForm({
  slug,
  nombreNegocio,
}: ContactoFormProps) {
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
      "idle"
    );

  const [error, setError] =
    useState("");

  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>
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
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo enviar la consulta."
        );
      }

      await registrarLeadSubmit(
        slug
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
          : "No se pudo enviar la consulta."
      );
    }
  }

  if (estado === "exito") {
    return (
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h3 className="mt-5 text-xl font-semibold text-white">
          Consulta enviada
        </h3>

        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
          {nombreNegocio} recibió tus datos y tu mensaje.
          Podrán contactarte usando el teléfono o email que dejaste.
        </p>

        <button
          type="button"
          onClick={() =>
            setEstado("idle")
          }
          className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-5"
    >
      <div
        aria-hidden="true"
        className="hidden"
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
              event.target.value
            )
          }
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          icono={
            <UserRound className="h-4 w-4" />
          }
          label="Nombre"
          required
        >
          <input
            value={nombre}
            onChange={(event) =>
              setNombre(
                event.target.value
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
        >
          <input
            value={telefono}
            onChange={(event) =>
              setTelefono(
                event.target.value
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
      >
        <input
          value={email}
          onChange={(event) =>
            setEmail(
              event.target.value
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
      >
        <textarea
          value={mensaje}
          onChange={(event) =>
            setMensaje(
              event.target.value
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
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

      <button
        type="submit"
        disabled={
          estado === "enviando"
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
  icono: React.ReactNode;
  label: string;
  detalle?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-200">
        <span className="text-zinc-500">
          {icono}
        </span>

        <span>
          {label}
          {required ? " *" : ""}
        </span>

        {detalle && (
          <span className="ml-auto text-xs font-normal text-zinc-600">
            {detalle}
          </span>
        )}
      </div>

      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20 focus:bg-black/40";