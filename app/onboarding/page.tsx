"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import Card from "@/components/Ui/Card";
import Button from "@/components/Ui/Button";

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");

  async function finalizar() {
    if (!auth.currentUser) return;

    const nombreLimpio = companyName.trim();
    if (!nombreLimpio) {
      alert("Ingresá el nombre de la empresa");
      return;
    }

    // Limpia y formatea la URL automáticamente (agrega https:// si no lo tiene)
    const sitioTrim = website.trim();
    const sitioFormateado = sitioTrim
      ? sitioTrim.startsWith("http://") || sitioTrim.startsWith("https://")
        ? sitioTrim
        : `https://${sitioTrim}`
      : "";

    setLoading(true);

    try {
      const snapshot = await addDoc(
        collection(db, "companies"),
        {
          userId: auth.currentUser.uid,
          nombre: nombreLimpio,
          rubro: industry.trim() || "Sin rubro",
          website: sitioFormateado,
          email: auth.currentUser.email || "",
          telefono: "",
          plan: "free",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      router.push(`/empresas/${snapshot.id}/dashboard`);
    } catch (error) {
      console.error(error);
      alert("No se pudo crear la empresa.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5">
      <Card className="w-full max-w-2xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Bienvenido a NDI AI
          </h1>
          <p className="mt-2 text-zinc-400">
            Configuremos tu empresa.
          </p>

          <div className="mt-6 h-2 rounded-full bg-zinc-800">
            <div
              className={`h-2 rounded-full bg-blue-600 transition-all ${
                step === 1
                  ? "w-1/3"
                  : step === 2
                  ? "w-2/3"
                  : "w-full"
              }`}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Nombre de la empresa
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
                placeholder="Ej: Mi negocio"
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
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Rubro
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              >
                <option value="">Seleccionar</option>
                <option value="Servicios">Servicios</option>
                <option value="Tienda">Tienda</option>
                <option value="Restaurante">Restaurante</option>
                <option value="Inmobiliaria">Inmobiliaria</option>
                <option value="Otro">Otro</option>
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
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Sitio web (opcional)
              </label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ej: miempresa.com o https://miempresa.com"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
              />
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5">
              <h2 className="text-lg font-semibold text-white">
                Resumen
              </h2>
              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <p>
                  <strong>Empresa:</strong> {companyName}
                </p>
                <p>
                  <strong>Rubro:</strong>{" "}
                  {industry || "Sin especificar"}
                </p>
                <p>
                  <strong>Sitio:</strong>{" "}
                  {website.trim() || "No informado"}
                </p>
                <p>
                  <strong>Plan:</strong> Free
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
                className="flex-1"
                disabled={loading}
                onClick={finalizar}
              >
                {loading ? "Creando empresa..." : "Finalizar"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}