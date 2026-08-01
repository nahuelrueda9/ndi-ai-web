"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

interface Empresa {
  id: string;
  nombre: string;
  rubro: string;
  email: string;
  telefono: string;
  userId: string;
}

export default function EmpresasPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const empresasQuery = query(
      collection(db, "companies"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeEmpresas = onSnapshot(
      empresasQuery,
      (snapshot) => {
        const empresasData = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<Empresa, "id">),
        }));

        setEmpresas(empresasData);
      },
      (firebaseError) => {
        console.error("Error al cargar empresas:", firebaseError);
        setError(
          "No se pudieron cargar las empresas. Puede faltar un índice en Firestore."
        );
      }
    );

    return () => unsubscribeEmpresas();
  }, [user]);

  const handleCrearEmpresa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) return;

    setError("");
    setGuardando(true);

    try {
      await addDoc(collection(db, "companies"), {
        nombre: nombre.trim(),
        rubro: rubro.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setNombre("");
      setRubro("");
      setEmail("");
      setTelefono("");
      setMostrarFormulario(false);
    } catch (firebaseError) {
      console.error("Error al crear empresa:", firebaseError);
      setError("No se pudo guardar la empresa.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium">Cargando empresas...</p>
          <p className="mt-1 text-sm text-zinc-500">
            Estamos preparando tu espacio de trabajo.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <DashboardLayout>
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Gestión comercial
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Empresas
              </h1>

              <Badge variant="info">
                {empresas.length} {empresas.length === 1 ? "empresa" : "empresas"}
              </Badge>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Creá y administrá los negocios que usarán NDI AI para atender
              consultas y acompañar a sus clientes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Card className="flex items-center gap-3 px-4 py-3">
              <Avatar
                name={user?.displayName || user?.email || "Usuario"}
                src={user?.photoURL || undefined}
                size="sm"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user?.displayName || "Administrador"}
                </p>
                <p className="max-w-52 truncate text-xs text-zinc-500">
                  {user?.email}
                </p>
              </div>
            </Card>

            <Button
              onClick={() =>
                setMostrarFormulario((estadoAnterior) => !estadoAnterior)
              }
              variant={mostrarFormulario ? "secondary" : "primary"}
            >
              {mostrarFormulario ? "Cancelar" : "+ Nueva empresa"}
            </Button>
          </div>
        </header>

        {mostrarFormulario && (
          <Card className="mb-6 overflow-hidden">
            <div className="border-b border-zinc-800 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">
                Crear una nueva empresa
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Cargá los datos principales. Después podrás configurar su agente
                y la base de conocimiento.
              </p>
            </div>

            <form
              onSubmit={handleCrearEmpresa}
              className="grid gap-5 p-6 md:grid-cols-2"
            >
              <Input
                id="nombre"
                label="Nombre de la empresa"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Ejemplo: Santa Cornelia SRL"
                required
              />

              <Input
                id="rubro"
                label="Rubro"
                value={rubro}
                onChange={(event) => setRubro(event.target.value)}
                placeholder="Ejemplo: Ganadería"
                required
              />

              <Input
                id="emailEmpresa"
                label="Correo"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="empresa@correo.com"
              />

              <Input
                id="telefono"
                label="Teléfono"
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                placeholder="+54 9 388..."
              />

              <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMostrarFormulario(false)}
                >
                  Cancelar
                </Button>

                <Button type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar empresa"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </Card>
        )}

        {empresas.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
              🏢
            </div>

            <h2 className="mt-5 text-xl font-semibold text-white">
              Todavía no hay empresas registradas
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Creá tu primera empresa para comenzar a configurar su agente de
              inteligencia artificial.
            </p>

            <Button
              className="mt-6"
              onClick={() => setMostrarFormulario(true)}
            >
              Crear primera empresa
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {empresas.map((empresa) => (
              <Card
                key={empresa.id}
                className="group flex h-full flex-col overflow-hidden"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={empresa.nombre} size="md" />

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-white">
                          {empresa.nombre}
                        </h2>

                        <p className="mt-1 truncate text-sm text-zinc-500">
                          {empresa.rubro || "Sin rubro"}
                        </p>
                      </div>
                    </div>

                    <Badge variant="success">Activa</Badge>
                  </div>

                  <div className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                    <InfoRow
                      label="Correo"
                      value={empresa.email || "Sin correo"}
                    />

                    <InfoRow
                      label="Teléfono"
                      value={empresa.telefono || "Sin teléfono"}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <MiniMetric label="Agente" value="Activo" />
                    <MiniMetric label="Estado" value="Listo" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-800 p-4 sm:flex-row">
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => {
                      window.location.href =
                        `/empresas/${empresa.id}/conversaciones`;
                    }}
                  >
                    Conversaciones
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => {
                      window.location.href = `/empresas/${empresa.id}`;
                    }}
                  >
                    Configurar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="max-w-[65%] break-words text-right text-zinc-300">
        {value}
      </span>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}