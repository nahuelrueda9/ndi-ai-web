"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Sparkles, Wrench, MessageCircle, Check } from "lucide-react";

import Card from "@/components/Ui/Card";
import Button from "@/components/Ui/Button";

const WHATSAPP_NUMERO = "5493886575664";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [modalidad, setModalidad] = useState<"autogestion" | "asistida">("autogestion");

  async function finalizar() {
    if (!auth.currentUser) return;

    const nombreLimpio = companyName.trim();
    if (!nombreLimpio) {
      alert("Ingresá el nombre de la empresa");
      return;
    }

    const sitioTrim = website.trim();
    const sitioFormateado = sitioTrim
      ? sitioTrim.startsWith("http://") || sitioTrim.startsWith("https://")
        ? sitioTrim
        : `https://${sitioTrim}`
      : "";

    setLoading(true);

    try {
      // Configuramos 30 días de prueba gratis automáticamente
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

      const snapshot = await addDoc(collection(db, "companies"), {
        userId: auth.currentUser.uid,
        nombre: nombreLimpio,
        rubro: industry.trim() || "Sin rubro",
        website: sitioFormateado,
        email: auth.currentUser.email || "",
        telefono: "",
        plan: "free",
        subscriptionStatus: "active",
        subscriptionEndsAt: Timestamp.fromDate(fechaVencimiento),
        subscriptionMonthlyPrice: 5999,
        setupMode: modalidad,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (modalidad === "asistida") {
        const rubroTexto = industry.trim() || "General";
        const mensaje = `¡Hola! Acabo de registrar mi negocio *${nombreLimpio}* (Rubro: ${rubroTexto}) en NDI AI y quiero que me ayuden a armar mi página web.`;
        const urlWhatsApp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
        
        window.open(urlWhatsApp, "_blank");
      }

      router.push(`/empresas/${snapshot.id}/dashboard`);
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la empresa. Por favor, intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-8">
      <Card className="w-full max-w-2xl p-6 sm:p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Bienvenido a NDI AI
            </h1>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
              Paso {step} de 3
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Configuremos los datos iniciales de tu negocio.
          </p>

          <div className="mt-6 h-2 rounded-full bg-zinc-800">
            <div
              className={`h-2 rounded-full bg-blue-600 transition-all duration-300 ${
                step === 1
                  ? "w-1/3"
                  : step === 2
                  ? "w-2/3"
                  : "w-full"
              }`}
            />
          </div>
        </div>

        {/* PASO 1: NOMBRE */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Nombre de tu negocio o marca
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 transition focus:border-blue-500 focus:outline-none"
                placeholder="Ej: Barbería Vintage, Restaurante Plaza, Dr. Gómez..."
                autoFocus
              />
            </div>

            <Button
              onClick={() => {
                if (!companyName.trim()) {
                  alert("Ingresá el nombre de la empresa");
                  return;
                }
                setStep(2);
              }}
              className="w-full py-3"
            >
              Continuar
            </Button>
          </div>
        )}

        {/* PASO 2: RUBRO */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Rubro o actividad principal
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white transition focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccioná un rubro</option>
                <option value="Servicios">Servicios (Barbería, Estética, Consultorio)</option>
                <option value="Tienda">Tienda / Comercio / Indumentaria</option>
                <option value="Restaurante">Gastronomía / Restaurante / Cafetería</option>
                <option value="Alojamiento">Alojamiento / Hotel / Cabañas</option>
                <option value="Profesional">Profesional independiente</option>
                <option value="Otro">Otro rubro</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
              >
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 py-3"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3: MODALIDAD DE ARMADO + RESUMEN */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Sitio web actual (opcional)
              </label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ej: miempresa.com o https://instagram.com/miempresa"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 transition focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* SELECTOR DE MODALIDAD */}
            <div>
              <label className="mb-3 block text-sm font-medium text-zinc-300">
                ¿Cómo preferís poner en marcha tu página?
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setModalidad("autogestion")}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                    modalidad === "autogestion"
                      ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                        <Wrench className="h-5 w-5" />
                      </div>
                      {modalidad === "autogestion" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 font-semibold text-white">
                      Configurar por mi cuenta
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      Entrás directamente a tu panel y cargás tus fotos, servicios y precios vos mismo.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalidad("asistida")}
                  className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                    modalidad === "asistida"
                      ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      {modalidad === "asistida" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 font-semibold text-white">
                      Quiero que la armen por mí
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      Nos enviás tus fotos y lista por WhatsApp y nuestro equipo te la deja lista.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* RESUMEN */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-sm font-semibold text-white">
                  Resumen de tu cuenta
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  30 Días Gratis
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <p>
                  <span className="text-zinc-500">Empresa:</span>{" "}
                  <strong>{companyName}</strong>
                </p>
                <p>
                  <span className="text-zinc-500">Rubro:</span>{" "}
                  <strong>{industry || "Sin especificar"}</strong>
                </p>
                <p>
                  <span className="text-zinc-500">Puesta en marcha:</span>{" "}
                  <strong>{modalidad === "asistida" ? "Asistida por WhatsApp" : "Autogestionada"}</strong>
                </p>
                <p>
                  <span className="text-zinc-500">Prueba inicial:</span>{" "}
                  <strong className="text-emerald-400">Sin costo</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
              >
                Atrás
              </Button>
              <Button
                className={`flex-1 py-3 font-semibold ${
                  modalidad === "asistida"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : ""
                }`}
                disabled={loading}
                onClick={finalizar}
              >
                {loading ? (
                  "Creando empresa..."
                ) : modalidad === "asistida" ? (
                  <span className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Finalizar y contactar por WhatsApp
                  </span>
                ) : (
                  "Finalizar e ir al panel"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}