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

type ConfiguracionInstagram = {
  instagramAccountId?: string;
  pageId?: string;
  verifyToken?: string;
  estado?: EstadoConexion;
};

type RespuestaConfiguracion = {
  config?: ConfiguracionInstagram;
  error?: string;
};

type RespuestaApi = {
  message?: string;
  error?: string;
};

export default function InstagramPage() {
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
    instagramAccountId,
    setInstagramAccountId,
  ] = useState("");

  const [pageId, setPageId] =
    useState("");

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
              "Error al verificar acceso a Instagram:",
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
          `/api/integraciones/instagram/config?empresaId=${encodeURIComponent(
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

        if (!data.config) {
          setEstado(
            "sin_configurar"
          );
          return;
        }

        setInstagramAccountId(
          data.config.instagramAccountId ??
            ""
        );

        setPageId(
          data.config.pageId ?? ""
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
          "No se pudo cargar Instagram:",
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
    if (
      !instagramAccountId.trim()
    ) {
      return "Ingresá el Instagram Account ID.";
    }

    if (!pageId.trim()) {
      return "Ingresá el Facebook Page ID.";
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

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const idToken =
        await obtenerTokenUsuario();

      const response = await fetch(
        "/api/integraciones/instagram/config",
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
            instagramAccountId:
              instagramAccountId.trim(),
            pageId: pageId.trim(),
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
      console.error(
        "Error guardando Instagram:",
        requestError
      );

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

    if (
      !instagramAccountId.trim() ||
      !pageId.trim()
    ) {
      setError(
        "Completá Instagram Account ID y Facebook Page ID."
      );
      return;
    }

    if (
      estado === "sin_configurar" &&
      !accessToken.trim()
    ) {
      setError(
        "Ingresá el Access Token."
      );
      return;
    }

    setError("");
    setMensaje("");
    setProbando(true);
    setEstado("probando");

    try {
      const idToken =
        await obtenerTokenUsuario();

      const response = await fetch(
        "/api/integraciones/instagram/probar",
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
            instagramAccountId:
              instagramAccountId.trim(),
            pageId: pageId.trim(),
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
          "Conexión con Instagram verificada correctamente."
      );
    } catch (requestError) {
      console.error(
        "Error probando Instagram:",
        requestError
      );

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-pink-500" />

          <p className="mt-4 text-sm text-zinc-400">
            Verificando acceso y cargando
            Instagram...
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
          <p className="text-sm font-medium text-pink-400">
            Integración oficial de Meta
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Instagram
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Recibí mensajes de Instagram,
            respondé con IA y centralizá
            los contactos en el inbox de
            NDI AI.
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

      <Card className="overflow-hidden">
        <div className="border-b border-zinc-800 bg-gradient-to-br from-pink-500/10 via-zinc-950 to-purple-500/10 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/15 text-2xl">
                ◎
              </div>

              <h2 className="text-xl font-semibold text-white">
                Conectá tu cuenta
                profesional
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Cuando habilitemos las
                credenciales de Meta, vas
                a poder conectar Instagram
                con un solo botón.
              </p>
            </div>

            <div className="shrink-0">
              <Button
                type="button"
                disabled
              >
                Conectar con Meta
              </Button>

              <p className="mt-2 text-center text-xs text-zinc-500">
                Disponible al configurar
                Meta
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <Paso
            numero="1"
            titulo="Cuenta profesional"
            descripcion="Usá una cuenta de Instagram de empresa o creador."
          />

          <Paso
            numero="2"
            titulo="Página vinculada"
            descripcion="La cuenta debe estar vinculada a una página de Facebook."
          />

          <Paso
            numero="3"
            titulo="Mensajes en NDI AI"
            descripcion="Los mensajes aparecerán automáticamente en el inbox."
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white">
          Qué se sincronizará
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Caracteristica texto="Mensajes recibidos" />
          <Caracteristica texto="Respuestas automáticas con IA" />
          <Caracteristica texto="Contactos y conversaciones" />
          <Caracteristica texto="Notificaciones en tiempo real" />
        </div>
      </Card>

      <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-semibold text-white">
              Configuración avanzada
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Conexión manual mediante
              IDs y Access Token.
            </p>
          </div>

          <span className="text-zinc-500 transition group-open:rotate-180">
            ▼
          </span>
        </summary>

        <div className="border-t border-zinc-800 p-6">
          <div className="space-y-5">
            <Input
              id="instagramAccountId"
              label="Instagram Account ID"
              value={
                instagramAccountId
              }
              onChange={(event) =>
                setInstagramAccountId(
                  event.target.value
                )
              }
              placeholder="17841400000000000"
            />

            <Input
              id="pageId"
              label="Facebook Page ID"
              value={pageId}
              onChange={(event) =>
                setPageId(
                  event.target.value
                )
              }
              placeholder="123456789012345"
            />

            <Input
              id="accessToken"
              label="Access Token"
              type="password"
              value={accessToken}
              onChange={(event) =>
                setAccessToken(
                  event.target.value
                )
              }
              placeholder={
                estado ===
                "sin_configurar"
                  ? "Pegá el token generado por Meta"
                  : "Dejalo vacío para conservar el token actual"
              }
            />

            <Input
              id="verifyToken"
              label="Verify Token"
              value={verifyToken}
              onChange={(event) =>
                setVerifyToken(
                  event.target.value
                )
              }
              placeholder="ndi_ai_instagram"
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
                  guardando ||
                  probando
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
                  guardando ||
                  probando
                }
              >
                {probando
                  ? "Probando..."
                  : "Probar conexión"}
              </Button>
            </div>
          </div>
        </div>
      </details>
    </section>
  );
}

function Paso({
  numero,
  titulo,
  descripcion,
}: {
  numero: string;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/10 text-sm font-semibold text-pink-400">
        {numero}
      </div>

      <h3 className="mt-4 font-medium text-white">
        {titulo}
      </h3>

      <p className="mt-2 text-sm leading-5 text-zinc-500">
        {descripcion}
      </p>
    </div>
  );
}

function Caracteristica({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-4 py-3">
      <span className="text-emerald-400">
        ✓
      </span>

      <span className="text-sm text-zinc-300">
        {texto}
      </span>
    </div>
  );
}