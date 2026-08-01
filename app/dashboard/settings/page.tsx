"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import CompanyInfoForm from "./CompanyInfoForm";

export default function SettingsPage() {
  const empresaId = "ZKe3UxYTjPDIHmS5SAwT";

  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const snap = await getDoc(doc(db, "companies", empresaId));

      if (snap.exists()) {
        setEmpresa(snap.data());
      }

      setLoading(false);
    }

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        Cargando...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Configuración
      </h1>

      <CompanyInfoForm
        empresaId={empresaId}
        empresa={empresa}
      />
    </div>
  );
}