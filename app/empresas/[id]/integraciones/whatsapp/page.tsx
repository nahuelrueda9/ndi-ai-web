"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type EstadoConexion = "sin_configurar" | "configurado" | "probando" | "conectado";

export default function WhatsAppPage() {
  const params = useParams();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const [estado, setEstado] = useState<EstadoConexion>("sin_configurar");
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) return;

    async function cargarConfiguracion() {
      try {
        const response = await fetch(
          `/api/integraciones/whatsapp/config?empresaId=${empresaId}`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!data?.config) {
          return;
        }

        setPhoneNumberId(data.config.phoneNumberId ?? "");
        setBusinessAccountId(data.config.businessAccountId ?? "");
        setVerifyToken(data.config.verifyToken ?? "");
        setEstado(data.config.estado === "conectado" ? "conectado" : "configurado");
      } catch (requestError) {
        console.error("No se pudo cargar WhatsApp:", requestError);
      }
    }

    void cargarConfiguracion();
  }, [empresaId]);

  async function guardarConfiguracion() {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch("/api/integraciones/whatsapp/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId,
          phoneNumberId,
          businessAccountId,
          accessToken,
          verifyToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la configuración.");
      }

      setEstado("configurado");
      setMensaje("Configuración guardada correctamente.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar la configuración."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function probarConexion() {
    if (!empresaId) {
      setError("No se encontró la empresa.");
      return;
    }

    setProbando(true);
    setEstado("probando");
    setError("");
    setMensaje("");

    try {
      const response = await fetch("/api/integraciones/whatsapp/probar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresaId,
          phoneNumberId,
          accessToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo conectar con Meta.");
      }

      setEstado("conectado");
      setMensaje(
        data?.message || "Conexión con WhatsApp verificada correctamente."
      );
    } catch (requestError) {
      setEstado("configurado");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo probar la conexión."
      );
    } finally {
      setProbando(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-green-400">
            Integración oficial de Meta
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            WhatsApp Business
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Configurá tu número de WhatsApp Cloud API para recibir y responder
            mensajes desde NDI AI.
          </p>
        </div>

        <div className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
          {estado === "conectado" && (
            <span className="text-emerald-400">● Conectado</span>
          )}

          {estado === "probando" && (
            <span className="text-amber-400">● Probando conexión...</span>
          )}

          {estado === "configurado" && (
            <span className="text-blue-400">● Configurado</span>
          )}

          {estado === "sin_configurar" && (
            <span className="text-zinc-400">● Sin configurar</span>
          )}
        </div>
      </header>

      <Card className="space-y-5 p-6">
        <Input
          id="phone"
          label="Phone Number ID"
          value={phoneNumberId}
          onChange={(event) => setPhoneNumberId(event.target.value)}
          placeholder="Ejemplo: 123456789012345"
        />

        <Input
          id="business"
          label="Business Account ID"
          value={businessAccountId}
          onChange={(event) => setBusinessAccountId(event.target.value)}
          placeholder="Ejemplo: 987654321098765"
        />

        <Input
          id="token"
          label="Access Token"
          type="password"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          placeholder="Pegá el token generado por Meta"
        />

        <Input
          id="verify"
          label="Verify Token"
          value={verifyToken}
          onChange={(event) => setVerifyToken(event.target.value)}
          placeholder="Elegí una palabra segura"
        />

        {mensaje && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            onClick={guardarConfiguracion}
            disabled={guardando || probando}
          >
            {guardando ? "Guardando..." : "Guardar configuración"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={probarConexion}
            disabled={guardando || probando}
          >
            {probando ? "Probando..." : "Probar conexión"}
          </Button>
        </div>
      </Card>
    </section>
  );
}