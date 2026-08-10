"use client";

import type {
  FormEvent,
  TextareaHTMLAttributes,
} from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ExternalLink,
  Globe2,
  ImageIcon,
  Trash2,
  Upload,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type TemaWidget = "oscuro" | "claro";
type PosicionWidget = "derecha" | "izquierda";
type FormaWidget = "redondo" | "cuadrado";

interface Empresa {
  nombre?: string;
  rubro?: string;
  email?: string;
  telefono?: string;
  userId: string;

  descripcion?: string;
  direccion?: string;
  horarios?: string;
  sitioWeb?: string;

  redesSociales?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };

  personalidad?: string;
  objetivo?: string;
  instrucciones?: string;
  restricciones?: string;
  idioma?: string;

  paginaPublica?: {
    slug?: string;
    publicada?: boolean;

    titulo?: string;
    subtitulo?: string;

    colorPrincipal?: string;

    logoUrl?: string;
    portadaUrl?: string;
    galeria?: string[];

    mostrarWhatsApp?: boolean;
    mostrarEmail?: boolean;
    mostrarDireccion?: boolean;
    mostrarHorarios?: boolean;
  };

  widget?: {
    nombreBot?: string;
    mensajeBienvenida?: string;
    colorPrincipal?: string;
    tema?: TemaWidget;
    posicion?: PosicionWidget;
    formaBoton?: FormaWidget;
    textoPlaceholder?: string;
    mostrarMarca?: boolean;
  };
}

export default function ConfigurarAgentePage() {
  const params = useParams();
  const router = useRouter();

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  // INFORMACIÓN DEL NEGOCIO
  const [nombre, setNombre] =
    useState("");

  const [rubro, setRubro] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [descripcion, setDescripcion] =
    useState("");

  const [direccion, setDireccion] =
    useState("");

  const [horarios, setHorarios] =
    useState("");

  const [sitioWeb, setSitioWeb] =
    useState("");

  const [instagram, setInstagram] =
    useState("");

  const [facebook, setFacebook] =
    useState("");

  const [tiktok, setTiktok] =
    useState("");

  // PÁGINA PÚBLICA
  const [
    paginaSlug,
    setPaginaSlug,
  ] = useState("");

  const [
    paginaPublicada,
    setPaginaPublicada,
  ] = useState(false);

  const [
    paginaTitulo,
    setPaginaTitulo,
  ] = useState("");

  const [
    paginaSubtitulo,
    setPaginaSubtitulo,
  ] = useState("");

  const [
    paginaColorPrincipal,
    setPaginaColorPrincipal,
  ] = useState("#2563eb");

  const [
    paginaLogoUrl,
    setPaginaLogoUrl,
  ] = useState("");

  const [
    paginaPortadaUrl,
    setPaginaPortadaUrl,
  ] = useState("");

  const [
    paginaGaleria,
    setPaginaGaleria,
  ] = useState<string[]>([]);

  const [
    subiendoImagen,
    setSubiendoImagen,
  ] = useState<
    "logo" | "portada" | "galeria" | null
  >(null);

  const [
    paginaMostrarWhatsApp,
    setPaginaMostrarWhatsApp,
  ] = useState(true);

  const [
    paginaMostrarEmail,
    setPaginaMostrarEmail,
  ] = useState(true);

  const [
    paginaMostrarDireccion,
    setPaginaMostrarDireccion,
  ] = useState(true);

  const [
    paginaMostrarHorarios,
    setPaginaMostrarHorarios,
  ] = useState(true);

  // IA
  const [personalidad, setPersonalidad] =
    useState(
      "Amable, profesional y breve",
    );

  const [objetivo, setObjetivo] =
    useState("");

  const [
    instrucciones,
    setInstrucciones,
  ] = useState("");

  const [
    restricciones,
    setRestricciones,
  ] = useState(
    "No inventar información que no esté cargada.",
  );

  const [idioma, setIdioma] =
    useState("Español");

  // WIDGET
  const [nombreBot, setNombreBot] =
    useState("Asistente virtual");

  const [
    mensajeBienvenida,
    setMensajeBienvenida,
  ] = useState(
    "¡Hola! ¿En qué puedo ayudarte?",
  );

  const [
    colorPrincipal,
    setColorPrincipal,
  ] = useState("#3b82f6");

  const [tema, setTema] =
    useState<TemaWidget>("oscuro");

  const [posicion, setPosicion] =
    useState<PosicionWidget>("derecha");

  const [
    formaBoton,
    setFormaBoton,
  ] =
    useState<FormaWidget>("redondo");

  const [
    textoPlaceholder,
    setTextoPlaceholder,
  ] = useState(
    "Escribí tu mensaje...",
  );

  const [
    mostrarMarca,
    setMostrarMarca,
  ] = useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          if (!empresaId) {
            setError(
              "No se encontró el ID de la empresa.",
            );
            setLoading(false);
            return;
          }

          setUser(currentUser);
          setLoading(true);
          setError("");

          try {
            const empresaReferencia =
              doc(
                db,
                "companies",
                empresaId,
              );

            const empresaSnapshot =
              await getDoc(
                empresaReferencia,
              );

            if (
              !empresaSnapshot.exists()
            ) {
              setError(
                "La empresa no existe.",
              );
              return;
            }

            const empresa =
              empresaSnapshot.data() as Empresa;

            if (
              empresa.userId !==
              currentUser.uid
            ) {
              setError(
                "No tenés permiso para acceder a esta empresa.",
              );
              return;
            }

            setNombre(
              empresa.nombre || "",
            );

            setRubro(
              empresa.rubro || "",
            );

            setEmail(
              empresa.email || "",
            );

            setTelefono(
              empresa.telefono || "",
            );

            setDescripcion(
              empresa.descripcion || "",
            );

            setDireccion(
              empresa.direccion || "",
            );

            setHorarios(
              empresa.horarios || "",
            );

            setSitioWeb(
              empresa.sitioWeb || "",
            );

            setInstagram(
              empresa.redesSociales
                ?.instagram || "",
            );

            setFacebook(
              empresa.redesSociales
                ?.facebook || "",
            );

            setTiktok(
              empresa.redesSociales
                ?.tiktok || "",
            );

            // PÁGINA PÚBLICA
            const slugExistente =
              empresa.paginaPublica
                ?.slug || "";

            const slugInicial =
              slugExistente ||
              crearSlug(
                `${
                  empresa.nombre ||
                  "negocio"
                }-${empresaId.slice(
                  -6,
                )}`,
              );

            setPaginaSlug(
              slugInicial,
            );

            setPaginaPublicada(
              empresa.paginaPublica
                ?.publicada ?? false,
            );

            setPaginaTitulo(
              empresa.paginaPublica
                ?.titulo ||
                empresa.nombre ||
                "",
            );

            setPaginaSubtitulo(
              empresa.paginaPublica
                ?.subtitulo ||
                empresa.descripcion ||
                "",
            );

            setPaginaColorPrincipal(
              empresa.paginaPublica
                ?.colorPrincipal ||
                "#2563eb",
            );

            setPaginaLogoUrl(
              empresa.paginaPublica
                ?.logoUrl || "",
            );

            setPaginaPortadaUrl(
              empresa.paginaPublica
                ?.portadaUrl || "",
            );

            setPaginaGaleria(
              Array.isArray(
                empresa.paginaPublica
                  ?.galeria,
              )
                ? empresa.paginaPublica!.galeria!
                    .filter(
                      (url): url is string =>
                        typeof url === "string" &&
                        url.trim().length > 0,
                    )
                    .slice(0, 6)
                : [],
            );

            setPaginaMostrarWhatsApp(
              empresa.paginaPublica
                ?.mostrarWhatsApp ??
                true,
            );

            setPaginaMostrarEmail(
              empresa.paginaPublica
                ?.mostrarEmail ??
                true,
            );

            setPaginaMostrarDireccion(
              empresa.paginaPublica
                ?.mostrarDireccion ??
                true,
            );

            setPaginaMostrarHorarios(
              empresa.paginaPublica
                ?.mostrarHorarios ??
                true,
            );

            // IA
            setPersonalidad(
              empresa.personalidad ||
                "Amable, profesional y breve",
            );

            setObjetivo(
              empresa.objetivo || "",
            );

            setInstrucciones(
              empresa.instrucciones ||
                "",
            );

            setRestricciones(
              empresa.restricciones ||
                "No inventar información que no esté cargada.",
            );

            setIdioma(
              empresa.idioma ||
                "Español",
            );

            // WIDGET
            setNombreBot(
              empresa.widget
                ?.nombreBot ||
                empresa.nombre ||
                "Asistente virtual",
            );

            setMensajeBienvenida(
              empresa.widget
                ?.mensajeBienvenida ||
                "¡Hola! ¿En qué puedo ayudarte?",
            );

            setColorPrincipal(
              empresa.widget
                ?.colorPrincipal ||
                "#3b82f6",
            );

            setTema(
              empresa.widget?.tema ||
                "oscuro",
            );

            setPosicion(
              empresa.widget
                ?.posicion ||
                "derecha",
            );

            setFormaBoton(
              empresa.widget
                ?.formaBoton ||
                "redondo",
            );

            setTextoPlaceholder(
              empresa.widget
                ?.textoPlaceholder ||
                "Escribí tu mensaje...",
            );

            setMostrarMarca(
              empresa.widget
                ?.mostrarMarca ??
                true,
            );
          } catch (
            firebaseError
          ) {
            console.error(
              "Error al cargar la empresa:",
              firebaseError,
            );

            setError(
              "No se pudo cargar la empresa.",
            );
          } finally {
            setLoading(false);
          }
        },
      );

    return () =>
      unsubscribe();
  }, [empresaId, router]);

  const contrasteWidget =
    useMemo(
      () =>
        tema === "oscuro"
          ? "text-white"
          : "text-zinc-900",
      [tema],
    );

  const urlPublica =
    paginaSlug
      ? `/negocio/${paginaSlug}`
      : "";

  const subirImagenPagina = async (
    archivo: File,
    tipo: "logo" | "portada" | "galeria",
  ) => {
    if (!user || !empresaId) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setError(
        "Seleccioná una imagen válida.",
      );
      return;
    }

    const TAMANO_MAXIMO =
      5 * 1024 * 1024;

    if (archivo.size > TAMANO_MAXIMO) {
      setError(
        "La imagen no puede superar los 5 MB.",
      );
      return;
    }

    if (
      tipo === "galeria" &&
      paginaGaleria.length >= 6
    ) {
      setError(
        "Podés cargar hasta 6 imágenes en la galería.",
      );
      return;
    }

    setError("");
    setMensaje("");
    setSubiendoImagen(tipo);

    try {
      const idToken =
        await user.getIdToken();

      const authResponse =
        await fetch(
          `/api/imagekit/auth?empresaId=${encodeURIComponent(
            empresaId,
          )}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${idToken}`,
            },
            cache: "no-store",
          },
        );

      const authData =
        (await authResponse.json()) as {
          token?: string;
          expire?: number;
          signature?: string;
          publicKey?: string;
          urlEndpoint?: string;
          error?: string;
        };

      if (!authResponse.ok) {
        throw new Error(
          authData.error ||
            "No se pudo autorizar la subida.",
        );
      }

      if (
        !authData.token ||
        !authData.expire ||
        !authData.signature ||
        !authData.publicKey
      ) {
        throw new Error(
          "ImageKit devolvió una autorización incompleta.",
        );
      }

      const extension =
        archivo.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") ||
        "jpg";

      const baseNombre =
        archivo.name
          .replace(/\.[^.]+$/, "")
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            "",
          )
          .replace(
            /[^a-zA-Z0-9_-]+/g,
            "-",
          )
          .replace(/^-+|-+$/g, "")
          .slice(0, 60) ||
        tipo;

      const fileName =
        `${tipo}-${Date.now()}-${baseNombre}.${extension}`;

      const formData =
        new FormData();

      formData.append(
        "file",
        archivo,
      );
      formData.append(
        "fileName",
        fileName,
      );
      formData.append(
        "publicKey",
        authData.publicKey,
      );
      formData.append(
        "token",
        authData.token,
      );
      formData.append(
        "expire",
        String(authData.expire),
      );
      formData.append(
        "signature",
        authData.signature,
      );
      formData.append(
        "useUniqueFileName",
        "true",
      );
      formData.append(
        "folder",
        `/ndi-ai/companies/${empresaId}/public-page/${tipo}`,
      );

      const uploadResponse =
        await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          },
        );

      const uploadData =
        (await uploadResponse.json()) as {
          url?: string;
          fileId?: string;
          name?: string;
          message?: string;
          error?: string;
        };

      if (!uploadResponse.ok) {
        throw new Error(
          uploadData.message ||
            uploadData.error ||
            "ImageKit rechazó la imagen.",
        );
      }

      const url =
        uploadData.url?.trim();

      if (!url) {
        throw new Error(
          "ImageKit no devolvió la URL de la imagen.",
        );
      }

      if (tipo === "logo") {
        setPaginaLogoUrl(url);
      } else if (
        tipo === "portada"
      ) {
        setPaginaPortadaUrl(url);
      } else {
        setPaginaGaleria(
          (actual) =>
            [...actual, url].slice(
              0,
              6,
            ),
        );
      }

      setMensaje(
        "Imagen subida. Guardá la configuración para aplicar los cambios.",
      );
    } catch (
      uploadError
    ) {
      console.error(
        "Error al subir imagen a ImageKit:",
        uploadError,
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setSubiendoImagen(null);
    }
  };

  const quitarImagenGaleria = (
    indice: number,
  ) => {
    setPaginaGaleria(
      (actual) =>
        actual.filter(
          (_, index) =>
            index !== indice,
        ),
    );
  };

  const handleGuardar = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !user ||
      !empresaId
    ) {
      return;
    }

    if (!nombre.trim()) {
      setError(
        "Ingresá el nombre de la empresa.",
      );
      return;
    }

    if (!nombreBot.trim()) {
      setError(
        "Ingresá el nombre del bot.",
      );
      return;
    }

    const slugLimpio =
      crearSlug(paginaSlug);

    if (!slugLimpio) {
      setError(
        "Ingresá una URL válida para la página pública.",
      );
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const idToken =
        await user.getIdToken();

      const slugResponse =
        await fetch(
          "/api/companies/slug",
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
              slug: slugLimpio,
            }),
          },
        );

      const slugData =
        (await slugResponse.json()) as {
          disponible?: boolean;
          slug?: string;
          error?: string;
        };

      if (
        !slugResponse.ok ||
        slugData.disponible !== true
      ) {
        throw new Error(
          slugData.error ||
            "No se pudo verificar la URL pública.",
        );
      }

      const slugConfirmado =
        slugData.slug ||
        slugLimpio;

      const empresaReferencia =
        doc(
          db,
          "companies",
          empresaId,
        );

      await setDoc(
        empresaReferencia,
        {
          nombre:
            nombre.trim(),

          rubro:
            rubro.trim(),

          email:
            email.trim(),

          telefono:
            telefono.trim(),

          descripcion:
            descripcion.trim(),

          direccion:
            direccion.trim(),

          horarios:
            horarios.trim(),

          sitioWeb:
            sitioWeb.trim(),

          redesSociales: {
            instagram:
              instagram.trim(),
            facebook:
              facebook.trim(),
            tiktok:
              tiktok.trim(),
          },

          paginaPublica: {
            slug:
              slugConfirmado,

            publicada:
              paginaPublicada,

            titulo:
              paginaTitulo.trim() ||
              nombre.trim(),

            subtitulo:
              paginaSubtitulo.trim(),

            colorPrincipal:
              paginaColorPrincipal,

            logoUrl:
              paginaLogoUrl,

            portadaUrl:
              paginaPortadaUrl,

            galeria:
              paginaGaleria,

            mostrarWhatsApp:
              paginaMostrarWhatsApp,

            mostrarEmail:
              paginaMostrarEmail,

            mostrarDireccion:
              paginaMostrarDireccion,

            mostrarHorarios:
              paginaMostrarHorarios,
          },

          personalidad:
            personalidad.trim(),

          objetivo:
            objetivo.trim(),

          instrucciones:
            instrucciones.trim(),

          restricciones:
            restricciones.trim(),

          idioma,

          widget: {
            nombreBot:
              nombreBot.trim(),

            mensajeBienvenida:
              mensajeBienvenida.trim(),

            colorPrincipal,

            tema,

            posicion,

            formaBoton,

            textoPlaceholder:
              textoPlaceholder.trim(),

            mostrarMarca,
          },

          updatedAt:
            serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      setPaginaSlug(
        slugConfirmado,
      );

      setMensaje(
        "Configuración guardada correctamente.",
      );
    } catch (
      firebaseError
    ) {
      console.error(
        "Error al guardar:",
        firebaseError,
      );

      setError(
        firebaseError instanceof Error
          ? firebaseError.message
          : "No se pudo guardar la configuración.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium text-slate-950 dark:text-white">
            Cargando configuración...
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            Estamos preparando tu
            negocio.
          </p>
        </Card>
      </section>
    );
  }

  if (
    error &&
    !nombre
  ) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <Badge variant="danger">
            Error de acceso
          </Badge>

          <h1 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
            No pudimos abrir esta empresa
          </h1>

          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>

          <Button
            className="mt-6"
            variant="secondary"
            onClick={() =>
              router.push(
                "/empresas",
              )
            }
          >
            Volver a empresas
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/empresas",
              )
            }
            className="mb-4 text-sm text-slate-500 transition hover:text-slate-950 dark:text-zinc-500 dark:hover:text-white"
          >
            ← Volver a empresas
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Configuración del negocio
            </h1>

            <Badge variant="success">
              Activo
            </Badge>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400">
            Configurá la información,
            la página pública y el
            asistente inteligente de{" "}
            {nombre}.
          </p>
        </div>

        <Card className="flex items-center gap-3 px-4 py-3">
          <Avatar
            name={
              user?.displayName ||
              user?.email ||
              "Usuario"
            }
            src={
              user?.photoURL ||
              undefined
            }
            size="sm"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
              {user?.displayName ||
                "Administrador"}
            </p>

            <p className="max-w-56 truncate text-xs text-slate-500 dark:text-zinc-500">
              {user?.email}
            </p>
          </div>
        </Card>
      </header>

      <form
        onSubmit={handleGuardar}
        className="space-y-6"
      >
        {/* INFORMACIÓN DEL NEGOCIO */}
        <Card className="overflow-hidden">
          <SectionHeader
            title="Información del negocio"
            description="Datos generales que utilizarán la página pública y el asistente inteligente."
            right={
              rubro ? (
                <Badge variant="info">
                  {rubro}
                </Badge>
              ) : undefined
            }
          />

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Input
              id="nombre"
              label="Nombre de la empresa"
              value={nombre}
              onChange={(e) =>
                setNombre(
                  e.target.value,
                )
              }
              required
            />

            <Input
              id="rubro"
              label="Rubro"
              value={rubro}
              onChange={(e) =>
                setRubro(
                  e.target.value,
                )
              }
              required
            />

            <Input
              id="email"
              label="Correo"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value,
                )
              }
              placeholder="empresa@correo.com"
            />

            <Input
              id="telefono"
              label="Teléfono o WhatsApp"
              type="tel"
              value={telefono}
              onChange={(e) =>
                setTelefono(
                  e.target.value,
                )
              }
              placeholder="+54 9 388..."
            />

            <Input
              id="direccion"
              label="Dirección"
              value={direccion}
              onChange={(e) =>
                setDireccion(
                  e.target.value,
                )
              }
              placeholder="Dirección del negocio"
            />

            <Input
              id="sitioWeb"
              label="Sitio web"
              type="url"
              value={sitioWeb}
              onChange={(e) =>
                setSitioWeb(
                  e.target.value,
                )
              }
              placeholder="https://..."
            />

            <Input
              id="instagram"
              label="Instagram"
              type="url"
              value={instagram}
              onChange={(e) =>
                setInstagram(
                  e.target.value,
                )
              }
              placeholder="https://instagram.com/tu_negocio"
            />

            <Input
              id="facebook"
              label="Facebook"
              type="url"
              value={facebook}
              onChange={(e) =>
                setFacebook(
                  e.target.value,
                )
              }
              placeholder="https://facebook.com/tu_negocio"
            />

            <Input
              id="tiktok"
              label="TikTok"
              type="url"
              value={tiktok}
              onChange={(e) =>
                setTiktok(
                  e.target.value,
                )
              }
              placeholder="https://tiktok.com/@tu_negocio"
            />

            <div className="md:col-span-2">
              <TextArea
                id="descripcion"
                label="Descripción del negocio"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(
                    e.target.value,
                  )
                }
                placeholder="Explicá qué hace la empresa, qué vende y a qué clientes atiende."
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                id="horarios"
                label="Horarios de atención"
                value={horarios}
                onChange={(e) =>
                  setHorarios(
                    e.target.value,
                  )
                }
                placeholder="Ejemplo: lunes a viernes de 8:00 a 18:00."
              />
            </div>
          </div>
        </Card>

        {/* PÁGINA PÚBLICA */}
        <Card className="overflow-hidden">
          <SectionHeader
            title="Página pública del negocio"
            description="Prepará la página que podrán visitar tus clientes."
            right={
              paginaPublicada ? (
                <Badge variant="success">
                  Publicada
                </Badge>
              ) : (
                <Badge variant="info">
                  Borrador
                </Badge>
              )
            }
          />

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
            <div className="grid content-start gap-5 md:grid-cols-2">
              <Input
                id="paginaTitulo"
                label="Título de la página"
                value={paginaTitulo}
                onChange={(e) =>
                  setPaginaTitulo(
                    e.target.value,
                  )
                }
                placeholder="Nombre que verá el cliente"
              />

              <div className="space-y-2">
                <label
                  htmlFor="paginaSlug"
                  className="block text-sm font-medium text-slate-700 dark:text-zinc-200"
                >
                  Dirección de la página
                </label>

                <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex items-center">
                    <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500">
                      /negocio/
                    </span>

                    <input
                      id="paginaSlug"
                      value={
                        paginaSlug
                      }
                      onChange={(e) =>
                        setPaginaSlug(
                          crearSlug(
                            e.target
                              .value,
                          ),
                        )
                      }
                      className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-900 outline-none dark:text-white"
                      placeholder="mi-negocio"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  Esta será la URL
                  pública de tu negocio.
                </p>
              </div>

              <div className="md:col-span-2">
                <TextArea
                  id="paginaSubtitulo"
                  label="Texto principal"
                  value={
                    paginaSubtitulo
                  }
                  onChange={(e) =>
                    setPaginaSubtitulo(
                      e.target.value,
                    )
                  }
                  placeholder="Ejemplo: Cortes, barba y atención personalizada en el centro de Jujuy."
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-zinc-200">
                    Identidad visual
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    Cargá el logo, una imagen de portada y hasta 6 fotos para la galería pública.
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ImagenUploader
                    titulo="Logo del negocio"
                    descripcion="PNG, JPG o WebP · máximo 5 MB · recomendado 512 × 512 px."
                    imagenUrl={paginaLogoUrl}
                    cargando={subiendoImagen === "logo"}
                    onSeleccionar={(archivo) =>
                      subirImagenPagina(
                        archivo,
                        "logo",
                      )
                    }
                    onQuitar={() =>
                      setPaginaLogoUrl("")
                    }
                    aspectClass="aspect-square max-w-[180px]"
                  />

                  <ImagenUploader
                    titulo="Imagen de portada"
                    descripcion="PNG, JPG o WebP · máximo 5 MB · recomendado 1600 × 900 px."
                    imagenUrl={paginaPortadaUrl}
                    cargando={subiendoImagen === "portada"}
                    onSeleccionar={(archivo) =>
                      subirImagenPagina(
                        archivo,
                        "portada",
                      )
                    }
                    onQuitar={() =>
                      setPaginaPortadaUrl("")
                    }
                    aspectClass="aspect-[16/9]"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-950 dark:text-white">
                        Galería
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                        {paginaGaleria.length}/6 imágenes cargadas · máximo 5 MB cada una · recomendado 1200 × 900 px
                      </p>
                    </div>

                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 ${
                        paginaGaleria.length >= 6 ||
                        subiendoImagen === "galeria"
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {subiendoImagen === "galeria"
                        ? "Subiendo..."
                        : "Agregar imagen"}

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={
                          paginaGaleria.length >= 6 ||
                          subiendoImagen === "galeria"
                        }
                        onChange={(event) => {
                          const archivo =
                            event.target.files?.[0];

                          if (archivo) {
                            void subirImagenPagina(
                              archivo,
                              "galeria",
                            );
                          }

                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {paginaGaleria.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {paginaGaleria.map(
                        (url, indice) => (
                          <div
                            key={`${url}-${indice}`}
                            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <img
                              src={url}
                              alt={`Galería ${indice + 1}`}
                              className="h-full w-full object-cover"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                quitarImagenGaleria(
                                  indice,
                                )
                              }
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white opacity-100 transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label="Quitar imagen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                      <div>
                        <ImageIcon className="mx-auto h-6 w-6 text-slate-400 dark:text-zinc-600" />
                        <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
                          Todavía no cargaste imágenes para la galería.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="paginaColorPrincipal"
                  className="block text-sm font-medium text-slate-700 dark:text-zinc-200"
                >
                  Color principal
                </label>

                <div className="flex gap-3">
                  <input
                    id="paginaColorPrincipal"
                    type="color"
                    value={
                      paginaColorPrincipal
                    }
                    onChange={(e) =>
                      setPaginaColorPrincipal(
                        e.target.value,
                      )
                    }
                    className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                  />

                  <input
                    value={
                      paginaColorPrincipal
                    }
                    onChange={(e) =>
                      setPaginaColorPrincipal(
                        e.target.value,
                      )
                    }
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-white">
                    Publicar página
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    Permitirá que cualquier
                    cliente pueda verla.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    paginaPublicada
                  }
                  onChange={(e) =>
                    setPaginaPublicada(
                      e.target
                        .checked,
                    )
                  }
                  className="h-5 w-5 accent-blue-500"
                />
              </label>

              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-medium text-slate-700 dark:text-zinc-200">
                  Información visible
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <ToggleOpcion
                    titulo="WhatsApp"
                    descripcion="Mostrar botón de contacto."
                    checked={
                      paginaMostrarWhatsApp
                    }
                    onChange={
                      setPaginaMostrarWhatsApp
                    }
                  />

                  <ToggleOpcion
                    titulo="Correo"
                    descripcion="Mostrar correo del negocio."
                    checked={
                      paginaMostrarEmail
                    }
                    onChange={
                      setPaginaMostrarEmail
                    }
                  />

                  <ToggleOpcion
                    titulo="Dirección"
                    descripcion="Mostrar ubicación del negocio."
                    checked={
                      paginaMostrarDireccion
                    }
                    onChange={
                      setPaginaMostrarDireccion
                    }
                  />

                  <ToggleOpcion
                    titulo="Horarios"
                    descripcion="Mostrar horarios de atención."
                    checked={
                      paginaMostrarHorarios
                    }
                    onChange={
                      setPaginaMostrarHorarios
                    }
                  />
                </div>
              </div>
            </div>

            {/* PREVIEW PÁGINA */}
            <div className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Vista previa
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    Página del negocio
                  </p>
                </div>

                <Globe2 className="h-5 w-5 text-blue-500" />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div
                  className="relative h-40 overflow-hidden p-5 text-white"
                  style={{
                    background: paginaPortadaUrl
                      ? `linear-gradient(rgba(0,0,0,.48), rgba(0,0,0,.72)), url("${paginaPortadaUrl}") center/cover`
                      : `linear-gradient(135deg, ${paginaColorPrincipal}, #09090b)`,
                  }}
                >
                  <div className="relative z-10 flex h-full items-end gap-3">
                    {paginaLogoUrl && (
                      <img
                        src={paginaLogoUrl}
                        alt="Logo"
                        className="h-14 w-14 shrink-0 rounded-xl border border-white/20 bg-white object-cover shadow-lg"
                      />
                    )}

                    <div className="min-w-0 pb-1">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
                        {rubro ||
                          "Tu negocio"}
                      </p>

                      <h3 className="mt-1 truncate text-2xl font-bold">
                        {paginaTitulo ||
                          nombre ||
                          "Tu negocio"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm leading-6 text-slate-600 dark:text-zinc-400">
                    {paginaSubtitulo ||
                      descripcion ||
                      "Agregá una descripción para mostrar qué ofrece tu negocio."}
                  </p>

                  <div className="mt-5 grid gap-2">
                    {paginaMostrarHorarios &&
                      horarios && (
                        <PreviewDato
                          titulo="Horarios"
                          valor={
                            horarios
                          }
                        />
                      )}

                    {paginaMostrarDireccion &&
                      direccion && (
                        <PreviewDato
                          titulo="Ubicación"
                          valor={
                            direccion
                          }
                        />
                      )}

                    {paginaMostrarWhatsApp &&
                      telefono && (
                        <PreviewDato
                          titulo="WhatsApp"
                          valor={
                            telefono
                          }
                        />
                      )}

                    {paginaMostrarEmail &&
                      email && (
                        <PreviewDato
                          titulo="Correo"
                          valor={
                            email
                          }
                        />
                      )}
                  </div>

                  <button
                    type="button"
                    style={{
                      backgroundColor:
                        paginaColorPrincipal,
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                  >
                    Contactar
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs text-slate-500 dark:text-zinc-500">
                  URL
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-800 dark:text-zinc-200">
                  {urlPublica ||
                    "/negocio/mi-negocio"}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  !paginaSlug
                }
                onClick={() => {
                  if (
                    !paginaSlug
                  ) {
                    return;
                  }

                  window.open(
                    urlPublica,
                    "_blank",
                  );
                }}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir página
              </button>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-zinc-600">
                La ruta pública la
                creamos en el siguiente
                paso.
              </p>
            </div>
          </div>
        </Card>

        {/* IA */}
        <Card className="overflow-hidden">
          <SectionHeader
            title="Comportamiento de la IA"
            description="Definí cómo debe hablar, qué objetivo tiene y cuáles son sus límites."
            right={
              <Badge variant="purple">
                {idioma}
              </Badge>
            }
          />

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <Input
              id="personalidad"
              label="Personalidad"
              value={personalidad}
              onChange={(e) =>
                setPersonalidad(
                  e.target.value,
                )
              }
              placeholder="Amable, profesional y breve"
              helperText="Por ejemplo: cercana, clara, comercial y breve."
            />

            <SelectField
              id="idioma"
              label="Idioma"
              value={idioma}
              onChange={setIdioma}
              options={[
                "Español",
                "Inglés",
                "Portugués",
              ]}
              helperText="Idioma principal en el que responderá el agente."
            />

            <div className="md:col-span-2">
              <TextArea
                id="objetivo"
                label="Objetivo principal"
                value={objetivo}
                onChange={(e) =>
                  setObjetivo(
                    e.target.value,
                  )
                }
                placeholder="Ejemplo: responder consultas y conseguir nuevos clientes."
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                id="instrucciones"
                label="Instrucciones especiales"
                value={
                  instrucciones
                }
                onChange={(e) =>
                  setInstrucciones(
                    e.target.value,
                  )
                }
                placeholder="Ejemplo: pedir nombre y teléfono antes de derivar una consulta."
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                id="restricciones"
                label="Qué no debe hacer"
                value={
                  restricciones
                }
                onChange={(e) =>
                  setRestricciones(
                    e.target.value,
                  )
                }
                placeholder="Ejemplo: no inventar precios, promociones ni disponibilidad."
                helperText="Estas reglas ayudan a reducir respuestas incorrectas."
              />
            </div>
          </div>
        </Card>

        <div
          id="apariencia-widget"
          className="scroll-mt-24"
        />

        {/* WIDGET */}
        <Card className="overflow-hidden">
          <SectionHeader
            title="Apariencia del widget"
            description="Personalizá el chat que verán los visitantes del sitio web."
            right={
              <Badge variant="info">
                Vista previa en vivo
              </Badge>
            }
          />

          <div className="grid gap-6 p-6 xl:grid-cols-[1fr_420px]">
            <div className="grid content-start gap-5 md:grid-cols-2">
              <Input
                id="nombreBot"
                label="Nombre del bot"
                value={nombreBot}
                onChange={(e) =>
                  setNombreBot(
                    e.target.value,
                  )
                }
                placeholder="Asistente virtual"
                required
              />

              <Input
                id="textoPlaceholder"
                label="Texto del campo"
                value={
                  textoPlaceholder
                }
                onChange={(e) =>
                  setTextoPlaceholder(
                    e.target.value,
                  )
                }
                placeholder="Escribí tu mensaje..."
              />

              <div className="md:col-span-2">
                <TextArea
                  id="mensajeBienvenida"
                  label="Mensaje de bienvenida"
                  value={
                    mensajeBienvenida
                  }
                  onChange={(e) =>
                    setMensajeBienvenida(
                      e.target.value,
                    )
                  }
                  placeholder="¡Hola! ¿En qué puedo ayudarte?"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="colorPrincipal"
                  className="block text-sm font-medium text-slate-700 dark:text-zinc-200"
                >
                  Color principal
                </label>

                <div className="flex gap-3">
                  <input
                    id="colorPrincipal"
                    type="color"
                    value={
                      colorPrincipal
                    }
                    onChange={(e) =>
                      setColorPrincipal(
                        e.target.value,
                      )
                    }
                    className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                  />

                  <input
                    value={
                      colorPrincipal
                    }
                    onChange={(e) =>
                      setColorPrincipal(
                        e.target.value,
                      )
                    }
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <SelectField
                id="tema"
                label="Tema"
                value={tema}
                onChange={(value) =>
                  setTema(
                    value as TemaWidget,
                  )
                }
                options={[
                  "oscuro",
                  "claro",
                ]}
              />

              <SelectField
                id="posicion"
                label="Posición"
                value={posicion}
                onChange={(value) =>
                  setPosicion(
                    value as PosicionWidget,
                  )
                }
                options={[
                  "derecha",
                  "izquierda",
                ]}
              />

              <SelectField
                id="formaBoton"
                label="Forma del botón"
                value={formaBoton}
                onChange={(value) =>
                  setFormaBoton(
                    value as FormaWidget,
                  )
                }
                options={[
                  "redondo",
                  "cuadrado",
                ]}
              />

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 dark:border-zinc-800 dark:bg-zinc-950/50">
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-white">
                    Mostrar “Creado con
                    NDI AI”
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    Podrás ocultarlo en
                    los planes
                    superiores.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    mostrarMarca
                  }
                  onChange={(e) =>
                    setMostrarMarca(
                      e.target
                        .checked,
                    )
                  }
                  className="h-5 w-5 accent-blue-500"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Vista previa
                  </p>

                  <p className="text-xs text-zinc-500">
                    Así se verá el
                    widget en tu web.
                  </p>
                </div>

                <Badge variant="success">
                  En vivo
                </Badge>
              </div>

              <div className="relative min-h-[500px] overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_top,#27272a,transparent_55%)] p-5">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
                  <div className="h-3 w-28 rounded bg-zinc-800" />
                  <div className="mt-3 h-2 w-full rounded bg-zinc-800/70" />
                  <div className="mt-2 h-2 w-3/4 rounded bg-zinc-800/70" />
                </div>

                <div
                  className={`absolute bottom-20 w-[calc(100%-40px)] max-w-sm ${
                    posicion ===
                    "derecha"
                      ? "right-5"
                      : "left-5"
                  }`}
                >
                  <div
                    className={`overflow-hidden rounded-2xl border shadow-2xl ${
                      tema ===
                      "oscuro"
                        ? "border-zinc-700 bg-zinc-900"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        backgroundColor:
                          colorPrincipal,
                      }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
                        ✦
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {nombreBot ||
                            "Asistente virtual"}
                        </p>

                        <p className="text-xs text-white/75">
                          En línea
                        </p>
                      </div>

                      <span className="text-white/80">
                        —
                      </span>
                    </div>

                    <div
                      className={`space-y-4 p-4 ${
                        tema ===
                        "oscuro"
                          ? "bg-zinc-900"
                          : "bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white"
                          style={{
                            backgroundColor:
                              colorPrincipal,
                          }}
                        >
                          ✦
                        </div>

                        <div
                          className={`max-w-[82%] rounded-2xl rounded-tl-md px-3 py-2 text-sm ${
                            tema ===
                            "oscuro"
                              ? "bg-zinc-800 text-zinc-200"
                              : "bg-white text-zinc-700 shadow-sm"
                          }`}
                        >
                          {mensajeBienvenida ||
                            "¡Hola! ¿En qué puedo ayudarte?"}
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                          tema ===
                          "oscuro"
                            ? "border-zinc-700 bg-zinc-950"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <span
                          className={`min-w-0 flex-1 truncate text-sm ${
                            tema ===
                            "oscuro"
                              ? "text-zinc-500"
                              : "text-zinc-400"
                          }`}
                        >
                          {textoPlaceholder ||
                            "Escribí tu mensaje..."}
                        </span>

                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                          style={{
                            backgroundColor:
                              colorPrincipal,
                          }}
                        >
                          ↑
                        </button>
                      </div>

                      {mostrarMarca && (
                        <p
                          className={`text-center text-[10px] ${
                            tema ===
                            "oscuro"
                              ? "text-zinc-600"
                              : "text-zinc-400"
                          }`}
                        >
                          Creado con NDI AI
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`absolute bottom-5 flex h-14 w-14 items-center justify-center text-2xl text-white shadow-xl ${
                    posicion ===
                    "derecha"
                      ? "right-5"
                      : "left-5"
                  } ${
                    formaBoton ===
                    "redondo"
                      ? "rounded-full"
                      : "rounded-2xl"
                  }`}
                  style={{
                    backgroundColor:
                      colorPrincipal,
                  }}
                  aria-label="Abrir chat"
                >
                  💬
                </button>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </Card>
        )}

        {mensaje && (
          <Card className="border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {mensaje}
            </p>
          </Card>
        )}

        <Card className="sticky bottom-4 z-20 flex flex-col gap-4 border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700/80 dark:bg-zinc-900/95">
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              Configuración general
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Guardá los cambios antes
              de salir.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(
                  `/empresas/${empresaId}/conocimiento`,
                )
              }
            >
              Base de conocimiento
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(
                  `/empresas/${empresaId}/probar`,
                )
              }
            >
              Probar agente
            </Button>

            <Button
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : "Guardar configuración"}
            </Button>
          </div>
        </Card>
      </form>
    </section>
  );
}

function SectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
            {description}
          </p>
        </div>

        {right}
      </div>
    </div>
  );
}

function ImagenUploader({
  titulo,
  descripcion,
  imagenUrl,
  cargando,
  onSeleccionar,
  onQuitar,
  aspectClass,
}: {
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  cargando: boolean;
  onSeleccionar: (
    archivo: File,
  ) => void;
  onQuitar: () => void;
  aspectClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div>
        <p className="text-sm font-medium text-slate-950 dark:text-white">
          {titulo}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      </div>

      {imagenUrl ? (
        <div
          className={`relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${aspectClass}`}
        >
          <img
            src={imagenUrl}
            alt={titulo}
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            onClick={onQuitar}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/70 text-white transition hover:bg-red-600"
            aria-label={`Quitar ${titulo}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`mt-4 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 dark:border-zinc-700 dark:bg-zinc-900/40 ${aspectClass}`}
        >
          <ImageIcon className="h-7 w-7 text-slate-400 dark:text-zinc-600" />
        </div>
      )}

      <label
        className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 ${
          cargando
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      >
        <Upload className="h-4 w-4" />
        {cargando
          ? "Subiendo..."
          : imagenUrl
            ? "Cambiar imagen"
            : "Subir imagen"}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={cargando}
          onChange={(event) => {
            const archivo =
              event.target.files?.[0];

            if (archivo) {
              onSeleccionar(archivo);
            }

            event.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  helperText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  options: string[];
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-zinc-200"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm capitalize text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ),
        )}
      </select>

      {helperText && (
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

function ToggleOpcion({
  titulo,
  descripcion,
  checked,
  onChange,
}: {
  titulo: string;
  descripcion: string;
  checked: boolean;
  onChange: (
    value: boolean,
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
      <div>
        <p className="text-sm font-medium text-slate-950 dark:text-white">
          {titulo}
        </p>

        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked,
          )
        }
        className="h-5 w-5 accent-blue-500"
      />
    </label>
  );
}

function PreviewDato({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-600">
        {titulo}
      </p>

      <p className="mt-1 line-clamp-2 text-sm text-slate-700 dark:text-zinc-300">
        {valor}
      </p>
    </div>
  );
}

type TextAreaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    helperText?: string;
  };

function TextArea({
  label,
  helperText,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-zinc-200"
      >
        {label}
      </label>

      <textarea
        id={id}
        rows={4}
        className={[
          "w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900",
          "text-sm text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500",
          "transition-colors duration-200",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {helperText && (
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

function crearSlug(
  valor: string,
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}