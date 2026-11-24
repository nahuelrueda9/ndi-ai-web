"use client";

import type {
  FormEvent,
  TextareaHTMLAttributes,
} from "react";
import {
  useEffect,
  useId,
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
  updateDoc,
} from "firebase/firestore";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  Bell,
  ExternalLink,
  Globe2,
  ImageIcon,
  Smartphone,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  obtenerNombrePlan,
  obtenerPlanEfectivo,
  type PlanId,
} from "@/lib/plans/planAccess";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Avatar from "@/components/Ui/Avatar";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";
import OnboardingCard from "@/components/dashboard/OnboardingCard";

export type ElementoHero = {
  url: string;
  tipo: "imagen" | "video";
};

type TemaPagina = "oscuro" | "claro";

type TestimonioPagina = {
  nombre: string;
  cargo?: string;
  texto: string;
};

type PreguntaFrecuentePagina = {
  pregunta: string;
  respuesta: string;
};

type TemaWidget = "oscuro" | "claro";
type PosicionWidget = "derecha" | "izquierda";
type FormaWidget = "redondo" | "cuadrado";

interface Empresa {
  nombre?: string;
  rubro?: string;
  email?: string;
  telefono?: string;
  userId: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;

  descripcion?: string;
  direccion?: string;
  horarios?: string;

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
    textoSecundario?: string;

    colorPrincipal?: string;
    tema?: TemaPagina;
    tipografia?: string;

    logoUrl?: string;
    logoOscuroUrl?: string;
    portadaUrl?: string;
    portadaUrl2?: string;
    portadaUrl3?: string;
    portadaUrl4?: string;
    portadaUrl5?: string;
    portadaUrl6?: string;

    multimediaHero?: ElementoHero[];
    galeria?: string[];

    mostrarWhatsApp?: boolean;
    mostrarEmail?: boolean;
    mostrarDireccion?: boolean;
    mostrarHorarios?: boolean;
    mostrarLogoHeader?: boolean;

    mostrarServicios?: boolean;
    mostrarProductos?: boolean;
    mostrarGaleria?: boolean;
    mostrarMapa?: boolean;
    mostrarPresupuesto?: boolean;
    mostrarReservasMesa?: boolean;
    mostrarPedidosOnline?: boolean;
    mostrarContacto?: boolean;

    testimonios?: TestimonioPagina[];
    preguntasFrecuentes?: PreguntaFrecuentePagina[];
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

  const { permission, loading: cargandoPush, suscribirNotificaciones } = usePushNotifications(empresaId);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [puedeUsarTurnos, setPuedeUsarTurnos] = useState(false);
  const [puedeUsarPresupuestos, setPuedeUsarPresupuestos] = useState(false);
  const [puedeUsarProductosAvanzados, setPuedeUsarProductosAvanzados] = useState(false);
  const [puedeUsarIA, setPuedeUsarIA] = useState(false);
  const [nombrePlanActual, setNombrePlanActual] = useState("");

  // INFORMACIÓN DEL NEGOCIO
  const [nombre, setNombre] = useState("");
  const [rubro, setRubro] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [horarios, setHorarios] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  // PÁGINA PÚBLICA
  const [paginaSlug, setPaginaSlug] = useState("");
  const [paginaPublicada, setPaginaPublicada] = useState(false);
  const [paginaTitulo, setPaginaTitulo] = useState("");
  const [paginaSubtitulo, setPaginaSubtitulo] = useState("");
  const [paginaTextoSecundario, setPaginaTextoSecundario] = useState("");
  const [paginaColorPrincipal, setPaginaColorPrincipal] = useState("#2563eb");
  const [paginaTema, setPaginaTema] = useState<TemaPagina>("oscuro");
  const [paginaTipografia, setPaginaTipografia] = useState("inter");
  const [paginaMostrarLogoHeader, setPaginaMostrarLogoHeader] = useState(true);
  const [paginaLogoUrl, setPaginaLogoUrl] = useState("");
  const [paginaLogoOscuroUrl, setPaginaLogoOscuroUrl] = useState("");

  // MULTIMEDIA HERO (8 SLOTS PARA HERO DE PARALAJE)
  const [multimediaHero, setMultimediaHero] = useState<ElementoHero[]>([]);

  const [paginaGaleria, setPaginaGaleria] = useState<string[]>([]);
  const [subiendoImagen, setSubiendoImagen] = useState<
    "logo" | "logoOscuro" | "heroSlot" | "galeria" | null
  >(null);
  const [slotIndexSubiendo, setSlotIndexSubiendo] = useState<number | null>(null);

  const [paginaMostrarWhatsApp, setPaginaMostrarWhatsApp] = useState(true);
  const [paginaMostrarEmail, setPaginaMostrarEmail] = useState(true);
  const [paginaMostrarDireccion, setPaginaMostrarDireccion] = useState(true);
  const [paginaMostrarHorarios, setPaginaMostrarHorarios] = useState(true);
  const [paginaMostrarServicios, setPaginaMostrarServicios] = useState(true);
  const [paginaMostrarProductos, setPaginaMostrarProductos] = useState(true);
  const [paginaMostrarGaleria, setPaginaMostrarGaleria] = useState(true);
  const [paginaMostrarMapa, setPaginaMostrarMapa] = useState(true);
  const [paginaMostrarPresupuesto, setPaginaMostrarPresupuesto] = useState(true);
  const [paginaMostrarReservasMesa, setPaginaMostrarReservasMesa] = useState(false);
  const [paginaMostrarPedidosOnline, setPaginaMostrarPedidosOnline] = useState(false);
  const [paginaMostrarContacto, setPaginaMostrarContacto] = useState(true);

  const [paginaTestimonios, setPaginaTestimonios] = useState<TestimonioPagina[]>([]);
  const [testimonioNombre, setTestimonioNombre] = useState("");
  const [testimonioCargo, setTestimonioCargo] = useState("");
  const [testimonioTexto, setTestimonioTexto] = useState("");

  const [paginaPreguntasFrecuentes, setPaginaPreguntasFrecuentes] = useState<PreguntaFrecuentePagina[]>([]);
  const [preguntaFrecuentePregunta, setPreguntaFrecuentePregunta] = useState("");
  const [preguntaFrecuenteRespuesta, setPreguntaFrecuenteRespuesta] = useState("");

  // IA
  const [personalidad, setPersonalidad] = useState("Amable, profesional y breve");
  const [objetivo, setObjetivo] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [restricciones, setRestricciones] = useState("No inventar información que no esté cargada.");
  const [idioma, setIdioma] = useState("Español");

  // WIDGET
  const [nombreBot, setNombreBot] = useState("Asistente virtual");
  const [mensajeBienvenida, setMensajeBienvenida] = useState("¡Hola! ¿En qué puedo ayudarte?");
  const [colorPrincipal, setColorPrincipal] = useState("#3b82f6");
  const [tema, setTema] = useState<TemaWidget>("oscuro");
  const [posicion, setPosicion] = useState<PosicionWidget>("derecha");
  const [formaBoton, setFormaBoton] = useState<FormaWidget>("redondo");
  const [textoPlaceholder, setTextoPlaceholder] = useState("Escribí tu mensaje...");
  const [mostrarMarca, setMostrarMarca] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!empresaId) {
        setError("No se encontró el ID de la empresa.");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setLoading(true);
      setError("");

      try {
        const empresaReferencia = doc(db, "companies", empresaId);
        const empresaSnapshot = await getDoc(empresaReferencia);

        if (!empresaSnapshot.exists()) {
          setError("La empresa no existe.");
          return;
        }

        const empresa = empresaSnapshot.data() as Empresa;

        const accesoTurnos = empresaTieneFuncion(empresa, "turnos");
        const accesoPresupuestos = empresaTieneFuncion(empresa, "presupuestos");
        const accesoProductosAvanzados = empresaTieneFuncion(empresa, "productos");
        const accesoIA = empresaTieneFuncion(empresa, "asistente_ia");

        setPuedeUsarTurnos(accesoTurnos);
        setPuedeUsarPresupuestos(accesoPresupuestos);
        setPuedeUsarProductosAvanzados(accesoProductosAvanzados);
        setPuedeUsarIA(accesoIA);

        setNombrePlanActual(
          obtenerNombrePlan(obtenerPlanEfectivo(empresa)),
        );

        const esDueno = empresa.userId === currentUser.uid;
        let esMiembroActivo = false;

        if (!esDueno) {
          const miembroRef = doc(db, "companies", empresaId, "members", currentUser.uid);
          const miembroSnap = await getDoc(miembroRef);
          if (miembroSnap.exists()) {
            const miembroData = miembroSnap.data() as { estado?: string };
            esMiembroActivo = miembroData.estado === "activo";
          }
        }

        if (!esDueno && !esMiembroActivo) {
          setError("No tenés permiso para acceder a esta empresa.");
          return;
        }

        setPaginaMostrarLogoHeader(empresa.paginaPublica?.mostrarLogoHeader ?? true);
        setNombre(empresa.nombre || "");
        setRubro(empresa.rubro || "");
        setEmail(empresa.email || "");
        setTelefono(empresa.telefono || "");
        setDescripcion(empresa.descripcion || "");
        setDireccion(empresa.direccion || "");
        setHorarios(empresa.horarios || "");
        setInstagram(empresa.redesSociales?.instagram || "");
        setFacebook(empresa.redesSociales?.facebook || "");
        setTiktok(empresa.redesSociales?.tiktok || "");

        // PÁGINA PÚBLICA
        const slugExistente = empresa.paginaPublica?.slug || "";
        const slugInicial = slugExistente || crearSlug(`${empresa.nombre || "negocio"}-${empresaId.slice(-6)}`);

        setPaginaSlug(slugInicial);
        setPaginaPublicada(empresa.paginaPublica?.publicada ?? false);
        setPaginaTitulo(empresa.paginaPublica?.titulo || empresa.nombre || "");
        setPaginaSubtitulo(empresa.paginaPublica?.subtitulo || "");
        setPaginaTextoSecundario(empresa.paginaPublica?.textoSecundario || "");
        setPaginaColorPrincipal(empresa.paginaPublica?.colorPrincipal || "#2563eb");
        setPaginaTema(empresa.paginaPublica?.tema === "claro" ? "claro" : "oscuro");
        setPaginaLogoUrl(empresa.paginaPublica?.logoUrl || "");
        setPaginaLogoOscuroUrl(empresa.paginaPublica?.logoOscuroUrl || "");
        setPaginaTipografia(empresa.paginaPublica?.tipografia || "inter");

        // CARGAR MULTIMEDIA HERO (HASTA 8 SLOTS)
        if (Array.isArray(empresa.paginaPublica?.multimediaHero)) {
          setMultimediaHero(empresa.paginaPublica!.multimediaHero!.slice(0, 8));
        } else {
          // Migración suave: Si tenía portadas antiguas, las convierte a la lista multimedial
          const antiguasPortadas = [
            empresa.paginaPublica?.portadaUrl,
            empresa.paginaPublica?.portadaUrl2,
            empresa.paginaPublica?.portadaUrl3,
            empresa.paginaPublica?.portadaUrl4,
            empresa.paginaPublica?.portadaUrl5,
            empresa.paginaPublica?.portadaUrl6,
          ].filter((url): url is string => Boolean(url && url.trim().length > 0));

          setMultimediaHero(
            antiguasPortadas.map((url) => ({ url, tipo: "imagen" }))
          );
        }

        setPaginaGaleria(
          Array.isArray(empresa.paginaPublica?.galeria)
            ? empresa.paginaPublica!.galeria!.filter((url): url is string => typeof url === "string" && url.trim().length > 0).slice(0, 10)
            : [],
        );

        setPaginaMostrarWhatsApp(empresa.paginaPublica?.mostrarWhatsApp ?? true);
        setPaginaMostrarEmail(empresa.paginaPublica?.mostrarEmail ?? true);
        setPaginaMostrarDireccion(empresa.paginaPublica?.mostrarDireccion ?? true);
        setPaginaMostrarHorarios(empresa.paginaPublica?.mostrarHorarios ?? true);
        setPaginaMostrarServicios(empresa.paginaPublica?.mostrarServicios ?? true);
        setPaginaMostrarProductos(empresa.paginaPublica?.mostrarProductos ?? true);
        setPaginaMostrarGaleria(empresa.paginaPublica?.mostrarGaleria ?? true);
        setPaginaMostrarMapa(empresa.paginaPublica?.mostrarMapa ?? true);
        setPaginaMostrarPresupuesto(accesoPresupuestos ? empresa.paginaPublica?.mostrarPresupuesto ?? true : false);
        setPaginaMostrarReservasMesa(accesoTurnos ? empresa.paginaPublica?.mostrarReservasMesa ?? false : false);
        setPaginaMostrarPedidosOnline(accesoProductosAvanzados ? empresa.paginaPublica?.mostrarPedidosOnline ?? false : false);
        setPaginaMostrarContacto(empresa.paginaPublica?.mostrarContacto ?? true);

        setPaginaTestimonios(
          Array.isArray(empresa.paginaPublica?.testimonios)
            ? empresa.paginaPublica!.testimonios!
                .filter((item) => item && typeof item.nombre === "string" && typeof item.texto === "string")
                .map((item) => ({
                  nombre: item.nombre.trim(),
                  cargo: item.cargo?.trim() || "",
                  texto: item.texto.trim(),
                }))
                .filter((item) => item.nombre && item.texto)
                .slice(0, 6)
            : [],
        );

        setPaginaPreguntasFrecuentes(
          Array.isArray(empresa.paginaPublica?.preguntasFrecuentes)
            ? empresa.paginaPublica!.preguntasFrecuentes!
                .filter((item) => item && typeof item.pregunta === "string" && typeof item.respuesta === "string")
                .map((item) => ({
                  pregunta: item.pregunta.trim(),
                  respuesta: item.respuesta.trim(),
                }))
                .filter((item) => item.pregunta && item.respuesta)
                .slice(0, 8)
            : [],
        );

        // IA
        setPersonalidad(empresa.personalidad || "Amable, profesional y breve");
        setObjetivo(empresa.objetivo || "");
        setInstrucciones(empresa.instrucciones || "");
        setRestricciones(empresa.restricciones || "No inventar información que no esté cargada.");
        setIdioma(empresa.idioma || "Español");

        // WIDGET
        setNombreBot(empresa.widget?.nombreBot || empresa.nombre || "Asistente virtual");
        setMensajeBienvenida(empresa.widget?.mensajeBienvenida || "¡Hola! ¿En qué puedo ayudarte?");
        setColorPrincipal(empresa.widget?.colorPrincipal || "#3b82f6");
        setTema(empresa.widget?.tema || "oscuro");
        setPosicion(empresa.widget?.posicion || "derecha");
        setFormaBoton(empresa.widget?.formaBoton || "redondo");
        setTextoPlaceholder(empresa.widget?.textoPlaceholder || "Escribí tu mensaje...");
        setMostrarMarca(empresa.widget?.mostrarMarca ?? true);
      } catch (firebaseError) {
        console.error("Error al cargar la empresa:", firebaseError);
        setError("No se pudo cargar la empresa.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [empresaId, router]);

  const urlPublica = paginaSlug ? `/negocio/${paginaSlug}` : "";

  // FUNCIÓN DE SUBIDA ADAPTADA A FOTOS Y VIDEOS
  const subirArchivoPagina = async (
    archivo: File,
    destino: "logo" | "logoOscuro" | "heroSlot" | "galeria",
    targetSlotIndex?: number
  ) => {
    if (!user || !empresaId) return;

    const esVideo = archivo.type.startsWith("video/");
    const esImagen = archivo.type.startsWith("image/");

    if (!esImagen && !esVideo) {
      setError("Seleccioná un archivo válido (JPG, PNG, WebP o video MP4/WebM).");
      return;
    }

    const TAMANO_MAXIMO = esVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
    if (archivo.size > TAMANO_MAXIMO) {
      setError(esVideo ? "El video no puede superar los 25 MB." : "La imagen no puede superar los 10 MB.");
      return;
    }

    if (destino === "galeria" && paginaGaleria.length >= 10) {
      setError("Podés cargar hasta 10 imágenes en la galería.");
      return;
    }

    setError("");
    setMensaje("");
    setSubiendoImagen(destino);
    if (typeof targetSlotIndex === "number") setSlotIndexSubiendo(targetSlotIndex);

    try {
      const idToken = await user.getIdToken();
      const authResponse = await fetch(
        `/api/imagekit/auth?empresaId=${encodeURIComponent(empresaId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        },
      );

      const authData = (await authResponse.json()) as {
        token?: string;
        expire?: number;
        signature?: string;
        publicKey?: string;
        urlEndpoint?: string;
        error?: string;
      };

      if (!authResponse.ok) {
        throw new Error(authData.error || "No se pudo autorizar la subida.");
      }

      if (!authData.token || !authData.expire || !authData.signature || !authData.publicKey) {
        throw new Error("Credenciales de subida incompletas recibidas del servidor.");
      }

      const extension =
        archivo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (esVideo ? "mp4" : "jpg");
      const baseNombre =
        archivo.name
          .replace(/\.[^.]+$/, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9_-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) || destino;

      const fileName = `${destino}-${Date.now()}-${baseNombre}.${extension}`;

      const formData = new FormData();
      formData.append("file", archivo);
      formData.append("fileName", fileName);
      formData.append("publicKey", authData.publicKey);
      formData.append("token", authData.token);
      formData.append("expire", String(authData.expire));
      formData.append("signature", authData.signature);
      formData.append("useUniqueFileName", "true");
      formData.append("folder", `/ndi-ai/companies/${empresaId}/public-page`);

      const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as {
        url?: string;
        message?: string;
        error?: string;
      };

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || uploadData.error || "ImageKit rechazó el archivo.");
      }

      const url = uploadData.url?.trim();
      if (!url) throw new Error("ImageKit no devolvió la URL del archivo.");

      if (destino === "logo") {
        setPaginaLogoUrl(url);
      } else if (destino === "logoOscuro") {
        setPaginaLogoOscuroUrl(url);
      } else if (destino === "heroSlot" && typeof targetSlotIndex === "number") {
        const copia = [...multimediaHero];
        copia[targetSlotIndex] = { url, tipo: esVideo ? "video" : "imagen" };
        setMultimediaHero(copia.slice(0, 8));
      } else if (destino === "galeria") {
        setPaginaGaleria((actual) => [...actual, url].slice(0, 10));
      }

      setMensaje("Archivo cargado con éxito. Hacé clic en 'Guardar cambios' para aplicarlo.");
    } catch (uploadError) {
      console.error("Error al subir archivo:", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Error al procesar el archivo.");
    } finally {
      setSubiendoImagen(null);
      setSlotIndexSubiendo(null);
    }
  };

  const quitarSlotHero = (index: number) => {
    const copia = [...multimediaHero];
    copia.splice(index, 1);
    setMultimediaHero(copia);
  };

  const quitarImagenGaleria = (indice: number) => {
    setPaginaGaleria((actual) => actual.filter((_, index) => index !== indice));
  };

  const agregarTestimonio = () => {
    const nombreLimpio = testimonioNombre.trim();
    const textoLimpio = testimonioTexto.trim();

    if (!nombreLimpio || !textoLimpio) {
      setError("Completá el nombre y el testimonio.");
      return;
    }

    if (paginaTestimonios.length >= 6) {
      setError("Podés mostrar hasta 6 testimonios.");
      return;
    }

    setPaginaTestimonios((actual) => [
      ...actual,
      {
        nombre: nombreLimpio.slice(0, 80),
        cargo: testimonioCargo.trim().slice(0, 100),
        texto: textoLimpio.slice(0, 500),
      },
    ]);

    setTestimonioNombre("");
    setTestimonioCargo("");
    setTestimonioTexto("");
    setError("");
  };

  const quitarTestimonio = (indice: number) => {
    setPaginaTestimonios((actual) => actual.filter((_, index) => index !== indice));
  };

  const agregarPreguntaFrecuente = () => {
    const preguntaLimpia = preguntaFrecuentePregunta.trim();
    const respuestaLimpia = preguntaFrecuenteRespuesta.trim();

    if (!preguntaLimpia || !respuestaLimpia) {
      setError("Completá la pregunta y la respuesta.");
      return;
    }

    if (paginaPreguntasFrecuentes.length >= 8) {
      setError("Podés mostrar hasta 8 preguntas frecuentes.");
      return;
    }

    setPaginaPreguntasFrecuentes((actual) => [
      ...actual,
      {
        pregunta: preguntaLimpia.slice(0, 160),
        respuesta: respuestaLimpia.slice(0, 700),
      },
    ]);

    setPreguntaFrecuentePregunta("");
    setPreguntaFrecuenteRespuesta("");
    setError("");
  };

  const quitarPreguntaFrecuente = (indice: number) => {
    setPaginaPreguntasFrecuentes((actual) => actual.filter((_, index) => index !== indice));
  };

  const cambiarPublicacionPagina = async (publicada: boolean) => {
    if (!empresaId) return;

    setPaginaPublicada(publicada);
    setError("");
    setMensaje("");

    try {
      await updateDoc(doc(db, "companies", empresaId), {
        "paginaPublica.publicada": publicada,
        updatedAt: serverTimestamp(),
      });

      setMensaje(publicada ? "Página publicada correctamente." : "Página despublicada.");
    } catch (publicacionError) {
      console.error("Error cambiando publicación de la página:", publicacionError);
      setPaginaPublicada(!publicada);
      setError("No se pudo cambiar el estado de la página.");
    }
  };

  const handleGuardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !empresaId) return;

    if (!nombre.trim()) {
      setError("Ingresá el nombre de la empresa.");
      return;
    }

    if (puedeUsarIA && !nombreBot.trim()) {
      setError("Ingresá el nombre del bot.");
      return;
    }

    const slugLimpio = crearSlug(paginaSlug);
    if (!slugLimpio) {
      setError("Ingresá una URL válida para la página pública.");
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const idToken = await user.getIdToken();
      const slugResponse = await fetch("/api/companies/slug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          empresaId,
          slug: slugLimpio,
        }),
      });

      const slugData = (await slugResponse.json()) as {
        disponible?: boolean;
        slug?: string;
        error?: string;
      };

      if (!slugResponse.ok || slugData.disponible !== true) {
        throw new Error(slugData.error || "No se pudo verificar la URL pública.");
      }

      const slugConfirmado = slugData.slug || slugLimpio;
      const empresaReferencia = doc(db, "companies", empresaId);

      // Mapear compatibilidad con versiones anteriores si existe la primera portada
      const primeraPortada = multimediaHero.find((m) => m.tipo === "imagen")?.url || "";

      const datosActualizar = {
        nombre: nombre.trim(),
        rubro: rubro.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        horarios: horarios.trim(),

        "redesSociales.instagram": instagram.trim(),
        "redesSociales.facebook": facebook.trim(),
        "redesSociales.tiktok": tiktok.trim(),

        "paginaPublica.publicada": paginaPublicada,
        "paginaPublica.titulo": paginaTitulo.trim() || nombre.trim(),
        "paginaPublica.subtitulo": paginaSubtitulo.trim(),
        "paginaPublica.textoSecundario": paginaTextoSecundario.trim(),
        "paginaPublica.colorPrincipal": paginaColorPrincipal,
        "paginaPublica.tema": paginaTema,
        "paginaPublica.tipografia": paginaTipografia,
        "paginaPublica.logoUrl": paginaLogoUrl,
        "paginaPublica.logoOscuroUrl": paginaLogoOscuroUrl,

        // GUARDADO DE LAS 8 RANURAS MULTIMEDIALES (FOTOS Y VIDEOS)
        "paginaPublica.multimediaHero": multimediaHero.slice(0, 8),
        "paginaPublica.portadaUrl": primeraPortada,

        "paginaPublica.galeria": paginaGaleria,
        "paginaPublica.mostrarWhatsApp": paginaMostrarWhatsApp,
        "paginaPublica.mostrarEmail": paginaMostrarEmail,
        "paginaPublica.mostrarDireccion": paginaMostrarDireccion,
        "paginaPublica.mostrarHorarios": paginaMostrarHorarios,
        "paginaPublica.mostrarServicios": paginaMostrarServicios,
        "paginaPublica.mostrarProductos": paginaMostrarProductos,
        "paginaPublica.mostrarGaleria": paginaMostrarGaleria,
        "paginaPublica.mostrarMapa": paginaMostrarMapa,
        "paginaPublica.mostrarPresupuesto": puedeUsarPresupuestos ? paginaMostrarPresupuesto : false,
        "paginaPublica.mostrarReservasMesa": puedeUsarTurnos ? paginaMostrarReservasMesa : false,
        "paginaPublica.mostrarPedidosOnline": puedeUsarProductosAvanzados ? paginaMostrarPedidosOnline : false,
        "paginaPublica.mostrarContacto": paginaMostrarContacto,
        "paginaPublica.testimonios": paginaTestimonios,
        "paginaPublica.preguntasFrecuentes": paginaPreguntasFrecuentes,
        "paginaPublica.mostrarLogoHeader": paginaMostrarLogoHeader,

        updatedAt: serverTimestamp(),
      };

      const datosIA = puedeUsarIA
        ? {
            personalidad: personalidad.trim(),
            objetivo: objetivo.trim(),
            instrucciones: instrucciones.trim(),
            restricciones: restricciones.trim(),
            idioma,
            "widget.nombreBot": nombreBot.trim(),
            "widget.mensajeBienvenida": mensajeBienvenida.trim(),
            "widget.colorPrincipal": colorPrincipal,
            "widget.tema": tema,
            "widget.posicion": posicion,
            "widget.formaBoton": formaBoton,
            "widget.textoPlaceholder": textoPlaceholder.trim(),
            "widget.mostrarMarca": mostrarMarca,
          }
        : {};

      await updateDoc(empresaReferencia, {
        ...datosActualizar,
        ...datosIA,
      });

      setPaginaSlug(slugConfirmado);
      setMensaje("Configuración guardada correctamente.");
    } catch (firebaseError) {
      console.error("Error al guardar:", firebaseError);
      setError(firebaseError instanceof Error ? firebaseError.message : "No se pudo guardar la configuración.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
          <p className="font-medium text-slate-950 dark:text-white">
            Cargando configuración...
          </p>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
            Estamos preparando tu negocio.
          </p>
        </Card>
      </section>
    );
  }

  if (error && !nombre) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/10">
          <Badge variant="danger">Error de acceso</Badge>
          <h1 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
            No pudimos abrir esta empresa
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button
            className="mt-6"
            variant="secondary"
            onClick={() => router.push("/empresas")}
          >
            Volver a empresas
          </Button>
        </Card>
      </section>
    );
  }

  const rubroNormalizado = rubro.trim().toLowerCase();
  const esRestaurante = rubroNormalizado === "restaurante" || rubroNormalizado === "restaurant";

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-4 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-5 lg:flex-row lg:items-center">
        <div>
          <button
            type="button"
            onClick={() => router.push("/empresas")}
            className="mb-2 text-[11px] text-slate-500 transition hover:text-slate-950 dark:text-zinc-500 dark:hover:text-white sm:mb-4 sm:text-sm"
          >
            ← Volver a empresas
          </button>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Mi página
            </h1>

            <Badge variant="success">Activo</Badge>

            {nombrePlanActual && (
              <Badge variant="info">{nombrePlanActual}</Badge>
            )}
          </div>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
            Configurá la información y la página pública de {nombre}. Todo lo que ajustes acá define lo que verán tus clientes.
          </p>
        </div>

        <Card className="hidden items-center gap-3 px-4 py-3 sm:flex">
          <Avatar
            name={user?.displayName || user?.email || "Usuario"}
            src={user?.photoURL || undefined}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
              {user?.displayName || "Administrador"}
            </p>
            <p className="max-w-56 truncate text-xs text-slate-500 dark:text-zinc-500">
              {user?.email}
            </p>
          </div>
        </Card>
      </header>

      {/* GUÍA DE BIENVENIDA Y PRIMEROS PASOS */}
      <OnboardingCard empresaId={empresaId} />

      {/* TARJETA DE VINCULACIÓN DE ALERTAS AL CELULAR */}
      <Card className="mb-4 overflow-hidden border-blue-500/30 bg-blue-500/5 p-4 sm:mb-6 sm:p-6 lg:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm sm:p-3">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                  Alertas Push en el Celular
                </h2>
                <Badge variant={permission === "granted" ? "success" : "info"}>
                  {permission === "granted" ? "Permitido" : "Pendiente"}
                </Badge>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-600 dark:text-zinc-400">
                Vinculá este dispositivo para que el teléfono te suene y vibre automáticamente con cada reserva, pedido o turno entrante.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              type="button"
              onClick={suscribirNotificaciones}
              disabled={cargandoPush}
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Smartphone className="h-4 w-4" />
              {cargandoPush ? "Vinculando..." : "Vincular este celular"}
            </Button>
          </div>
        </div>
      </Card>

      <form
        onSubmit={handleGuardar}
        className="space-y-3 sm:space-y-6"
      >
        {/* INFORMACIÓN DEL NEGOCIO */}
        <Card className="overflow-hidden">
          <SectionHeader
            title="Información del negocio"
            description="Datos generales del negocio que pueden mostrarse en tu página pública."
            right={
              rubro ? (
                <Badge variant="info">{rubro}</Badge>
              ) : undefined
            }
          />

          <div className="grid gap-3 p-4 sm:gap-5 sm:p-6 md:grid-cols-2">
            <Input
              id="nombre"
              label="Nombre de la empresa"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <Input
              id="rubro"
              label="Rubro"
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              required
            />

            <Input
              id="email"
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empresa@correo.com"
            />

            <Input
              id="telefono"
              label="Teléfono o WhatsApp"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+54 9 388..."
            />

            <Input
              id="direccion"
              label="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección del negocio"
            />

            <Input
              id="instagram"
              label="Instagram"
              type="url"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/tu_negocio"
            />

            <Input
              id="facebook"
              label="Facebook"
              type="url"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/tu_negocio"
            />

            <Input
              id="tiktok"
              label="TikTok"
              type="url"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@tu_negocio"
            />

            <div className="md:col-span-2">
              <TextArea
                id="descripcion"
                label="Descripción del negocio"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explicá qué hace la empresa, qué vende y a qué clientes atiende."
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                id="horarios"
                label="Horarios de atención"
                value={horarios}
                onChange={(e) => setHorarios(e.target.value)}
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
                <Badge variant="success">Publicada</Badge>
              ) : (
                <Badge variant="info">Borrador</Badge>
              )
            }
          />

          <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_360px]">
            <div className="grid content-start gap-3 sm:gap-5 md:grid-cols-2">
              <Input
                id="paginaTitulo"
                label="Título de la página"
                value={paginaTitulo}
                onChange={(e) => setPaginaTitulo(e.target.value)}
                placeholder="Nombre que verá el cliente"
              />

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="paginaSlug"
                  className="block text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm"
                >
                  Dirección de la página
                </label>

                <div className="overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-xl">
                  <div className="flex items-center">
                    <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[10px] text-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-500 sm:px-3 sm:py-3 sm:text-xs">
                      /negocio/
                    </span>

                    <input
                      id="paginaSlug"
                      value={paginaSlug}
                      onChange={(e) => setPaginaSlug(crearSlug(e.target.value))}
                      className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-xs text-slate-900 outline-none dark:text-white sm:px-3 sm:py-3 sm:text-sm"
                      placeholder="mi-negocio"
                    />
                  </div>
                </div>

                <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs">
                  Esta será la URL pública de tu negocio.
                </p>
              </div>

              <div className="md:col-span-2">
                <TextArea
                  id="paginaSubtitulo"
                  label="Texto principal"
                  value={paginaSubtitulo}
                  onChange={(e) => setPaginaSubtitulo(e.target.value)}
                  placeholder="Ejemplo: Tu estilo, en manos de profesionales."
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  id="paginaTextoSecundario"
                  label="Texto secundario"
                  value={paginaTextoSecundario}
                  onChange={(e) => setPaginaTextoSecundario(e.target.value)}
                  placeholder="Ejemplo: Cortes clásicos, fades y barba con atención personalizada y reserva online."
                />
              </div>

              {/* LOGOS DE LA MARCA */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white sm:text-sm">
                    Logos de la marca
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs">
                    Cargá el logo principal y la variante para fondos claros.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-2 lg:max-w-2xl">
                  <ImagenUploader
                    titulo="Logo claro / principal"
                    descripcion="PNG, JPG o WebP (cuadrado)."
                    imagenUrl={paginaLogoUrl}
                    cargando={subiendoImagen === "logo"}
                    onSeleccionar={(archivo) => void subirArchivoPagina(archivo, "logo")}
                    onQuitar={() => setPaginaLogoUrl("")}
                    aspectClass="aspect-square max-w-[180px]"
                  />

                  <ImagenUploader
                    titulo="Logo secundario (Oscuro)"
                    descripcion="PNG, JPG o WebP (cuadrado)."
                    imagenUrl={paginaLogoOscuroUrl}
                    cargando={subiendoImagen === "logoOscuro"}
                    onSeleccionar={(archivo) => void subirArchivoPagina(archivo, "logoOscuro")}
                    onQuitar={() => setPaginaLogoOscuroUrl("")}
                    aspectClass="aspect-square max-w-[180px]"
                  />
                </div>
              </div>

              {/* NUEVA SECCIÓN: 8 SLOTS MULTIMEDIALES (FOTOS Y VIDEOS) */}
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 sm:text-sm">
                      Efecto paralaje: 8 Ranuras Multimediales (Fotos o Videos)
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-slate-600 dark:text-zinc-400 sm:text-xs sm:leading-5">
                      Subí fotos o videos cortos en MP4. Flotarán dinámicamente alrededor de tu logo con efecto 3D en el Hero principal.
                    </p>
                  </div>

                  <Badge variant="info">
                    {multimediaHero.length}/8 slots
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const item = multimediaHero[i];
                    const estaCargando = subiendoImagen === "heroSlot" && slotIndexSubiendo === i;
                    const slotInputId = `hero-slot-input-${i}`;

                    return (
                      <div
                        key={i}
                        className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white transition hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500"
                      >
                        {item ? (
                          <>
                            {item.tipo === "video" ? (
                              <video
                                src={item.url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={item.url}
                                alt={`Slot Hero ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                            )}

                            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur">
                              {item.tipo === "video" ? <Video className="h-3 w-3 text-blue-400" /> : <ImageIcon className="h-3 w-3 text-emerald-400" />}
                              <span>{item.tipo}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => quitarSlotHero(i)}
                              className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-white transition hover:bg-red-600"
                              aria-label={`Eliminar slot ${i + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="p-2 text-center">
                            <input
                              id={slotInputId}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                              className="hidden"
                              disabled={estaCargando}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void subirArchivoPagina(f, "heroSlot", i);
                                e.target.value = "";
                              }}
                            />
                            <label
                              htmlFor={slotInputId}
                              className={`flex cursor-pointer flex-col items-center gap-1 ${
                                estaCargando ? "pointer-events-none opacity-50" : ""
                              }`}
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800">
                                <Upload className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                                {estaCargando ? "Subiendo..." : `Slot ${i + 1}`}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500">
                                + Foto / Video MP4
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN GALERÍA DEL LOCAL */}
              <div className="mt-2 md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:rounded-2xl sm:p-4">
                <div className="flex items-center justify-between gap-2 sm:flex-wrap sm:gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-950 dark:text-white sm:text-sm">
                      Galería de fotos del local
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                      {paginaGaleria.length}/10 fotos cargadas · JPG, PNG o WebP · máx. 10 MB c/u
                    </p>
                  </div>

                  <div>
                    <input
                      id="galeria-upload-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={paginaGaleria.length >= 10 || subiendoImagen === "galeria"}
                      onChange={(event) => {
                        const archivo = event.target.files?.[0];
                        if (archivo) {
                          void subirArchivoPagina(archivo, "galeria");
                        }
                        event.target.value = "";
                      }}
                    />
                    <label
                      htmlFor="galeria-upload-input"
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
                        paginaGaleria.length >= 10 || subiendoImagen === "galeria"
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {subiendoImagen === "galeria" ? "Subiendo..." : "Agregar imagen"}
                    </label>
                  </div>
                </div>

                {paginaGaleria.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:mt-4 sm:gap-3">
                    {paginaGaleria.map((url, indice) => (
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
                          onClick={() => quitarImagenGaleria(indice)}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white opacity-100 transition hover:bg-red-600 sm:right-2 sm:top-2 sm:h-8 sm:w-8 sm:rounded-lg sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Quitar imagen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40 sm:mt-4 sm:min-h-28 sm:rounded-xl sm:px-4">
                    <div>
                      <ImageIcon className="mx-auto h-6 w-6 text-slate-400 dark:text-zinc-600" />
                      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
                        Todavía no cargaste imágenes para la galería.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* TEMA Y TIPOGRAFÍA */}
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm">
                    Tema de la página
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                    Elegí la apariencia general que verán tus clientes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaginaTema("oscuro")}
                    className={`overflow-hidden rounded-xl border p-1 text-left transition sm:rounded-2xl ${
                      paginaTema === "oscuro"
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="rounded-lg bg-zinc-950 p-2.5 text-white sm:rounded-xl sm:p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-md sm:h-8 sm:w-8 sm:rounded-lg"
                          style={{ backgroundColor: paginaColorPrincipal }}
                        />
                        <div>
                          <p className="text-[11px] font-semibold sm:text-sm">Oscuro</p>
                          <p className="text-[9px] leading-3 text-zinc-500 sm:text-[11px] sm:leading-normal">
                            Moderno y de alto contraste
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 h-1.5 w-3/4 rounded-full bg-zinc-800 sm:mt-4 sm:h-2" />
                      <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-zinc-800/70 sm:mt-2 sm:h-2" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaginaTema("claro")}
                    className={`overflow-hidden rounded-xl border p-1 text-left transition sm:rounded-2xl ${
                      paginaTema === "claro"
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-950 sm:rounded-xl sm:p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-md sm:h-8 sm:w-8 sm:rounded-lg"
                          style={{ backgroundColor: paginaColorPrincipal }}
                        />
                        <div>
                          <p className="text-[11px] font-semibold sm:text-sm">Claro</p>
                          <p className="text-[9px] leading-3 text-slate-500 sm:text-[11px] sm:leading-normal">
                            Limpio y profesional
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 h-1.5 w-3/4 rounded-full bg-slate-200 sm:mt-4 sm:h-2" />
                      <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-slate-100 sm:mt-2 sm:h-2" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="paginaColorPrincipal"
                  className="block text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm"
                >
                  Color principal
                </label>

                <div className="flex gap-2 sm:gap-3">
                  <input
                    id="paginaColorPrincipal"
                    type="color"
                    value={paginaColorPrincipal}
                    onChange={(e) => setPaginaColorPrincipal(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900 sm:h-11 sm:w-14 sm:rounded-xl"
                  />

                  <input
                    value={paginaColorPrincipal}
                    onChange={(e) => setPaginaColorPrincipal(e.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm"
                  />
                </div>
              </div>

              {/* Selector de Tipografía */}
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="paginaTipografia"
                  className="block text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm"
                >
                  Tipografía
                </label>
                <select
                  id="paginaTipografia"
                  value={paginaTipografia}
                  onChange={(e) => setPaginaTipografia(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
                >
                  <option value="inter">Inter — Moderna y limpia</option>
                  <option value="poppins">Poppins — Moderna y amigable</option>
                  <option value="montserrat">Montserrat — Fuerte y comercial</option>
                  <option value="manrope">Manrope — Premium y minimalista</option>
                  <option value="dm-sans">DM Sans — Simple y equilibrada</option>
                  <option value="playfair">Playfair Display — Elegante</option>
                  <option value="lora">Lora — Editorial y cálida</option>
                  <option value="oswald">Oswald — Urbana y llamativa</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:gap-4 sm:rounded-xl sm:p-4">
                <div>
                  <p className="text-xs font-medium text-slate-950 dark:text-white sm:text-sm">
                    Publicar página
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                    Permitirá que cualquier cliente pueda verla.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={paginaPublicada}
                  onChange={(e) => {
                    void cambiarPublicacionPagina(e.target.checked);
                  }}
                  className="h-5 w-5 accent-blue-500"
                />
              </label>

              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-medium text-slate-700 dark:text-zinc-200 sm:mb-3 sm:text-sm">
                  Información visible
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <ToggleOpcion
                    titulo="WhatsApp"
                    descripcion="Mostrar botón de contacto."
                    checked={paginaMostrarWhatsApp}
                    onChange={setPaginaMostrarWhatsApp}
                  />

                  <ToggleOpcion
                    titulo="Logo en menú"
                    descripcion="Mostrar el logo en la barra superior."
                    checked={paginaMostrarLogoHeader}
                    onChange={setPaginaMostrarLogoHeader}
                  />

                  <ToggleOpcion
                    titulo="Correo"
                    descripcion="Mostrar correo del negocio."
                    checked={paginaMostrarEmail}
                    onChange={setPaginaMostrarEmail}
                  />

                  <ToggleOpcion
                    titulo="Dirección"
                    descripcion="Mostrar ubicación del negocio."
                    checked={paginaMostrarDireccion}
                    onChange={setPaginaMostrarDireccion}
                  />

                  <ToggleOpcion
                    titulo="Horarios"
                    descripcion="Mostrar horarios de atención."
                    checked={paginaMostrarHorarios}
                    onChange={setPaginaMostrarHorarios}
                  />

                  <ToggleOpcion
                    titulo="Servicios"
                    descripcion="Mostrar la sección de servicios."
                    checked={paginaMostrarServicios}
                    onChange={setPaginaMostrarServicios}
                  />

                  <ToggleOpcion
                    titulo={esRestaurante ? "Carta" : "Productos"}
                    descripcion={
                      esRestaurante
                        ? "Mostrar la carta del restaurante."
                        : "Mostrar la sección de productos."
                    }
                    checked={paginaMostrarProductos}
                    onChange={setPaginaMostrarProductos}
                  />

                  <ToggleOpcion
                    titulo="Galería"
                    descripcion="Mostrar las imágenes del negocio."
                    checked={paginaMostrarGaleria}
                    onChange={setPaginaMostrarGaleria}
                  />

                  <ToggleOpcion
                    titulo="Mapa"
                    descripcion="Mostrar el mapa y la ubicación."
                    checked={paginaMostrarMapa}
                    onChange={setPaginaMostrarMapa}
                  />

                  <ToggleOpcion
                    titulo="Presupuesto"
                    descripcion={
                      puedeUsarPresupuestos
                        ? "Mostrar el formulario de cotización."
                        : "Disponible desde Página Completa."
                    }
                    checked={paginaMostrarPresupuesto}
                    onChange={setPaginaMostrarPresupuesto}
                    disabled={!puedeUsarPresupuestos}
                    bloqueoTexto="Página Completa"
                  />

                  {esRestaurante && (
                    <>
                      <ToggleOpcion
                        titulo="Reservas de mesa"
                        descripcion={
                          puedeUsarTurnos
                            ? "Permitir que los clientes soliciten una mesa desde la página."
                            : "Disponible desde Página Completa."
                        }
                        checked={paginaMostrarReservasMesa}
                        onChange={setPaginaMostrarReservasMesa}
                        disabled={!puedeUsarTurnos}
                        bloqueoTexto="Página Completa"
                      />

                      <ToggleOpcion
                        titulo="Pedidos online"
                        descripcion={
                          puedeUsarProductosAvanzados
                            ? "Permitir armar un pedido desde la carta para retirar en el local."
                            : "Disponible desde Página Completa."
                        }
                        checked={paginaMostrarPedidosOnline}
                        onChange={setPaginaMostrarPedidosOnline}
                        disabled={!puedeUsarProductosAvanzados}
                        bloqueoTexto="Página Completa"
                      />
                    </>
                  )}

                  <ToggleOpcion
                    titulo="Formulario de contacto"
                    descripcion="Permitir consultas desde la página."
                    checked={paginaMostrarContacto}
                    onChange={setPaginaMostrarContacto}
                  />
                </div>
              </div>

              {/* TESTIMONIOS */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:space-y-4 sm:rounded-2xl sm:p-5 md:col-span-2">
                <div>
                  <div className="flex items-center justify-between gap-2 sm:flex-wrap sm:gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-950 dark:text-white sm:text-sm">
                        Testimonios
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                        Agregá reseñas reales de clientes para generar más confianza.
                      </p>
                    </div>

                    <Badge variant="info">
                      {paginaTestimonios.length}/6
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
                  <Input
                    id="testimonioNombre"
                    label="Nombre del cliente"
                    value={testimonioNombre}
                    onChange={(e) => setTestimonioNombre(e.target.value)}
                    placeholder="Ejemplo: María Gómez"
                  />

                  <Input
                    id="testimonioCargo"
                    label="Detalle opcional"
                    value={testimonioCargo}
                    onChange={(e) => setTestimonioCargo(e.target.value)}
                    placeholder="Ejemplo: Cliente frecuente"
                  />

                  <div className="md:col-span-2">
                    <TextArea
                      id="testimonioTexto"
                      label="Testimonio"
                      value={testimonioTexto}
                      onChange={(e) => setTestimonioTexto(e.target.value)}
                      placeholder="Contá qué dijo el cliente sobre el negocio."
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={agregarTestimonio}
                      disabled={paginaTestimonios.length >= 6}
                    >
                      Agregar testimonio
                    </Button>
                  </div>
                </div>

                {paginaTestimonios.length > 0 ? (
                  <div className="grid gap-3">
                    {paginaTestimonios.map((testimonio, index) => (
                      <div
                        key={`${testimonio.nombre}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:gap-4 sm:rounded-xl sm:p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-white">
                            {testimonio.nombre}
                          </p>
                          {testimonio.cargo && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-500">
                              {testimonio.cargo}
                            </p>
                          )}
                          <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                            {testimonio.texto}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => quitarTestimonio(index)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 sm:h-9 sm:w-9"
                          aria-label="Eliminar testimonio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs">
                    Todavía no agregaste testimonios.
                  </p>
                )}
              </div>

              {/* PREGUNTAS FRECUENTES */}
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:space-y-4 sm:rounded-2xl sm:p-5 md:col-span-2">
                <div className="flex items-center justify-between gap-2 sm:flex-wrap sm:gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-950 dark:text-white sm:text-sm">
                      Preguntas frecuentes
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                      Mostrá respuestas rápidas a las dudas más comunes del negocio.
                    </p>
                  </div>

                  <Badge variant="info">
                    {paginaPreguntasFrecuentes.length}/8
                  </Badge>
                </div>

                <div className="grid gap-3">
                  <Input
                    id="preguntaFrecuentePregunta"
                    label="Pregunta"
                    value={preguntaFrecuentePregunta}
                    onChange={(e) => setPreguntaFrecuentePregunta(e.target.value)}
                    placeholder="Ejemplo: ¿Trabajan con turno previo?"
                  />

                  <TextArea
                    id="preguntaFrecuenteRespuesta"
                    label="Respuesta"
                    value={preguntaFrecuenteRespuesta}
                    onChange={(e) => setPreguntaFrecuenteRespuesta(e.target.value)}
                    placeholder="Ejemplo: Sí, podés reservar desde esta misma página."
                  />

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={agregarPreguntaFrecuente}
                      disabled={paginaPreguntasFrecuentes.length >= 8}
                    >
                      Agregar pregunta
                    </Button>
                  </div>
                </div>

                {paginaPreguntasFrecuentes.length > 0 ? (
                  <div className="grid gap-3">
                    {paginaPreguntasFrecuentes.map((item, index) => (
                      <div
                        key={`${item.pregunta}-${index}`}
                        className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:gap-4 sm:rounded-xl sm:p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950 dark:text-white">
                            {item.pregunta}
                          </p>
                          <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                            {item.respuesta}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => quitarPreguntaFrecuente(index)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10 sm:h-9 sm:w-9"
                          aria-label="Eliminar pregunta frecuente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs">
                    Todavía no agregaste preguntas frecuentes.
                  </p>
                )}
              </div>
            </div>

            {/* PREVIEW PÁGINA */}
            <div className="h-fit rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-2xl sm:p-4">
              <div className="mb-2.5 flex items-center justify-between sm:mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-950 dark:text-white sm:text-sm">
                    Vista previa
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                    Página del negocio
                  </p>
                </div>

                <Globe2 className="h-5 w-5 text-blue-500" />
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl">
                <div
                  className="relative h-28 overflow-hidden p-3 text-white sm:h-40 sm:p-5"
                  style={{
                    background: multimediaHero.length > 0 && multimediaHero[0].tipo === "imagen"
                      ? `linear-gradient(rgba(0,0,0,.48), rgba(0,0,0,.72)), url("${multimediaHero[0].url}") center/cover`
                      : `linear-gradient(135deg, ${paginaColorPrincipal}, #09090b)`,
                  }}
                >
                  <div className="relative z-10 flex h-full items-end gap-2 sm:gap-3">
                    {paginaLogoUrl && (
                      <img
                        src={paginaLogoUrl}
                        alt="Logo"
                        className="h-10 w-10 shrink-0 rounded-lg border border-white/20 bg-white object-cover shadow-lg sm:h-14 sm:w-14 sm:rounded-xl"
                      />
                    )}

                    <div className="min-w-0 pb-1">
                      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/70 sm:text-xs sm:tracking-[0.16em]">
                        {rubro || "Tu negocio"}
                      </p>

                      <h3 className="mt-0.5 truncate text-lg font-bold sm:mt-1 sm:text-2xl">
                        {paginaTitulo || nombre || "Tu negocio"}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-3 sm:p-5">
                  <p className="text-xs font-semibold leading-5 text-slate-900 dark:text-white sm:text-base sm:leading-6">
                    {paginaSubtitulo || "Agregá un texto principal para destacar tu negocio."}
                  </p>

                  {paginaTextoSecundario && (
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm sm:leading-6">
                      {paginaTextoSecundario}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-5 sm:grid-cols-1 sm:gap-2">
                    {paginaMostrarHorarios && horarios && (
                      <PreviewDato
                        titulo="Horarios"
                        valor={horarios}
                      />
                    )}

                    {paginaMostrarDireccion && direccion && (
                      <PreviewDato
                        titulo="Ubicación"
                        valor={direccion}
                      />
                    )}

                    {paginaMostrarWhatsApp && telefono && (
                      <PreviewDato
                        titulo="WhatsApp"
                        valor={telefono}
                      />
                    )}

                    {paginaMostrarEmail && email && (
                      <PreviewDato
                        titulo="Correo"
                        valor={email}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    style={{
                      backgroundColor: paginaColorPrincipal,
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white sm:mt-5 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
                  >
                    Contactar
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900 sm:mt-4 sm:rounded-xl sm:p-3">
                <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs">
                  URL
                </p>

                <p className="mt-0.5 break-all text-[11px] font-medium text-slate-800 dark:text-zinc-200 sm:mt-1 sm:text-sm">
                  {urlPublica || "/negocio/mi-negocio"}
                </p>
              </div>

              <button
                type="button"
                disabled={!paginaSlug}
                onClick={() => {
                  if (!paginaSlug) return;
                  window.open(urlPublica, "_blank");
                }}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:mt-3 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir página
              </button>

              <p className="mt-3 text-center text-xs text-slate-500 dark:text-zinc-600">
                Abrí la página para comprobar cómo la ven tus clientes.
              </p>
            </div>
          </div>
        </Card>

        {/* ASISTENTE IA Y WIDGET */}
        {puedeUsarIA && (
          <Card className="overflow-hidden">
            <SectionHeader
              title="Asistente IA y widget web"
              description="Configurá cómo responde el asistente y cómo se ve el widget en tu página."
              right={<Badge variant="info">IA activa</Badge>}
            />

            <div className="grid gap-3 p-4 sm:gap-5 sm:p-6 md:grid-cols-2">
              <Input
                id="nombreBot"
                label="Nombre del asistente"
                value={nombreBot}
                onChange={(e) => setNombreBot(e.target.value)}
                required
              />

              <Input
                id="idioma"
                label="Idioma"
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
              />

              <Input
                id="personalidad"
                label="Personalidad"
                value={personalidad}
                onChange={(e) => setPersonalidad(e.target.value)}
              />

              <Input
                id="objetivo"
                label="Objetivo principal"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Ejemplo: Resolver consultas y guiar reservas."
              />

              <div className="md:col-span-2">
                <TextArea
                  id="instrucciones"
                  label="Instrucciones del asistente"
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  placeholder="Indicaciones específicas para atender a tus clientes."
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  id="restricciones"
                  label="Restricciones"
                  value={restricciones}
                  onChange={(e) => setRestricciones(e.target.value)}
                />
              </div>

              <Input
                id="mensajeBienvenida"
                label="Mensaje de bienvenida"
                value={mensajeBienvenida}
                onChange={(e) => setMensajeBienvenida(e.target.value)}
              />

              <Input
                id="textoPlaceholder"
                label="Texto del input de chat"
                value={textoPlaceholder}
                onChange={(e) => setTextoPlaceholder(e.target.value)}
              />

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="colorPrincipalWidget"
                  className="block text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm"
                >
                  Color del widget
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    id="colorPrincipalWidget"
                    type="color"
                    value={colorPrincipal}
                    onChange={(e) => setColorPrincipal(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900 sm:h-11 sm:w-14 sm:rounded-xl"
                  />
                  <input
                    value={colorPrincipal}
                    onChange={(e) => setColorPrincipal(e.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="widgetTema"
                    className="block text-xs font-medium text-slate-700 dark:text-zinc-200"
                  >
                    Tema
                  </label>
                  <select
                    id="widgetTema"
                    value={tema}
                    onChange={(e) => setTema(e.target.value as TemaWidget)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="oscuro">Oscuro</option>
                    <option value="claro">Claro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="widgetPosicion"
                    className="block text-xs font-medium text-slate-700 dark:text-zinc-200"
                  >
                    Posición
                  </label>
                  <select
                    id="widgetPosicion"
                    value={posicion}
                    onChange={(e) => setPosicion(e.target.value as PosicionWidget)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="derecha">Derecha</option>
                    <option value="izquierda">Izquierda</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="widgetForma"
                    className="block text-xs font-medium text-slate-700 dark:text-zinc-200"
                  >
                    Botón
                  </label>
                  <select
                    id="widgetForma"
                    value={formaBoton}
                    onChange={(e) => setFormaBoton(e.target.value as FormaWidget)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="redondo">Redondo</option>
                    <option value="cuadrado">Cuadrado</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <ToggleOpcion
                  titulo="Mostrar marca"
                  descripcion="Mostrar el sello de la plataforma en el widget."
                  checked={mostrarMarca}
                  onChange={setMostrarMarca}
                />
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10 sm:p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </Card>
        )}

        {mensaje && (
          <Card className="border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {mensaje}
            </p>
          </Card>
        )}

        <Card className="sticky bottom-2 z-20 border-slate-200 bg-white/95 p-2.5 shadow-2xl backdrop-blur sm:bottom-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5 dark:border-zinc-700/80 dark:bg-zinc-900/95">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              Mi página
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
              Guardá los cambios antes de salir.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-row sm:gap-3">
            <Button
              type="button"
              variant="secondary"
              className="min-w-0 px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-sm"
              onClick={() => router.push(`/empresas/${empresaId}/catalogo`)}
            >
              <span className="sm:hidden">Catálogo</span>
              <span className="hidden sm:inline">Servicios y productos</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="min-w-0 px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-sm"
              disabled={!paginaSlug}
              onClick={() => {
                if (!paginaSlug) return;
                window.open(urlPublica, "_blank");
              }}
            >
              <span className="sm:hidden">Ver página</span>
              <span className="hidden sm:inline">Ver página pública</span>
            </Button>

            <Button
              type="submit"
              className="min-w-0 px-2 py-2 text-[10px] sm:px-4 sm:py-2.5 sm:text-sm"
              disabled={guardando}
            >
              {guardando ? (
                "Guardando..."
              ) : (
                <>
                  <span className="sm:hidden">Guardar</span>
                  <span className="hidden sm:inline">Guardar cambios</span>
                </>
              )}
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
    <div className="border-b border-slate-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-2 sm:flex-wrap sm:gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-lg">
            {title}
          </h2>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-sm sm:leading-normal">
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
  onSeleccionar: (archivo: File) => void;
  onQuitar: () => void;
  aspectClass: string;
}) {
  const inputId = useId();

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950/50 sm:rounded-2xl sm:p-4">
      <div>
        <p className="text-[11px] font-medium text-slate-950 dark:text-white sm:text-sm">
          {titulo}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs sm:leading-normal">
          {descripcion}
        </p>
      </div>

      {imagenUrl ? (
        <div
          className={`relative mt-2.5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:mt-4 sm:rounded-xl ${aspectClass}`}
        >
          <img
            src={imagenUrl}
            alt={titulo}
            className="h-full w-full object-cover"
          />

          <button
            type="button"
            onClick={onQuitar}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white transition hover:bg-red-600 sm:right-2 sm:top-2 sm:h-8 sm:w-8 sm:rounded-lg"
            aria-label={`Quitar ${titulo}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          className={`mt-2.5 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 p-2.5 dark:border-zinc-700 dark:bg-zinc-900/40 sm:mt-4 sm:rounded-xl sm:p-4 ${aspectClass}`}
        >
          <ImageIcon className="h-7 w-7 text-slate-400 dark:text-zinc-600" />
        </div>
      )}

      <div className="mt-2.5 sm:mt-4">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={cargando}
          onChange={(event) => {
            const archivo = event.target.files?.[0];
            if (archivo) {
              onSeleccionar(archivo);
            }
            event.target.value = "";
          }}
        />

        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm ${
            cargando ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Upload className="h-4 w-4" />
          {cargando
            ? "Subiendo..."
            : imagenUrl
              ? "Cambiar imagen"
              : "Subir imagen"}
        </label>
      </div>
    </div>
  );
}

function ToggleOpcion({
  titulo,
  descripcion,
  checked,
  onChange,
  disabled = false,
  bloqueoTexto,
}: {
  titulo: string;
  descripcion: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  bloqueoTexto?: string;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 sm:gap-4 sm:rounded-xl sm:p-4 ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100/70 opacity-70 dark:border-zinc-800 dark:bg-zinc-950/30"
          : "cursor-pointer border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/50"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <p className="text-[11px] font-medium leading-4 text-slate-950 dark:text-white sm:text-sm sm:leading-normal">
            {titulo}
          </p>

          {disabled && bloqueoTexto && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              {bloqueoTexto}
            </span>
          )}
        </div>

        <p className="mt-0.5 line-clamp-2 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs sm:leading-normal">
          {descripcion}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-blue-500 disabled:cursor-not-allowed sm:h-5 sm:w-5"
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-xl sm:px-3 sm:py-2.5">
      <p className="text-[8px] font-medium uppercase tracking-wide text-slate-400 dark:text-zinc-600 sm:text-[11px]">
        {titulo}
      </p>

      <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-700 dark:text-zinc-300 sm:mt-1 sm:text-sm">
        {valor}
      </p>
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
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
    <div className="space-y-1.5 sm:space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-700 dark:text-zinc-200 sm:text-sm"
      >
        {label}
      </label>

      <textarea
        id={id}
        rows={3}
        className={[
          "w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-xl sm:px-4 sm:py-3",
          "text-xs text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-zinc-500 sm:text-sm",
          "transition-colors duration-200",
          "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />

      {helperText && (
        <p className="text-xs text-slate-500 dark:text-zinc-500 sm:text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
}

function crearSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}