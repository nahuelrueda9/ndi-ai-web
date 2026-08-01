"use client";

import { useEffect, useState } from "react";

export type CustomerMemory = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  ultimaActualizacion?: string;
};

type Props = {
  memoria?: CustomerMemory;
  guardando?: boolean;
  onGuardar?: (memoria: CustomerMemory) => Promise<void> | void;
};

const memoriaVacia: CustomerMemory = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  ciudad: "",
};

function CampoLectura({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {etiqueta}
      </p>

      <p className="mt-1 break-words text-sm text-zinc-200">
        {valor?.trim() || "Sin información"}
      </p>
    </div>
  );
}

function CampoEdicion({
  etiqueta,
  valor,
  tipo = "text",
  onChange,
}: {
  etiqueta: string;
  valor: string;
  tipo?: "text" | "email" | "tel";
  onChange: (valor: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {etiqueta}
      </span>

      <input
        type={tipo}
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
        placeholder={`Ingresar ${etiqueta.toLowerCase()}`}
      />
    </label>
  );
}

function formatearFecha(fecha?: string) {
  if (!fecha) {
    return "Sin información";
  }

  const fechaConvertida = new Date(fecha);

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(fechaConvertida);
}

export default function CustomerProfilePanel({
  memoria,
  guardando = false,
  onGuardar,
}: Props) {
  const [editando, setEditando] = useState(false);

  const [formulario, setFormulario] =
    useState<CustomerMemory>(memoriaVacia);

  useEffect(() => {
    if (editando) {
      return;
    }

    setFormulario({
      nombre: memoria?.nombre || "",
      empresa: memoria?.empresa || "",
      email: memoria?.email || "",
      telefono: memoria?.telefono || "",
      ciudad: memoria?.ciudad || "",
      ultimaActualizacion: memoria?.ultimaActualizacion,
    });
  }, [memoria, editando]);

  function actualizarCampo(
    campo: keyof CustomerMemory,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function cancelarEdicion() {
    setFormulario({
      nombre: memoria?.nombre || "",
      empresa: memoria?.empresa || "",
      email: memoria?.email || "",
      telefono: memoria?.telefono || "",
      ciudad: memoria?.ciudad || "",
      ultimaActualizacion: memoria?.ultimaActualizacion,
    });

    setEditando(false);
  }

  async function guardarCambios() {
    if (!onGuardar || guardando) {
      return;
    }

    const memoriaLimpia: CustomerMemory = {
      nombre: formulario.nombre?.trim() || "",
      empresa: formulario.empresa?.trim() || "",
      email: formulario.email?.trim() || "",
      telefono: formulario.telefono?.trim() || "",
      ciudad: formulario.ciudad?.trim() || "",
    };

    await onGuardar(memoriaLimpia);
    setEditando(false);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Información del cliente
          </h3>

          <p className="mt-0.5 text-xs text-zinc-500">
            Datos detectados durante la conversación
          </p>
        </div>

        {onGuardar && !editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
          >
            Editar
          </button>
        )}
      </div>

      <div className="p-4">
        {editando ? (
          <div className="space-y-4">
            <CampoEdicion
              etiqueta="Nombre"
              valor={formulario.nombre || ""}
              onChange={(valor) =>
                actualizarCampo("nombre", valor)
              }
            />

            <CampoEdicion
              etiqueta="Empresa"
              valor={formulario.empresa || ""}
              onChange={(valor) =>
                actualizarCampo("empresa", valor)
              }
            />

            <CampoEdicion
              etiqueta="Ciudad"
              valor={formulario.ciudad || ""}
              onChange={(valor) =>
                actualizarCampo("ciudad", valor)
              }
            />

            <CampoEdicion
              etiqueta="Email"
              tipo="email"
              valor={formulario.email || ""}
              onChange={(valor) =>
                actualizarCampo("email", valor)
              }
            />

            <CampoEdicion
              etiqueta="Teléfono"
              tipo="tel"
              valor={formulario.telefono || ""}
              onChange={(valor) =>
                actualizarCampo("telefono", valor)
              }
            />

            <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarCambios}
                disabled={guardando}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoLectura
              etiqueta="Nombre"
              valor={memoria?.nombre}
            />

            <CampoLectura
              etiqueta="Empresa"
              valor={memoria?.empresa}
            />

            <CampoLectura
              etiqueta="Ciudad"
              valor={memoria?.ciudad}
            />

            <CampoLectura
              etiqueta="Email"
              valor={memoria?.email}
            />

            <CampoLectura
              etiqueta="Teléfono"
              valor={memoria?.telefono}
            />

            <CampoLectura
              etiqueta="Última actualización"
              valor={formatearFecha(
                memoria?.ultimaActualizacion
              )}
            />
          </div>
        )}
      </div>
    </section>
  );
}