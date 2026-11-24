"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, DollarSign, Link2, Loader2, Save } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type ConfigSenaEddu = {
  habilitada: boolean;
  monto: number;
  linkMercadoPago: string;
};

interface Props {
  companyId: string;
  valorInicial?: Partial<ConfigSenaEddu>;
  onGuardado?: (config: ConfigSenaEddu) => void;
}

export default function ConfiguracionSenaPanel({
  companyId,
  valorInicial,
  onGuardado,
}: Props) {
  const [habilitada, setHabilitada] = useState<boolean>(valorInicial?.habilitada ?? false);
  const [monto, setMonto] = useState<string>(
    valorInicial?.monto !== undefined && valorInicial.monto > 0 ? String(valorInicial.monto) : ""
  );
  const [linkMercadoPago, setLinkMercadoPago] = useState<string>(
    valorInicial?.linkMercadoPago ?? ""
  );
  const [cargando, setCargando] = useState<boolean>(!valorInicial);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (valorInicial) {
      setHabilitada(Boolean(valorInicial.habilitada));
      setMonto(valorInicial.monto ? String(valorInicial.monto) : "");
      setLinkMercadoPago(valorInicial.linkMercadoPago || "");
      setCargando(false);
      return;
    }

    if (!companyId) return;

    let activo = true;
    async function cargarConfiguracion() {
      setCargando(true);
      try {
        const ref = doc(db, "companies", companyId);
        const snap = await getDoc(ref);
        if (!activo) return;
        if (snap.exists()) {
          const data = snap.data() as { senaConfig?: Partial<ConfigSenaEddu> };
          setHabilitada(Boolean(data.senaConfig?.habilitada));
          setMonto(data.senaConfig?.monto ? String(data.senaConfig.monto) : "");
          setLinkMercadoPago(data.senaConfig?.linkMercadoPago || "");
        }
      } catch (err) {
        console.error("Error cargando configuración de seña:", err);
        if (activo) setError("No se pudo cargar la configuración de seña.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    void cargarConfiguracion();
    return () => {
      activo = false;
    };
  }, [companyId, valorInicial]);

  async function guardarConfiguracion() {
    if (!companyId || guardando) return;
    setError("");
    setMensaje("");

    const montoNumerico = Number(monto.replace(/[^\d.]/g, ""));
    if (habilitada && (!Number.isFinite(montoNumerico) || montoNumerico <= 0)) {
      setError("Ingresá un monto de seña mayor a $0 para activar el anticipo.");
      return;
    }

    const linkLimpio = linkMercadoPago.trim();
    const configLimpia: ConfigSenaEddu = {
      habilitada,
      monto: Number.isFinite(montoNumerico) && montoNumerico > 0 ? montoNumerico : 0,
      linkMercadoPago: linkLimpio,
    };

    setGuardando(true);
    try {
      const ref = doc(db, "companies", companyId);
      await setDoc(ref, { senaConfig: configLimpia }, { merge: true });
      setMensaje("Configuración de seña guardada correctamente.");
      onGuardado?.(configLimpia);
    } catch (err) {
      console.error("Error guardando configuración de seña:", err);
      setError("Ocurrió un error al guardar los cambios en Firestore.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando configuración de seña...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Seña / Anticipo por Mercado Pago
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Permite cobrar un anticipo al solicitar turno para reducir ausencias o pagar en el local.
            </p>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-3 select-none">
          <input
            type="checkbox"
            checked={habilitada}
            onChange={(e) => {
              setHabilitada(e.target.checked);
              setMensaje("");
              setError("");
            }}
            className="peer sr-only"
          />
          <div className="relative h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-slate-900 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
          <span className="text-xs font-semibold text-slate-700 sm:text-sm">
            {habilitada ? "Habilitada" : "Desactivada"}
          </span>
        </label>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 sm:text-sm">
            <DollarSign className="h-4 w-4 text-slate-400" />
            Monto de la seña (ARS)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={monto}
            onChange={(e) => {
              setMonto(e.target.value);
              setMensaje("");
              setError("");
            }}
            placeholder="Ej: 5000"
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Es el importe que verá el cliente al elegir &quot;Pagar anticipo por MP&quot;.
          </p>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 sm:text-sm">
            <Link2 className="h-4 w-4 text-slate-400" />
            Link de pago o link de Mercado Pago
          </label>
          <input
            type="url"
            value={linkMercadoPago}
            onChange={(e) => {
              setLinkMercadoPago(e.target.value);
              setMensaje("");
              setError("");
            }}
            placeholder="https://mpago.la/..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Al confirmar con anticipo, se abrirá este enlace en una nueva pestaña.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 sm:text-sm">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 sm:text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{mensaje}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => void guardarConfiguracion()}
          disabled={guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {guardando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar seña
            </>
          )}
        </button>
      </div>
    </div>
  );
}