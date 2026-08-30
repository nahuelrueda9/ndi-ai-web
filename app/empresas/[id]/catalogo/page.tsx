"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import {
  Box,
  ImageIcon,
  Lock,
  Package,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

type TipoItem = "servicio" | "producto";

type RolEmpresa =
  | "administrador"
  | "supervisor"
  | "operador";

interface Empresa {
  userId?: string;
  rubro?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
}

interface Miembro {
  rol?: RolEmpresa;
  estado?: "activo" | "inactivo";
}

interface VarianteProducto {
  talle: string;
  color: string;
  stock: number;
}

interface CatalogoItem {
  id: string;
  tipo: TipoItem;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos?: number;
  imagenUrl?: string;
  imagenes?: string[];
  categoria?: string;
  talles?: string[];
  colores?: string[];
  variantes?: VarianteProducto[];
  stockGeneral?: number;
  stockTotal?: number;
  activo: boolean;
  createdAt?: Timestamp;
}

export default function CatalogoPage() {
  const params = useParams();
  const router = useRouter();

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const [
    puedeUsarCatalogo,
    setPuedeUsarCatalogo,
  ] = useState(false);

  const [
    puedeUsarProductos,
    setPuedeUsarProductos,
  ] = useState(false);

  const [esPlanBusiness, setEsPlanBusiness] = useState(false);
  const [items, setItems] = useState<CatalogoItem[]>([]);
  const [rubroEmpresa, setRubroEmpresa] =
    useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState<string | null>(null);

  const [tipo, setTipo] =
    useState<TipoItem>("servicio");

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [duracion, setDuracion] = useState("");
  const [categoria, setCategoria] =
    useState("principal");
  
  // Estados para variantes y stock
  const [talles, setTalles] = useState("");
  const [colores, setColores] = useState("");
  const [stockGeneral, setStockGeneral] = useState("0");
  const [stockVariantes, setStockVariantes] = useState<Record<string, number>>({});

  const [imagenes, setImagenes] =
    useState<string[]>([]);
  const [subiendoImagen, setSubiendoImagen] =
    useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const cancelar = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.replace("/login");
          return;
        }

        if (!empresaId) {
          setError("No se encontró la empresa.");
          setLoading(false);
          return;
        }

        setUser(currentUser);

        try {
          const empresaRef = doc(
            db,
            "companies",
            empresaId,
          );

          const empresaSnap = await getDoc(empresaRef);

          if (!empresaSnap.exists()) {
            setError("La empresa no existe.");
            setLoading(false);
            return;
          }

          const datosEmpresa =
            empresaSnap.data() as Empresa;

          const planStr = String(datosEmpresa.plan || "").toLowerCase().trim();
          const tieneFeatureBusiness = empresaTieneFuncion(datosEmpresa, "plan_business");
          const esBusinessDirecto = 
            tieneFeatureBusiness || 
            planStr === "business" || 
            planStr === "empresa" || 
            planStr === "completo" || 
            planStr === "pro_max";

          setEsPlanBusiness(esBusinessDirecto);

          setRubroEmpresa(
            datosEmpresa.rubro?.trim() || "",
          );

          setPuedeUsarCatalogo(
            empresaTieneFuncion(
              datosEmpresa,
              "catalogo",
            ),
          );

          setPuedeUsarProductos(
            empresaTieneFuncion(
              datosEmpresa,
              "productos",
            ),
          );

          if (datosEmpresa.userId === currentUser.uid) {
            setAutorizado(true);
            setLoading(false);
            return;
          }

          const miembroRef = doc(
            db,
            "companies",
            empresaId,
            "members",
            currentUser.uid,
          );

          const miembroSnap = await getDoc(miembroRef);

          if (!miembroSnap.exists()) {
            setError("No tenés acceso a esta empresa.");
            setLoading(false);
            return;
          }

          const miembro =
            miembroSnap.data() as Miembro;

          const rolPermitido =
            miembro.rol === "administrador" ||
            miembro.rol === "supervisor";

          if (
            miembro.estado !== "activo" ||
            !rolPermitido
          ) {
            setError(
              "No tenés permisos para administrar el catálogo.",
            );
            setLoading(false);
            return;
          }

          setAutorizado(true);
        } catch (firebaseError) {
          console.error(
            "Error verificando acceso:",
            firebaseError,
          );

          setError(
            "No se pudo verificar el acceso.",
          );
        } finally {
          setLoading(false);
        }
      },
    );

    return () => cancelar();
  }, [empresaId, router]);

  useEffect(() => {
    if (!empresaId || !user || !autorizado) {
      return;
    }

    const catalogoQuery = query(
      collection(
        db,
        "companies",
        empresaId,
        "catalog",
      ),
      orderBy("createdAt", "desc"),
    );

    const cancelar = onSnapshot(
      catalogoQuery,
      (snapshot) => {
        const data = snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...(documento.data() as Omit<
              CatalogoItem,
              "id"
            >),
          }),
        );

        setItems(data);
      },
      (firebaseError) => {
        console.error(
          "Error cargando catálogo:",
          firebaseError,
        );

        setError(
          "No se pudo cargar el catálogo.",
        );
      },
    );

    return () => cancelar();
  }, [autorizado, empresaId, user]);

  const servicios = useMemo(
    () =>
      items.filter(
        (item) => item.tipo === "servicio",
      ),
    [items],
  );

  const productos = useMemo(
    () =>
      items.filter(
        (item) => item.tipo === "producto",
      ),
    [items],
  );

  const rubroNormalizado =
    rubroEmpresa
      .trim()
      .toLowerCase();

  const esRestaurante =
    rubroNormalizado === "restaurante" ||
    rubroNormalizado === "restaurant";

  const esTienda =
    [
      "tienda",
      "tienda de ropa",
      "indumentaria",
      "ropa",
    ].includes(
      rubroNormalizado,
    );

  const limiteImagenes = useMemo(() => {
    if (esPlanBusiness) return 6;
    if (puedeUsarProductos) return 3;
    return 1;
  }, [esPlanBusiness, puedeUsarProductos]);

  // Lógica para procesar y crear las combinaciones de talles y colores en tiempo real
  const tallesNormalizados = useMemo(() => {
    return talles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t, index, self) => self.indexOf(t) === index)
      .slice(0, 20);
  }, [talles]);

  const coloresNormalizados = useMemo(() => {
    return colores
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
      .filter((c, index, self) => self.indexOf(c) === index)
      .slice(0, 20);
  }, [colores]);

  const combinacionesVariantes = useMemo(() => {
    const t = tallesNormalizados.length > 0 ? tallesNormalizados : [""];
    const c = coloresNormalizados.length > 0 ? coloresNormalizados : [""];
    
    const combinaciones: Array<{ id: string; talle: string; color: string }> = [];

    t.forEach((talle) => {
      c.forEach((color) => {
        if (talle || color) {
          combinaciones.push({
            id: `${talle}-${color}`,
            talle,
            color,
          });
        }
      });
    });

    return combinaciones;
  }, [tallesNormalizados, coloresNormalizados]);

  function limpiarFormulario() {
    setEditandoId(null);
    setTipo("servicio");
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setDuracion("");
    setCategoria("principal");
    setTalles("");
    setColores("");
    setStockGeneral("0");
    setStockVariantes({});
    setImagenes([]);
    setSubiendoImagen(false);
    setError("");
  }

  function cerrarFormulario() {
    limpiarFormulario();
    setMostrarFormulario(false);
  }

  function editarItem(item: CatalogoItem) {
    if (!puedeUsarCatalogo) {
      setError(
        "Necesitás un plan activo para administrar el catálogo.",
      );
      return;
    }

    setEditandoId(item.id);
    setTipo(item.tipo);
    setNombre(item.nombre);
    setDescripcion(item.descripcion || "");
    setPrecio(
      item.precio
        ? String(item.precio)
        : "",
    );

    setDuracion(
      item.duracionMinutos
        ? String(item.duracionMinutos)
        : "",
    );

    setCategoria(
      item.categoria?.trim() ||
        "principal",
    );

    setTalles(
      Array.isArray(item.talles)
        ? item.talles
            .filter(
              (talle): talle is string =>
                typeof talle === "string" &&
                talle.trim().length > 0,
            )
            .join(", ")
        : "",
    );

    setColores(
      Array.isArray(item.colores)
        ? item.colores
            .filter(
              (color): color is string =>
                typeof color === "string" &&
                color.trim().length > 0,
            )
            .join(", ")
        : "",
    );

    setStockGeneral(String(item.stockGeneral || 0));

    const mapStock: Record<string, number> = {};
    if (Array.isArray(item.variantes)) {
      item.variantes.forEach((v) => {
        mapStock[`${v.talle}-${v.color}`] = v.stock;
      });
    }
    setStockVariantes(mapStock);

    const imagenesGuardadas =
      Array.isArray(item.imagenes)
        ? item.imagenes
            .filter(
              (url): url is string =>
                typeof url === "string" &&
                url.trim().length > 0,
            )
            .map((url) => url.trim())
            .slice(0, limiteImagenes)
        : [];

    setImagenes(
      imagenesGuardadas.length > 0
        ? imagenesGuardadas
        : item.imagenUrl?.trim()
          ? [item.imagenUrl.trim()]
          : [],
    );

    setMensaje("");
    setError("");
    setMostrarFormulario(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function subirImagenCatalogo(
    archivo: File,
  ) {
    if (
      !user ||
      !empresaId ||
      subiendoImagen
    ) {
      return;
    }

    if (imagenes.length >= limiteImagenes) {
      setError(
        limiteImagenes === 1
          ? "Página Simple permite 1 imagen por elemento."
          : `Podés cargar hasta ${limiteImagenes} imágenes por elemento.`,
      );
      return;
    }

    if (!puedeUsarCatalogo) {
      setError(
        "Necesitás un plan activo para administrar el catálogo.",
      );
      return;
    }

    const FORMATOS_PERMITIDOS = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !FORMATOS_PERMITIDOS.includes(
        archivo.type,
      )
    ) {
      setError(
        "Usá una imagen JPG, PNG o WEBP.",
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

    setSubiendoImagen(true);
    setError("");
    setMensaje("");

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
        "catalogo";

      const fileName =
        `catalogo-${Date.now()}-${baseNombre}.${extension}`;

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
        `/ndi-ai/companies/${empresaId}/catalog`,
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

      setImagenes((actual) =>
        [...actual, url].slice(0, limiteImagenes),
      );
      setMensaje(
        "Imagen cargada correctamente.",
      );
    } catch (uploadError) {
      console.error(
        "Error subiendo imagen del catálogo:",
        uploadError,
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen.",
      );
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function guardarItem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !empresaId ||
      guardando ||
      subiendoImagen
    ) {
      return;
    }

    if (!puedeUsarCatalogo) {
      setError(
        "Necesitás un plan activo para administrar el catálogo.",
      );
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá un nombre.");
      return;
    }

    const precioNumero =
      Number(precio.replace(",", "."));

    if (
      precio &&
      (!Number.isFinite(precioNumero) ||
        precioNumero < 0)
    ) {
      setError("Ingresá un precio válido.");
      return;
    }

    let duracionNumero = 0;

    if (tipo === "servicio" && duracion) {
      duracionNumero = Number(duracion);

      if (
        !Number.isFinite(duracionNumero) ||
        duracionNumero < 0
      ) {
        setError(
          "Ingresá una duración válida.",
        );
        return;
      }
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const variantesAGuardar = combinacionesVariantes.map((c) => ({
        talle: c.talle,
        color: c.color,
        stock: stockVariantes[c.id] || 0,
      }));

      const stockGenNum = Number(stockGeneral) || 0;
      const stockTotalFinal =
        combinacionesVariantes.length > 0
          ? variantesAGuardar.reduce((acc, curr) => acc + curr.stock, 0)
          : stockGenNum;

      const datos = {
        tipo,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNumero || 0,
        duracionMinutos:
          tipo === "servicio"
            ? duracionNumero || 0
            : 0,
        categoria:
          esRestaurante &&
          tipo === "producto"
            ? categoria
            : "",
        talles:
          esTienda && tipo === "producto" && puedeUsarProductos
            ? tallesNormalizados
            : [],
        colores:
          esTienda && tipo === "producto" && puedeUsarProductos
            ? coloresNormalizados
            : [],
        variantes:
          esTienda && tipo === "producto" && puedeUsarProductos
            ? variantesAGuardar
            : [],
        stockGeneral:
          tipo === "producto" && combinacionesVariantes.length === 0
            ? stockGenNum
            : 0,
        stockTotal: tipo === "producto" ? stockTotalFinal : 0,
        imagenes:
          imagenes
            .filter(Boolean)
            .slice(0, limiteImagenes),
        imagenUrl:
          imagenes[0]?.trim() || "",
        updatedAt: serverTimestamp(),
      };

      if (editandoId) {
        await updateDoc(
          doc(
            db,
            "companies",
            empresaId,
            "catalog",
            editandoId,
          ),
          datos,
        );

        setMensaje(
          "Elemento actualizado correctamente.",
        );
      } else {
        await addDoc(
          collection(
            db,
            "companies",
            empresaId,
            "catalog",
          ),
          {
            ...datos,
            activo: true,
            createdAt: serverTimestamp(),
          },
        );

        setMensaje(
          tipo === "servicio"
            ? "Servicio creado correctamente."
            : esRestaurante
              ? "Elemento de la carta creado correctamente."
              : "Producto creado correctamente.",
        );
      }

      cerrarFormulario();
    } catch (firebaseError) {
      console.error(
        "Error guardando catálogo:",
        firebaseError,
      );

      setError(
        "No se pudo guardar el elemento.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(item: CatalogoItem) {
    if (!empresaId) return;

    if (!puedeUsarCatalogo) {
      setError(
        "Necesitás un plan activo para administrar el catálogo.",
      );
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "companies",
          empresaId,
          "catalog",
          item.id,
        ),
        {
          activo: !item.activo,
          updatedAt: serverTimestamp(),
        },
      );
    } catch (firebaseError) {
      console.error(
        "Error cambiando estado:",
        firebaseError,
      );

      setError(
        "No se pudo cambiar el estado.",
      );
    }
  }

  async function eliminarItem(item: CatalogoItem) {
    if (!empresaId) return;

    if (!puedeUsarCatalogo) {
      setError(
        "Necesitás un plan activo para administrar el catálogo.",
      );
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar "${item.nombre}"?`,
    );

    if (!confirmar) return;

    try {
      await deleteDoc(
        doc(
          db,
          "companies",
          empresaId,
          "catalog",
          item.id,
        ),
      );
    } catch (firebaseError) {
      console.error(
        "Error eliminando elemento:",
        firebaseError,
      );

      setError(
        "No se pudo eliminar.",
      );
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1800px] px-3 py-3 sm:px-6 sm:py-5 lg:px-7">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />

          <p className="font-medium">
            Cargando catálogo...
          </p>
        </Card>
      </section>
    );
  }

  if (!autorizado) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold">
            No pudimos abrir el catálogo
          </h1>

          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-3 flex items-end justify-between gap-2 sm:mb-5 sm:flex-row sm:items-center sm:gap-3">
        <div>
          <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            Página del negocio
          </p>

          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:mt-1 sm:text-2xl">
            {esRestaurante
              ? "Servicios y carta"
              : "Servicios y productos"}
          </h1>

          <p className="mt-0.5 max-w-xl text-[10px] leading-4 text-slate-500 dark:text-zinc-400 sm:mt-1 sm:max-w-2xl sm:text-xs sm:leading-5">
            Cargá lo que ofrece tu negocio y el stock disponible. Después
            aparecerá automáticamente en la página pública.
          </p>
        </div>

        <Button
          disabled={!puedeUsarCatalogo}
          onClick={() => {
            if (mostrarFormulario) {
              cerrarFormulario();
            } else {
              limpiarFormulario();
              setMostrarFormulario(true);
            }
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />

          {mostrarFormulario
            ? "Cancelar"
            : "Agregar"}
        </Button>
      </header>

      {!puedeUsarCatalogo && (
        <Card className="mb-3 border-amber-500/20 bg-amber-500/10 p-3 sm:mb-4 sm:p-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

            <div>
              <p className="text-xs font-semibold text-slate-950 dark:text-white sm:text-base">
                Necesitás un plan activo
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:text-sm sm:leading-6">
                Activá uno de los planes de NDI AI para cargar y administrar los servicios de tu negocio.
              </p>

              <Button
                className="mt-2.5 sm:mt-4"
                variant="secondary"
                onClick={() =>
                  router.push(
                    `/empresas/${empresaId}/planes`,
                  )
                }
              >
                Ver planes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {puedeUsarCatalogo &&
        !puedeUsarProductos && (
          <Card className="mb-3 border-blue-500/20 bg-blue-500/10 p-3 sm:mb-4 sm:p-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

              <div>
                <p className="text-xs font-semibold text-slate-950 dark:text-white sm:text-base">
                  {esRestaurante
                    ? "Carta básica incluida en Página Simple"
                    : "Catálogo básico incluido en Página Simple"}
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:text-sm sm:leading-6">
                  Podés cargar nombre, descripción, precio y 1 imagen por elemento.
                  Página Completa habilita hasta 3 imágenes (Business hasta 6), stock, talles y colores.
                </p>
              </div>
            </div>
          </Card>
        )}

      <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-3">
        <ResumenCard
          titulo="Total"
          valor={items.length}
          icono={<Package className="h-5 w-5" />}
        />

        <ResumenCard
          titulo="Servicios"
          valor={servicios.length}
          icono={<Scissors className="h-5 w-5" />}
        />

        <ResumenCard
          titulo={
            esRestaurante
              ? "Carta"
              : "Productos"
          }
          valor={productos.length}
          icono={<Box className="h-5 w-5" />}
        />
      </div>

      {mostrarFormulario && (
        <Card className="mb-3 overflow-hidden sm:mb-5">
          <div className="border-b border-slate-200 px-4 py-2.5 dark:border-zinc-800 sm:px-5 sm:py-3.5">
            <h2 className="text-sm font-semibold sm:text-lg">
              {editandoId
                ? "Editar elemento"
                : "Nuevo elemento"}
            </h2>
          </div>

          <form
            onSubmit={guardarItem}
            className="grid gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-2"
          >
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs font-medium sm:text-sm">
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target.value as TipoItem,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <option value="servicio">
                  Servicio
                </option>

                <option value="producto">
                  {esRestaurante
                    ? "Plato / bebida"
                    : "Producto"}
                </option>
              </select>

              {!puedeUsarProductos && (
                <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-5">
                  Página Simple incluye catálogo básico con 1 imagen por elemento.
                </p>
              )}
            </div>

            <Input
              id="nombre"
              label="Nombre"
              value={nombre}
              onChange={(event) =>
                setNombre(event.target.value)
              }
              placeholder={
                tipo === "servicio"
                  ? "Ejemplo: Corte de cabello"
                  : esRestaurante
                    ? "Ejemplo: Milanesa napolitana"
                    : "Ejemplo: Zapatillas Urban"
              }
              required
            />

            <Input
              id="precio"
              label="Precio"
              type="number"
              min="0"
              step="0.01"
              value={precio}
              onChange={(event) =>
                setPrecio(event.target.value)
              }
              placeholder="15000"
            />

            {esRestaurante &&
              tipo === "producto" && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs font-medium sm:text-sm">
                    Categoría de la carta
                  </label>

                  <select
                    value={categoria}
                    onChange={(event) =>
                      setCategoria(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <option value="entrada">
                      Entradas
                    </option>
                    <option value="principal">
                      Platos principales
                    </option>
                    <option value="bebida">
                      Bebidas
                    </option>
                    <option value="postre">
                      Postres
                    </option>
                  </select>

                  <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-5">
                    Se usará para ordenar automáticamente la carta pública.
                  </p>
                </div>
              )}

            {esTienda &&
              tipo === "producto" &&
              puedeUsarProductos && (
                <>
                  <Input
                    id="talles"
                    label="Talles (Opcional)"
                    value={talles}
                    onChange={(event) =>
                      setTalles(
                        event.target.value,
                      )
                    }
                    placeholder="S, M, L, XL"
                  />

                  <Input
                    id="colores"
                    label="Colores (Opcional)"
                    value={colores}
                    onChange={(event) =>
                      setColores(
                        event.target.value,
                      )
                    }
                    placeholder="Negro, Blanco, Azul"
                  />

                  <div className="md:col-span-2 -mt-2">
                    <p className="text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:text-xs sm:leading-5">
                      Separá cada opción con una coma.
                    </p>
                  </div>

                  {/* MATRIZ DE STOCK DINÁMICA */}
                  {combinacionesVariantes.length > 0 ? (
                    <div className="md:col-span-2 mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <p className="mb-3 text-xs font-bold text-slate-900 dark:text-white sm:text-sm">
                        Stock por variante
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {combinacionesVariantes.map((comb) => (
                          <div
                            key={comb.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            <span className="truncate text-[11px] font-medium text-slate-700 dark:text-zinc-300">
                              {comb.talle && `Talle ${comb.talle}`}
                              {comb.talle && comb.color && " · "}
                              {comb.color}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={stockVariantes[comb.id] || ""}
                              onChange={(e) =>
                                setStockVariantes((prev) => ({
                                  ...prev,
                                  [comb.id]: parseInt(e.target.value) || 0,
                                }))
                              }
                              className="w-16 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-center text-xs outline-none transition focus:border-blue-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white"
                              placeholder="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <Input
                        id="stockGeneral"
                        label="Stock disponible (Unidades)"
                        type="number"
                        min="0"
                        value={stockGeneral}
                        onChange={(e) => setStockGeneral(e.target.value)}
                        placeholder="Ej: 10"
                      />
                    </div>
                  )}
                </>
              )}

            {esTienda &&
              tipo === "producto" &&
              !puedeUsarProductos && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2.5 sm:rounded-xl sm:px-4 sm:py-3 md:col-span-2">
                  <p className="text-xs leading-5 text-slate-600 dark:text-zinc-400">
                    Los talles, colores y control de stock están disponibles desde Página Completa.
                  </p>
                </div>
              )}

            {/* PRODUCTO REGULAR SIN TALLES NI COLORES */}
            {!esTienda && tipo === "producto" && puedeUsarProductos && (
               <Input
                 id="stockGeneral"
                 label="Stock disponible (Opcional)"
                 type="number"
                 min="0"
                 value={stockGeneral}
                 onChange={(e) => setStockGeneral(e.target.value)}
                 placeholder="Ej: 50"
               />
            )}

            {tipo === "servicio" && (
              <Input
                id="duracion"
                label="Duración en minutos"
                type="number"
                min="0"
                value={duracion}
                onChange={(event) =>
                  setDuracion(event.target.value)
                }
                placeholder="60"
              />
            )}

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3 sm:gap-3">
                <div>
                  <p className="text-xs font-medium sm:text-sm">
                    Imágenes
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-500 sm:mt-1 sm:text-xs">
                    {limiteImagenes === 1
                      ? "Opcional · 1 imagen · JPG, PNG o WEBP · Máximo 5 MB."
                      : `Opcional · Hasta ${limiteImagenes} imágenes · JPG, PNG o WEBP · Máximo 5 MB por imagen.`}
                  </p>
                </div>

                <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-500 sm:text-xs">
                  {imagenes.length > limiteImagenes
                    ? `${limiteImagenes} visible / ${imagenes.length} guardadas`
                    : `${imagenes.length}/${limiteImagenes}`}
                </span>
              </div>

              <div className={`grid gap-2 sm:gap-3 ${limiteImagenes === 6 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3"}`}>
                {imagenes.map((url, indice) => (
                  <div
                    key={`${url}-${indice}`}
                    className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-2xl"
                  >
                    <img
                      src={url}
                      alt={`Imagen ${indice + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setImagenes((actual) =>
                          actual.filter(
                            (_, index) =>
                              index !== indice,
                          ),
                        )
                      }
                      disabled={subiendoImagen}
                      className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white backdrop-blur transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:right-2 sm:top-2 sm:h-7 sm:w-7 sm:rounded-lg"
                      aria-label={`Quitar imagen ${indice + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {indice === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur sm:bottom-2 sm:left-2 sm:rounded-lg sm:px-2 sm:py-0.5 sm:text-[9px]">
                        Principal
                      </span>
                    )}
                  </div>
                ))}

                {imagenes.length < limiteImagenes && (
                  <label
                    className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-2 text-center transition sm:rounded-2xl sm:px-2 ${
                      subiendoImagen
                        ? "cursor-wait border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                    }`}
                  >
                    {subiendoImagen ? (
                      <>
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
                        <p className="mt-1 text-[9px] font-medium sm:text-[10px]">
                          Subiendo...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 sm:h-8 sm:w-8 sm:rounded-xl">
                          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>

                        <p className="mt-1 text-[9px] font-medium sm:text-[11px]">
                          Agregar
                        </p>

                        <p className="mt-0.5 text-[7px] text-slate-500 dark:text-zinc-500 sm:text-[9px]">
                          {imagenes.length + 1} de {limiteImagenes}
                        </p>
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={
                        subiendoImagen ||
                        imagenes.length >= limiteImagenes
                      }
                      onChange={(event) => {
                        const archivo =
                          event.target.files?.[0];

                        if (archivo) {
                          void subirImagenCatalogo(
                            archivo,
                          );
                        }

                        event.currentTarget.value =
                          "";
                      }}
                    />
                  </label>
                )}
              </div>

              <p className="mt-1.5 text-[9px] leading-4 text-slate-400 dark:text-zinc-600 sm:mt-2 sm:text-[11px] sm:leading-5">
                {limiteImagenes === 1
                  ? "La imagen será la portada del elemento. Con Página Completa podés cargar hasta 3 fotos (Business hasta 6)."
                  : "La primera imagen será la portada. En la página pública el cliente podrá deslizar entre las fotos."}
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="descripcion"
                className="mb-1.5 block text-xs font-medium sm:mb-2 sm:text-sm"
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                rows={3}
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(event.target.value)
                }
                placeholder="Explicá brevemente qué incluye."
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 sm:gap-3 md:col-span-2">
              <Button
                type="button"
                variant="secondary"
                onClick={cerrarFormulario}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  !puedeUsarCatalogo ||
                  guardando ||
                  subiendoImagen
                }
              >
                {subiendoImagen
                  ? "Subiendo imagen..."
                  : guardando
                    ? "Guardando..."
                  : editandoId
                    ? "Guardar cambios"
                    : "Crear"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <Card className="mb-3 border-red-500/20 bg-red-500/10 p-3 sm:mb-6 sm:p-4">
          <p className="text-xs text-red-500 sm:text-sm">
            {error}
          </p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-3 border-emerald-500/20 bg-emerald-500/10 p-3 sm:mb-6 sm:p-4">
          <p className="text-xs text-emerald-500 sm:text-sm">
            {mensaje}
          </p>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="border-dashed p-6 text-center sm:p-12">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Package className="h-5 w-5 sm:h-7 sm:w-7" />
          </div>

          <h2 className="mt-3 text-base font-semibold sm:mt-5 sm:text-xl">
            Todavía no cargaste nada
          </h2>

          <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-5 text-slate-500 dark:text-zinc-500 sm:mt-2 sm:text-sm sm:leading-6">
            {esRestaurante
              ? "Agregá el primer servicio o elemento de la carta."
              : "Agregá el primer servicio o producto de este negocio."}
          </p>

          <Button
            className="mt-4 sm:mt-6"
            disabled={!puedeUsarCatalogo}
            onClick={() => setMostrarFormulario(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            Agregar primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-7">
          <SeccionCatalogo
            titulo="Servicios"
            descripcion="Servicios que ofrece el negocio."
            items={servicios}
            onEditar={editarItem}
            onEstado={cambiarEstado}
            onEliminar={eliminarItem}
          />

          <SeccionCatalogo
            titulo={
              esRestaurante
                ? "Carta"
                : "Productos"
            }
            descripcion={
              esRestaurante
                ? "Entradas, platos principales, bebidas y postres."
                : "Productos disponibles para mostrar a los clientes."
            }
            items={productos}
            mostrarCategoria={
              esRestaurante
            }
            onEditar={editarItem}
            onEstado={cambiarEstado}
            onEliminar={eliminarItem}
          />
        </div>
      )}
    </section>
  );
}

function ResumenCard({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: number;
  icono: React.ReactNode;
}) {
  return (
    <Card className="p-2.5 sm:p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-slate-500 dark:text-zinc-400 sm:text-xs">
            {titulo}
          </p>

          <p className="mt-0.5 text-xl font-bold sm:mt-1 sm:text-2xl">
            {valor}
          </p>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 sm:h-9 sm:w-9 sm:rounded-xl">
          {icono}
        </div>
      </div>
    </Card>
  );
}

function etiquetaCategoriaCarta(
  categoria?: string,
) {
  switch (
    categoria
      ?.trim()
      .toLowerCase()
  ) {
    case "entrada":
    case "entradas":
      return "Entrada";
    case "bebida":
    case "bebidas":
      return "Bebida";
    case "postre":
    case "postres":
      return "Postre";
    default:
      return "Plato principal";
  }
}

function SeccionCatalogo({
  titulo,
  descripcion,
  items,
  mostrarCategoria = false,
  onEditar,
  onEstado,
  onEliminar,
}: {
  titulo: string;
  descripcion: string;
  items: CatalogoItem[];
  mostrarCategoria?: boolean;
  onEditar: (item: CatalogoItem) => void;
  onEstado: (item: CatalogoItem) => void;
  onEliminar: (item: CatalogoItem) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 sm:mb-3">
        <h2 className="text-base font-bold sm:text-lg">
          {titulo}
        </h2>

        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-500 sm:text-xs">
          {descripcion}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {items.map((item) => (
          <Card
            key={item.id}
            className="flex h-full flex-col overflow-hidden"
          >
            {(
              (Array.isArray(item.imagenes) &&
                item.imagenes[0]) ||
              item.imagenUrl
            ) && (
              <div className="relative h-24 overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950 sm:h-32 xl:h-28">
                <img
                  src={
                    (Array.isArray(item.imagenes) &&
                      item.imagenes[0]) ||
                    item.imagenUrl ||
                    ""
                  }
                  alt={item.nombre}
                  className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                />

                {Array.isArray(item.imagenes) &&
                  item.imagenes.length > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur sm:bottom-2 sm:right-2 sm:px-2 sm:text-[10px]">
                      {item.imagenes.length} fotos
                    </span>
                  )}
              </div>
            )}

            <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <h3 className="line-clamp-2 text-[11px] font-semibold leading-4 sm:text-sm sm:leading-5">
                      {item.nombre}
                    </h3>

                    <Badge
                      variant={
                        item.activo
                          ? "success"
                          : "info"
                      }
                    >
                      {item.activo
                        ? "Activo"
                        : "Oculto"}
                    </Badge>

                    {mostrarCategoria &&
                      item.tipo ===
                        "producto" && (
                        <Badge variant="info">
                          {etiquetaCategoriaCarta(
                            item.categoria,
                          )}
                        </Badge>
                      )}
                  </div>

                  {item.descripcion && (
                    <p className="mt-1 line-clamp-2 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-400 sm:mt-2 sm:text-xs sm:leading-4">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-1.5 pt-2 sm:gap-2 sm:pt-3">
                {item.precio > 0 && (
                  <div className="rounded-md bg-slate-100 px-2 py-1 dark:bg-zinc-950 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                    <p className="text-[8px] text-slate-500 sm:text-[10px]">
                      Precio
                    </p>

                    <p className="text-[10px] font-semibold sm:text-xs">
                      ${item.precio.toLocaleString("es-AR")}
                    </p>
                  </div>
                )}

                {item.tipo === "producto" && item.stockTotal !== undefined && (
                  <div className="rounded-md bg-slate-100 px-2 py-1 dark:bg-zinc-950 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                    <p className="text-[8px] text-slate-500 sm:text-[10px]">
                      Stock
                    </p>

                    <p className="text-[10px] font-semibold sm:text-xs">
                      {item.stockTotal} un.
                    </p>
                  </div>
                )}

                {item.tipo === "servicio" &&
                  Boolean(item.duracionMinutos) && (
                    <div className="rounded-md bg-slate-100 px-2 py-1 dark:bg-zinc-950 sm:rounded-lg sm:px-2.5 sm:py-1.5">
                      <p className="text-[8px] text-slate-500 sm:text-[10px]">
                        Duración
                      </p>

                      <p className="text-[10px] font-semibold sm:text-xs">
                        {item.duracionMinutos} min
                      </p>
                    </div>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 border-t border-slate-200 p-2 dark:border-zinc-800 sm:gap-1.5 sm:p-2.5">
              <button
                type="button"
                onClick={() => onEditar(item)}
                className="inline-flex items-center justify-center gap-0.5 rounded-md border border-slate-300 px-1 py-1.5 text-[9px] transition hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800 sm:gap-1 sm:rounded-lg sm:px-2 sm:text-[11px]"
              >
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onEstado(item)}
                className="rounded-md border border-slate-300 px-1 py-1.5 text-[9px] transition hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800 sm:rounded-lg sm:px-2 sm:text-[11px]"
              >
                {item.activo ? "Ocultar" : "Activar"}
              </button>

              <button
                type="button"
                onClick={() => onEliminar(item)}
                className="inline-flex items-center justify-center gap-0.5 rounded-md border border-red-500/20 px-1 py-1.5 text-[9px] text-red-500 transition hover:bg-red-500/10 sm:gap-1 sm:rounded-lg sm:px-2 sm:text-[11px]"
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Eliminar
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}