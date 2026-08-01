"use client";

import { useState } from "react";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

export default function WhatsAppPage() {
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          WhatsApp Business
        </h1>

        <p className="mt-2 text-zinc-400">
          Configurá la API oficial de Meta.
        </p>
      </div>

      <Card className="space-y-5 p-6">

        <Input
          id="phone"
          label="Phone Number ID"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
        />

        <Input
          id="business"
          label="Business Account ID"
          value={businessAccountId}
          onChange={(e) => setBusinessAccountId(e.target.value)}
        />

        <Input
          id="token"
          label="Access Token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />

        <Input
          id="verify"
          label="Verify Token"
          value={verifyToken}
          onChange={(e) => setVerifyToken(e.target.value)}
        />

        <div className="flex gap-3">
          <Button>
            Guardar configuración
          </Button>

          <Button variant="secondary">
            Probar conexión
          </Button>
        </div>

      </Card>
    </section>
  );
}