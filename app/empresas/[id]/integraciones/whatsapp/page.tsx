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
  verifyToken?: string;
  estado?: EstadoConexion;
};

type RespuestaConfiguracion = {
  config?: ConfiguracionWhatsApp;
  error?: string;
};

type RespuestaApi = {
  message?: string;
  error?: string;
};

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

        if (
          !activo ||
          !data.config
        ) {
          return;
        }

        setPhoneNumberId(
          data.config.phoneNumberId ?? ""
        );

        setBusinessAccountId(
          data.config.businessAccountId ??
            ""
        );

        setVerifyToken(
          data.config.verifyToken ?? ""
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
      return "Ingresá el Business Account ID.";
    }

    if (
      estado === "sin_configurar" &&
      !accessToken.trim()
    ) {
      return "Ingresá el Access Token.";
    }

    if (!verifyToken.trim()) {
      return "Ingresá el Verify Token.";
    }

    return "";
  }

  async function guardarConfiguracion() {
    if (
      !empresaId ||
      !accesoVerificado ||
      guardando
    ) {
      return;
    }

    const validacion =
      validarConfiguracion();

    if (validacion) {
      setError(validacion);
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
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
            verifyToken:
              verifyToken.trim(),
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
      setAccessToken("");

      setMensaje(
        data.message ||
          "Configuración guardada correctamente."
      );
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
    if (
      !empresaId ||
      !accesoVerificado ||
      probando
    ) {
      return;
    }

    if (!phoneNumberId.trim()) {
      setError(
        "Ingresá el Phone Number ID."
      );
      return;
    }

    setProbando(true);
    setEstado("probando");
    setError("");
    setMensaje("");

    try {
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

  if (
    verificandoAcceso ||
    cargandoConfiguracion
  ) {
    return (
      <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500" />

          <p className="mt-4 text-sm text-zinc-400">
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
        <Card className="border-red-500/20 bg-red-500/10 p-6">
          <p className="text-sm text-red-400">
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
          <p className="text-sm font-medium text-green-400">
            Integración oficial de Meta
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            WhatsApp Business
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Configurá tu número de
            WhatsApp Cloud API para
            recibir y responder mensajes
            desde NDI AI.
          </p>
        </div>

        <div className="w-fit rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm">
          {estado === "conectado" && (
            <span className="text-emerald-400">
              ● Conectado
            </span>
          )}

          {estado === "probando" && (
            <span className="text-amber-400">
              ● Probando conexión...
            </span>
          )}

          {estado === "configurado" && (
            <span className="text-blue-400">
              ● Configurado
            </span>
          )}

          {estado ===
            "sin_configurar" && (
            <span className="text-zinc-400">
              ● Sin configurar
            </span>
          )}
        </div>
      </header>

      <Card className="space-y-5 p-6">
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
          label="Business Account ID"
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

        <Input
          id="verify"
          label="Verify Token"
          value={verifyToken}
          onChange={(event) =>
            setVerifyToken(
              event.target.value
            )
          }
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
            onClick={
              guardarConfiguracion
            }
            disabled={
              guardando || probando
            }
          >
            {guardando
              ? "Guardando..."
              : "Guardar configuración"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={probarConexion}
            disabled={
              guardando || probando
            }
          >
            {probando
              ? "Probando..."
              : "Probar conexión"}
          </Button>
        </div>
      </Card>
    </section>
  );
}