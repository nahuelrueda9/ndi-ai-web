"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  MessageCircle,
  PlugZap,
  ShieldCheck,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type EstadoConexion =
  | "sin_configurar"
  | "configurado"
  | "probando"
  | "conectado";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

type EmpresaData = {
  userId?: string;
};

type MiembroData = {
  rol?: Exclude<
    RolEmpresa,
    "propietario"
  >;
  estado?: "activo" | "inactivo";
};

type ConfiguracionWhatsApp = {
  phoneNumberId?: string;
  businessAccountId?: string;
  estado?: EstadoConexion;
  displayPhoneNumber?: string;
  verifiedName?: string;
};

type RespuestaConfiguracion = {
  config?: ConfiguracionWhatsApp | null;
  verifyToken?: string;
  error?: string;
};

type RespuestaApi = {
  message?: string;
  error?: string;
  numero?: string;
  nombreVerificado?: string;
};

const WEBHOOK_URL =
  "https://ndi-ai-web.vercel.app/api/webhooks/whatsapp";

export default function WhatsAppPage() {
  const params = useParams();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [
    accesoVerificado,
    setAccesoVerificado,
  ] = useState(false);

  const [
    verificandoAcceso,
    setVerificandoAcceso,
  ] = useState(true);

  const [
    cargandoConfiguracion,
    setCargandoConfiguracion,
  ] = useState(false);

  const [
    phoneNumberId,
    setPhoneNumberId,
  ] = useState("");

  const [
    businessAccountId,
    setBusinessAccountId,
  ] = useState("");

  const [
    accessToken,
    setAccessToken,
  ] = useState("");

  const [
    verifyToken,
    setVerifyToken,
  ] = useState("");

  const [
    numeroConectado,
    setNumeroConectado,
  ] = useState("");

  const [
    nombreVerificado,
    setNombreVerificado,
  ] = useState("");

  const [estado, setEstado] =
    useState<EstadoConexion>(
      "sin_configurar"
    );

  const [guardando, setGuardando] =
    useState(false);

  const [probando, setProbando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    copiado,
    setCopiado,
  ] = useState<
    "webhook" | "verify" | null
  >(null);

  useEffect(() => {
    const cancelarAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró la empresa."
            );
            setVerificandoAcceso(false);
            return;
          }

          const empresaIdSeguro =
            empresaId;

          const usuarioSeguro =
            currentUser;

          setUsuario(usuarioSeguro);
          setAccesoVerificado(false);
          setVerificandoAcceso(true);
          setError("");

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe."
              );
              return;
            }

            const empresa =
              empresaSnapshot.data() as EmpresaData;

            if (
              empresa.userId ===
              usuarioSeguro.uid
            ) {
              setAccesoVerificado(true);
              return;
            }

            const miembroReferencia =
              doc(
                db,
                "companies",
                empresaIdSeguro,
                "members",
                usuarioSeguro.uid
              );

            const miembroSnapshot =
              await getDoc(
                miembroReferencia
              );

            if (
              !miembroSnapshot.exists()
            ) {
              router.replace(
                "/empresas"
              );
              return;
            }

            const miembro =
              miembroSnapshot.data() as MiembroData;

            const tieneAcceso =
              miembro.estado ===
                "activo" &&
              (
                miembro.rol ===
                  "administrador" ||
                miembro.rol ===
                  "supervisor"
              );

            if (!tieneAcceso) {
              router.replace(
                `/empresas/${empresaIdSeguro}/conversaciones`
              );
              return;
            }

            setAccesoVerificado(true);
          } catch (firebaseError) {
            console.error(
              "Error al verificar acceso a WhatsApp:",
              firebaseError
            );

            setError(
              "No se pudo verificar el acceso a la empresa."
            );
          } finally {
            setVerificandoAcceso(false);
          }
        }
      );

    return () => cancelarAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (
      !empresaId ||
      !usuario ||
      !accesoVerificado
    ) {
      return;
    }

    const empresaIdSeguro = empresaId;
    const usuarioSeguro = usuario;
    let activo = true;

    async function cargarConfiguracion() {
      setCargandoConfiguracion(true);
      setError("");

      try {
        const idToken =
          await usuarioSeguro.getIdToken();

        const response = await fetch(
          `/api/integraciones/whatsapp/config?empresaId=${encodeURIComponent(
            empresaIdSeguro
          )}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${idToken}`,
            },
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as RespuestaConfiguracion;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudo cargar la configuración."
          );
        }

        if (!activo) {
          return;
        }

        setVerifyToken(
          data.verifyToken ?? ""
        );

        if (!data.config) {
          setEstado(
            "sin_configurar"
          );
          return;
        }

        setPhoneNumberId(
          data.config.phoneNumberId ?? ""
        );

        setBusinessAccountId(
          data.config.businessAccountId ??
            ""
        );

        setNumeroConectado(
          data.config.displayPhoneNumber ??
            ""
        );

        setNombreVerificado(
          data.config.verifiedName ?? ""
        );

        setEstado(
          data.config.estado ===
          "conectado"
            ? "conectado"
            : "configurado"
        );
      } catch (requestError) {
        console.error(
          "No se pudo cargar WhatsApp:",
          requestError
        );

        if (activo) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No se pudo cargar la configuración."
          );
        }
      } finally {
        if (activo) {
          setCargandoConfiguracion(
            false
          );
        }
      }
    }

    void cargarConfiguracion();

    return () => {
      activo = false;
    };
  }, [
    accesoVerificado,
    empresaId,
    usuario,
  ]);

  async function obtenerTokenUsuario() {
    if (!usuario) {
      throw new Error(
        "Tenés que iniciar sesión."
      );
    }

    return usuario.getIdToken(true);
  }

  function validarConfiguracion() {
    if (!phoneNumberId.trim()) {
      return "Ingresá el Phone Number ID.";
    }

    if (!businessAccountId.trim()) {
      return "Ingresá el WhatsApp Business Account ID.";
    }

    if (
      estado === "sin_configurar" &&
      !accessToken.trim()
    ) {
      return "Ingresá el Access Token.";
    }

    return "";
  }

  async function guardarConfiguracion() {
    const validacion =
      validarConfiguracion();

    if (validacion) {
      throw new Error(validacion);
    }

    if (
      !empresaId ||
      !accesoVerificado
    ) {
      throw new Error(
        "No se encontró la empresa."
      );
    }

    const idToken =
      await obtenerTokenUsuario();

    const response = await fetch(
      "/api/integraciones/whatsapp/config",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          empresaId,
          phoneNumberId:
            phoneNumberId.trim(),
          businessAccountId:
            businessAccountId.trim(),
          accessToken:
            accessToken.trim(),
        }),
      }
    );

    const data =
      (await response.json()) as RespuestaApi;

    if (!response.ok) {
      throw new Error(
        data.error ||
          "No se pudo guardar la configuración."
      );
    }

    setEstado("configurado");
  }

  async function ejecutarPrueba() {
    if (!empresaId) {
      throw new Error(
        "No se encontró la empresa."
      );
    }

    const idToken =
      await obtenerTokenUsuario();

    const response = await fetch(
      "/api/integraciones/whatsapp/probar",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          empresaId,
          phoneNumberId:
            phoneNumberId.trim(),
          accessToken:
            accessToken.trim(),
        }),
      }
    );

    const data =
      (await response.json()) as RespuestaApi;

    if (!response.ok) {
      throw new Error(
        data.error ||
          "No se pudo conectar con Meta."
      );
    }

    setEstado("conectado");

    setNumeroConectado(
      data.numero ?? ""
    );

    setNombreVerificado(
      data.nombreVerificado ?? ""
    );

    return data;
  }

  async function guardarYConectar() {
    if (guardando || probando) {
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await guardarConfiguracion();

      setProbando(true);
      setEstado("probando");

      const data =
        await ejecutarPrueba();

      setAccessToken("");

      setMensaje(
        data.message ||
          "WhatsApp quedó conectado correctamente."
      );
    } catch (requestError) {
      setEstado(
        estado === "sin_configurar"
          ? "sin_configurar"
          : "configurado"
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo conectar WhatsApp."
      );
    } finally {
      setGuardando(false);
      setProbando(false);
    }
  }

  async function probarNuevamente() {
    if (guardando || probando) {
      return;
    }

    setProbando(true);
    setEstado("probando");
    setError("");
    setMensaje("");

    try {
      const data =
        await ejecutarPrueba();

      setAccessToken("");

      setMensaje(
        data.message ||
          "Conexión con WhatsApp verificada correctamente."
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

  async function copiar(
    valor: string,
    tipo: "webhook" | "verify"
  ) {
    try {
      await navigator.clipboard.writeText(
        valor
      );

      setCopiado(tipo);

      window.setTimeout(() => {
        setCopiado(null);
      }, 1500);
    } catch {
      setError(
        "No se pudo copiar automáticamente."
      );
    }
  }

  if (
    verificandoAcceso ||
    cargandoConfiguracion
  ) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600 dark:border-zinc-700 dark:border-t-emerald-500" />

          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">
            Verificando acceso y cargando
            WhatsApp...
          </p>
        </Card>
      </section>
    );
  }

  if (
    error &&
    !accesoVerificado
  ) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>

          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={() =>
              router.push("/empresas")
            }
          >
            Volver a empresas
          </Button>
        </Card>
      </section>
    );
  }

  if (!accesoVerificado) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Canal principal de NDI AI
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
            Conectar WhatsApp
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700 dark:text-zinc-400">
            Conectá WhatsApp Business
            Platform para que NDI AI
            reciba consultas y responda
            automáticamente por tu negocio.
          </p>
        </div>

        <EstadoBadge
          estado={estado}
        />
      </header>

      {estado === "conectado" && (
        <Card className="border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

            <div>
              <p className="font-medium text-slate-950 dark:text-white">
                WhatsApp conectado
              </p>

              <p className="mt-1 text-sm text-slate-700 dark:text-zinc-400">
                {nombreVerificado
                  ? `${nombreVerificado}${numeroConectado ? ` · ${numeroConectado}` : ""}`
                  : numeroConectado ||
                    "Meta verificó correctamente la conexión."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
                  Paso 1
                </p>

                <h2 className="mt-1 font-semibold text-slate-950 dark:text-white">
                  Conseguí los datos en Meta
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-zinc-400">
              En Meta Developers, dentro
              de la configuración de
              WhatsApp de tu app, copiá
              estos tres datos:
            </p>

            <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-zinc-300">
              <p>• Phone Number ID</p>
              <p>• WhatsApp Business Account ID</p>
              <p>• Access Token</p>
            </div>

            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Abrir Meta Developers
              <ExternalLink className="h-4 w-4" />
            </a>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <PlugZap className="h-5 w-5 text-blue-600 dark:text-blue-400" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
                  Paso 2
                </p>

                <h2 className="mt-1 font-semibold text-slate-950 dark:text-white">
                  Configurá el webhook
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-zinc-400">
              En Webhooks de Meta usá
              exactamente estos datos y
              suscribí el campo
              <strong className="text-slate-950 dark:text-zinc-200">
                {" "}messages
              </strong>.
            </p>

            <CopyField
              label="URL de devolución"
              value={WEBHOOK_URL}
              copiado={
                copiado === "webhook"
              }
              onCopy={() =>
                copiar(
                  WEBHOOK_URL,
                  "webhook"
                )
              }
            />

            <CopyField
              label="Token de verificación"
              value={
                verifyToken ||
                "No configurado"
              }
              copiado={
                copiado === "verify"
              }
              onCopy={() =>
                verifyToken &&
                copiar(
                  verifyToken,
                  "verify"
                )
              }
              disabled={!verifyToken}
            />
          </Card>

          <Card className="border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

              <p className="text-sm leading-6 text-slate-700 dark:text-zinc-400">
                El Access Token es
                sensible. Pegalo únicamente
                acá dentro de NDI AI. Nunca
                lo publiques ni lo envíes
                por redes sociales.
              </p>
            </div>
          </Card>
        </div>

        <Card className="h-fit space-y-5 p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
                Paso 3
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                Conectá tu número
              </h2>
            </div>
          </div>

          <Input
            id="phone"
            label="Phone Number ID"
            value={phoneNumberId}
            onChange={(event) =>
              setPhoneNumberId(
                event.target.value
              )
            }
            placeholder="Ejemplo: 123456789012345"
          />

          <Input
            id="business"
            label="WhatsApp Business Account ID"
            value={businessAccountId}
            onChange={(event) =>
              setBusinessAccountId(
                event.target.value
              )
            }
            placeholder="Ejemplo: 987654321098765"
          />

          <Input
            id="token"
            label="Access Token"
            type="password"
            value={accessToken}
            onChange={(event) =>
              setAccessToken(
                event.target.value
              )
            }
            placeholder={
              estado === "sin_configurar"
                ? "Pegá el token generado por Meta"
                : "Dejalo vacío para conservar el token actual"
            }
          />

          {mensaje && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={
              guardarYConectar
            }
            disabled={
              guardando || probando
            }
            className="w-full"
          >
            {guardando ||
            probando
              ? "Comprobando conexión..."
              : estado === "conectado"
                ? "Guardar cambios y comprobar"
                : "Guardar y conectar WhatsApp"}
          </Button>

          {estado !==
            "sin_configurar" && (
            <Button
              type="button"
              variant="secondary"
              onClick={
                probarNuevamente
              }
              disabled={
                guardando ||
                probando
              }
              className="w-full"
            >
              {probando
                ? "Probando..."
                : "Probar conexión nuevamente"}
            </Button>
          )}

          <p className="text-xs leading-5 text-slate-600 dark:text-zinc-500">
            NDI AI no muestra nuevamente
            el Access Token guardado. Si
            necesitás cambiarlo, pegá uno
            nuevo y guardá.
          </p>
        </Card>
      </div>
    </section>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: EstadoConexion;
}) {
  const estilos = {
    conectado:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400",
    probando:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400",
    configurado:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400",
    sin_configurar:
      "border-slate-300 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400",
  };

  const textos = {
    conectado: "● Conectado",
    probando:
      "● Probando conexión...",
    configurado: "● Configurado",
    sin_configurar:
      "● Sin configurar",
  };

  return (
    <div
      className={`w-fit rounded-full border px-4 py-2 text-sm ${estilos[estado]}`}
    >
      {textos[estado]}
    </div>
  );
}

function CopyField({
  label,
  value,
  copiado,
  onCopy,
  disabled = false,
}: {
  label: string;
  value: string;
  copiado: boolean;
  onCopy: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-zinc-500">
        {label}
      </p>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          <p className="truncate">
            {value}
          </p>
        </div>

        <button
          type="button"
          onClick={onCopy}
          disabled={disabled}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Copy className="h-4 w-4" />
          {copiado
            ? "Copiado"
            : "Copiar"}
        </button>
      </div>
    </div>
  );
}