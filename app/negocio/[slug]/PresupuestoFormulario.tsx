"use client";

import {
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";
import {
  FormEvent,
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
}: Props) {
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
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />

        <h3 className="mt-4 text-xl font-bold text-white">
          Solicitud enviada
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-300">
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
          className="mt-5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 sm:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-white">
          <FileText className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-400">
            Presupuesto
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white">
            Pedí una cotización
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Dejanos tus datos y
            contanos qué necesitás.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
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
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            placeholder="Tu nombre"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
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
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            placeholder="+54..."
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium text-zinc-300">
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
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            placeholder="tu@email.com"
          />
        </label>

        {items.length > 0 && (
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-zinc-300">
              Producto o servicio
            </span>

            <select
              value={itemId}
              onChange={(event) =>
                setItemId(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-500"
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
          <span className="mb-2 block text-sm font-medium text-zinc-300">
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
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            placeholder="Ej: necesito 20 unidades, quiero consultar por un servicio personalizado, medidas, fechas, etc."
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
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