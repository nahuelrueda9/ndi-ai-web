"use client";

import {
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import {
  type FormEvent,
  useState,
} from "react";

type ItemPresupuesto = {
  id: string;
  nombre: string;
  tipo: "servicio" | "producto";
};

type Props = {
  slug: string;
  items: ItemPresupuesto[];
  tema?: "oscuro" | "claro";
};

const VISITOR_KEY =
  "ndi-ai-public-page-visitor-id";

function obtenerVisitanteId() {
  try {
    let id =
      window.localStorage.getItem(
        VISITOR_KEY,
      );

    if (!id) {
      id =
        typeof crypto !== "undefined" &&
        "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;

      window.localStorage.setItem(
        VISITOR_KEY,
        id,
      );
    }

    return id;
  } catch {
    return "";
  }
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
      "No se pudo registrar la solicitud de presupuesto:",
      error,
    );
  }
}

export default function PresupuestoFormulario({
  slug,
  items,
  tema = "oscuro",
}: Props) {
  const esClaro = tema === "claro";

  const [nombre, setNombre] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [telefono, setTelefono] =
    useState("");
  const [itemId, setItemId] =
    useState("");
  const [detalle, setDetalle] =
    useState("");
  const [enviando, setEnviando] =
    useState(false);
  const [error, setError] =
    useState("");
  const [enviado, setEnviado] =
    useState(false);

  const itemSeleccionado =
    items.find(
      (item) =>
        item.id === itemId,
    );

  const campoClass = [
    "w-full rounded-xl border px-4 py-3 text-sm outline-none transition",
    esClaro
      ? "border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-500"
      : "border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600 focus:border-zinc-500",
  ].join(" ");

  const labelClass =
    esClaro
      ? "text-slate-700"
      : "text-zinc-300";

  async function enviar(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !nombre.trim() ||
      (!email.trim() &&
        !telefono.trim())
    ) {
      setError(
        "Ingresá tu nombre y al menos un teléfono o email.",
      );
      return;
    }

    if (!detalle.trim()) {
      setError(
        "Contanos brevemente qué necesitás.",
      );
      return;
    }

    setEnviando(true);
    setError("");

    const mensaje = [
      "SOLICITUD DE PRESUPUESTO",
      itemSeleccionado
        ? `Interés: ${itemSeleccionado.nombre} (${itemSeleccionado.tipo})`
        : "Interés: consulta general",
      `Detalle: ${detalle.trim()}`,
    ].join("\n");

    try {
      const response =
        await fetch(
          "/api/public/leads",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              slug,
              nombre:
                nombre.trim(),
              email:
                email.trim(),
              telefono:
                telefono.trim(),
              mensaje,
              tipo: "presupuesto",
              website: "",
            }),
          },
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo enviar la solicitud.",
        );
      }

      await registrarLeadSubmit(
        slug,
      );

      setEnviado(true);
      setNombre("");
      setEmail("");
      setTelefono("");
      setItemId("");
      setDetalle("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo enviar la solicitud.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div
        className={`rounded-3xl border p-6 sm:p-8 ${
          esClaro
            ? "border-emerald-200 bg-emerald-50"
            : "border-emerald-500/20 bg-emerald-500/10"
        }`}
      >
        <CheckCircle2
          className={`h-10 w-10 ${
            esClaro
              ? "text-emerald-700"
              : "text-emerald-400"
          }`}
        />

        <h3
          className={`mt-4 text-xl font-bold ${
            esClaro
              ? "text-slate-950"
              : "text-white"
          }`}
        >
          Solicitud enviada
        </h3>

        <p
          className={`mt-2 text-sm leading-6 ${
            esClaro
              ? "text-slate-600"
              : "text-zinc-300"
          }`}
        >
          El negocio recibió tu
          consulta y podrá
          contactarte para enviarte
          un presupuesto.
        </p>

        <button
          type="button"
          onClick={() =>
            setEnviado(false)
          }
          className={`mt-5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
            esClaro
              ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
              : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
          }`}
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className={`rounded-3xl border p-6 sm:p-8 ${
        esClaro
          ? "border-slate-200 bg-white shadow-sm"
          : "border-zinc-800 bg-zinc-900/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            esClaro
              ? "bg-slate-100 text-slate-900"
              : "bg-zinc-800 text-white"
          }`}
        >
          <FileText className="h-5 w-5" />
        </div>

        <div>
          <p
            className={`text-sm font-medium ${
              esClaro
                ? "text-slate-500"
                : "text-zinc-400"
            }`}
          >
            Presupuesto
          </p>

          <h2
            className={`mt-1 text-2xl font-bold ${
              esClaro
                ? "text-slate-950"
                : "text-white"
            }`}
          >
            Pedí una cotización
          </h2>

          <p
            className={`mt-1 text-sm leading-6 ${
              esClaro
                ? "text-slate-600"
                : "text-zinc-400"
            }`}
          >
            Dejanos tus datos y
            contanos qué necesitás.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
            Nombre *
          </span>

          <input
            value={nombre}
            onChange={(event) =>
              setNombre(
                event.target.value,
              )
            }
            maxLength={100}
            className={campoClass}
            placeholder="Tu nombre"
          />
        </label>

        <label className="block">
          <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
            Teléfono
          </span>

          <input
            value={telefono}
            onChange={(event) =>
              setTelefono(
                event.target.value,
              )
            }
            maxLength={40}
            className={campoClass}
            placeholder="+54..."
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
            Email
          </span>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            maxLength={160}
            className={campoClass}
            placeholder="tu@email.com"
          />
        </label>

        {items.length > 0 && (
          <label className="block sm:col-span-2">
            <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
              Producto o servicio
            </span>

            <select
              value={itemId}
              onChange={(event) =>
                setItemId(
                  event.target.value,
                )
              }
              className={campoClass}
            >
              <option value="">
                Consulta general
              </option>

              {items.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nombre}
                  </option>
                ),
              )}
            </select>
          </label>
        )}

        <label className="block sm:col-span-2">
          <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
            ¿Qué necesitás? *
          </span>

          <textarea
            value={detalle}
            onChange={(event) =>
              setDetalle(
                event.target.value,
              )
            }
            rows={5}
            maxLength={1500}
            className={`${campoClass} resize-none`}
            placeholder="Ej: necesito 20 unidades, quiero consultar por un servicio personalizado, medidas, fechas, etc."
          />
        </label>
      </div>

      {error && (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            esClaro
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          esClaro
            ? "bg-slate-950 text-white hover:bg-slate-800"
            : "bg-white text-zinc-950 hover:bg-zinc-200"
        }`}
      >
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Solicitar presupuesto
          </>
        )}
      </button>
    </form>
  );
}