"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { CreditCard, Lock, MessageSquare, Save, Sparkles, Wallet } from "lucide-react";

import { db } from "@/lib/firebase";
import { empresaTieneFuncion, type PlanId } from "@/lib/plans/planAccess";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";
import Badge from "@/components/Ui/Badge";

type MetodosPagoConfig = {
  activoMercadoPago: boolean;
  linkMercadoPago: string;
  activoTransferencia: boolean;
  aliasCbu: string;
  titularCuenta: string;
  soloWhatsapp: boolean;
};

type EmpresaData = {
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
  pagosConfig?: Partial<MetodosPagoConfig>;
};

export default function PagosConfigPage() {
  const params = useParams();
  const router = useRouter();
  const parametroEmpresa = params.id ?? params.empresaId;
  const empresaId = Array.isArray(parametroEmpresa) ? parametroEmpresa[0] : (parametroEmpresa as string | undefined);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [puedeCobrarOnline, setPuedeCobrarOnline] = useState(false);

  const [config, setConfig] = useState<MetodosPagoConfig>({
    activoMercadoPago: false,
    linkMercadoPago: "",
    activoTransferencia: false,
    aliasCbu: "",
    titularCuenta: "",
    soloWhatsapp: true,
  });

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      setCargando(false);
      return;
    }

    async function cargarConfiguracion() {
      try {
        const docRef = doc(db, "companies", empresaId as string);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as EmpresaData;
          const tieneAccesoCobros = empresaTieneFuncion(data, "cobros_online");
          setPuedeCobrarOnline(tieneAccesoCobros);

          if (data.pagosConfig) {
            setConfig({
              activoMercadoPago: tieneAccesoCobros ? (data.pagosConfig.activoMercadoPago ?? false) : false,
              linkMercadoPago: data.pagosConfig.linkMercadoPago ?? "",
              activoTransferencia: tieneAccesoCobros ? (data.pagosConfig.activoTransferencia ?? false) : false,
              aliasCbu: data.pagosConfig.aliasCbu ?? "",
              titularCuenta: data.pagosConfig.titularCuenta ?? "",
              soloWhatsapp: tieneAccesoCobros ? (data.pagosConfig.soloWhatsapp ?? true) : true,
            });
          }
        }
      } catch (err) {
        console.error("Error al cargar configuración de pagos:", err);
        setError("No se pudo cargar la configuración.");
      } finally {
        setCargando(false);
      }
    }

    void cargarConfiguracion();
  }, [empresaId]);

  async function guardarConfiguracion() {
    if (!empresaId || guardando) return;
    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const docRef = doc(db, "companies", empresaId as string);
      
      const configAGuardar = puedeCobrarOnline
        ? config
        : {
            ...config,
            soloWhatsapp: true,
            activoMercadoPago: false,
            activoTransferencia: false,
          };

      await updateDoc(docRef, {
        pagosConfig: configAGuardar,
        updatedAt: serverTimestamp(),
      });
      setMensaje("Métodos de pago guardados correctamente.");
    } catch (err) {
      console.error("Error al guardar pagos:", err);
      setError("No se pudieron guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="mx-auto w-full max-w-4xl px-3 py-12 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
        <p className="mt-4 text-sm text-slate-500">Cargando métodos de pago...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            Configuración comercial
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Métodos de Pago y Cobro
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
            Elegí cómo querés que tus clientes te paguen o si preferís coordinar todo directamente por WhatsApp.
          </p>
        </div>

        <Button type="button" disabled={guardando} onClick={guardarConfiguracion}>
          <Save className="mr-2 h-4 w-4" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </header>

      {mensaje && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{mensaje}</p>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="space-y-6">
        {/* OPCIÓN 1: SOLO WHATSAPP */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    Coordinar exclusivamente por WhatsApp
                  </h2>
                  <Badge variant="success">Habilitado</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Los clientes reservan o piden y se les abre el chat con el detalle para coordinar el pago directo con vos.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.soloWhatsapp}
              disabled={!puedeCobrarOnline}
              onChange={(e) => setConfig({ ...config, soloWhatsapp: e.target.checked })}
              className="h-5 w-5 accent-blue-600 disabled:cursor-not-allowed"
            />
          </div>
        </Card>

        {/* OPCIÓN 2: MERCADO PAGO / TARJETAS */}
        <Card className={`p-5 sm:p-6 relative ${!puedeCobrarOnline ? "opacity-75" : ""}`}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    Mercado Pago / Tarjetas online
                  </h2>
                  {!puedeCobrarOnline && (
                    <Badge variant="info">
                      <Lock className="mr-1 h-3 w-3 inline" />
                      Plan Pro
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Permití que tus clientes abonen al instante con su cuenta de Mercado Pago o tarjetas de crédito/débito.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!puedeCobrarOnline}
              checked={config.activoMercadoPago}
              onChange={(e) => setConfig({ ...config, activoMercadoPago: e.target.checked })}
              className="h-5 w-5 accent-blue-600 disabled:cursor-not-allowed"
            />
          </div>

          {!puedeCobrarOnline ? (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl bg-blue-50/70 p-3.5 dark:bg-blue-500/5 sm:flex-row sm:items-center">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Cobrá tus reservas o pedidos automáticamente con Mercado Pago activando <strong>Página Completa</strong>.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/empresas/${empresaId}/planes`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Mejorar plan
              </Button>
            </div>
          ) : (
            config.activoMercadoPago && (
              <div className="mt-4 pt-2">
                <Input
                  id="linkMp"
                  label="Link de pago o Botón de Mercado Pago"
                  type="text"
                  value={config.linkMercadoPago}
                  onChange={(e) => setConfig({ ...config, linkMercadoPago: e.target.value })}
                  placeholder="Ej: https://link.mercadopago.com.ar/tuempresa"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-500">
                  Podés crear un link de pago estándar desde tu aplicación de Mercado Pago y pegarlo acá.
                </p>
              </div>
            )
          )}
        </Card>

        {/* OPCIÓN 3: TRANSFERENCIA BANCARIA */}
        <Card className={`p-5 sm:p-6 relative ${!puedeCobrarOnline ? "opacity-75" : ""}`}>
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                    Transferencia bancaria / CBU / Alias
                  </h2>
                  {!puedeCobrarOnline && (
                    <Badge variant="info">
                      <Lock className="mr-1 h-3 w-3 inline" />
                      Plan Pro
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Mostrá los datos de tu cuenta bancaria directamente en la web para recibir transferencias.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!puedeCobrarOnline}
              checked={config.activoTransferencia}
              onChange={(e) => setConfig({ ...config, activoTransferencia: e.target.checked })}
              className="h-5 w-5 accent-blue-600 disabled:cursor-not-allowed"
            />
          </div>

          {!puedeCobrarOnline ? (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl bg-blue-50/70 p-3.5 dark:bg-blue-500/5 sm:flex-row sm:items-center">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Mostrá tus datos bancarios en el checkout contratando el <strong>Plan Pro o Business IA</strong>.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(`/empresas/${empresaId}/planes`)}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Mejorar plan
              </Button>
            </div>
          ) : (
            config.activoTransferencia && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="aliasCbu"
                  label="Alias o CBU"
                  type="text"
                  value={config.aliasCbu}
                  onChange={(e) => setConfig({ ...config, aliasCbu: e.target.value })}
                  placeholder="Ej: mi.negocio.mp"
                />
                <Input
                  id="titular"
                  label="Titular de la cuenta"
                  type="text"
                  value={config.titularCuenta}
                  onChange={(e) => setConfig({ ...config, titularCuenta: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
            )
          )}
        </Card>
      </div>
    </section>
  );
}