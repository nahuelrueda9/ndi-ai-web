"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type WhatsAppConfig = {
  enabled?: boolean;
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  verifyToken?: string;
};

export default function WhatsAppPage() {
  const params = useParams();
  const router = useRouter();

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [enabled, setEnabled] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!empresaId) {
      setError("No se encontró el ID de la empresa.");
      setLoading(false);
      return;
    }

    async function cargarConfiguracion() {
      try {
        const referencia = doc(
          db,
          "companies",
          empresaId,
          "integrations",
          "whatsapp"
        );

        const snapshot = await getDoc(referencia);

        if (snapshot.exists()) {
          const data = snapshot.data() as WhatsAppConfig;

          setEnabled(data.enabled ?? false);
          setPhoneNumberId(data.phoneNumberId ?? "");
          setBusinessAccountId(data.businessAccountId ?? "");
          setAccessToken(data.accessToken ?? "");
          setVerifyToken(data.verifyToken ?? "");
        }
      } catch (firebaseError) {
        console.error(
          "Error al cargar WhatsApp:",
          firebaseError
        );

        setError("No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    }

    cargarConfiguracion();
  }, [empresaId]);

  async function guardarConfiguracion() {
    if (!empresaId || guardando) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const referencia = doc(
        db,
        "companies",
        empresaId,
        "integrations",
        "whatsapp"
      );

      await setDoc(
        referencia,
        {
          enabled,
          phoneNumberId: phoneNumberId.trim(),
          businessAccountId: businessAccountId.trim(),
          accessToken: accessToken.trim(),
          verifyToken: verifyToken.trim(),
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      setMensaje("Configuración de WhatsApp guardada.");
    } catch (firebaseError) {
      console.error(
        "Error al guardar WhatsApp:",
        firebaseError
      );

      setError("No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  }

async function probarConexion() {
  setError("");
  setMensaje("");

  try {
    const respuesta = await fetch(
      "/api/integraciones/whatsapp/probar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumberId,
          accessToken,
        }),
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        data.error || "No se pudo probar la conexión."
      );
    }

    setMensaje(
      `Conectado correctamente: ${
        data.nombreVerificado ||
        data.numero ||
        "WhatsApp Business"
      }`
    );
  } catch (conexionError) {
    console.error(
      "Error al probar WhatsApp:",
      conexionError
    );

    setError(
      conexionError instanceof Error
        ? conexionError.message
        : "No se pudo probar la conexión."
    );
  }
}

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

          <p className="text-sm text-zinc-400">
            Cargando configuración...
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            WhatsApp Business
          </h1>

          <p className="mt-2 text-zinc-400">
            Configurá la API oficial de Meta.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() =>
            router.push(
              `/empresas/${empresaId}/integraciones`
            )
          }
        >
          Volver
        </Button>
      </div>

      {error && (
        <Card className="border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </Card>
      )}

      {mensaje && (
        <Card className="border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300">
            {mensaje}
          </p>
        </Card>
      )}

      <Card className="space-y-5 p-6">
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div>
            <p className="text-sm font-medium text-white">
              Activar WhatsApp
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Habilita el canal cuando la conexión esté lista.
            </p>
          </div>

          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) =>
              setEnabled(event.target.checked)
            }
            className="h-5 w-5 accent-emerald-500"
          />
        </label>

        <Input
          id="phone"
          label="Phone Number ID"
          value={phoneNumberId}
          onChange={(event) =>
            setPhoneNumberId(event.target.value)
          }
        />

        <Input
          id="business"
          label="Business Account ID"
          value={businessAccountId}
          onChange={(event) =>
            setBusinessAccountId(event.target.value)
          }
        />

        <Input
          id="token"
          label="Access Token"
          type="password"
          value={accessToken}
          onChange={(event) =>
            setAccessToken(event.target.value)
          }
        />

        <Input
          id="verify"
          label="Verify Token"
          type="password"
          value={verifyToken}
          onChange={(event) =>
            setVerifyToken(event.target.value)
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={guardarConfiguracion}
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : "Guardar configuración"}
          </Button>

          <Button
            variant="secondary"
            disabled
          >
            Probar conexión
          </Button>
        </div>
      </Card>
    </section>
  );
}