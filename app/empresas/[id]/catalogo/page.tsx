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

  const limiteImagenes =
    puedeUsarProductos ? 3 : 1;

  function limpiarFormulario() {
    setEditandoId(null);
    setTipo("servicio");
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setDuracion("");
    setCategoria("principal");
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

    const imagenesGuardadas =
      Array.isArray(item.imagenes)
        ? item.imagenes
            .filter(
              (url): url is string =>
                typeof url === "string" &&
                url.trim().length > 0,
            )
            .map((url) => url.trim())
            .slice(0, 3)
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
          : "Podés cargar hasta 3 imágenes por elemento.",
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
        [...actual, url].slice(0, 3),
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
        imagenes:
          imagenes
            .filter(Boolean)
            .slice(0, 3),
        // Compatibilidad con datos/código anterior:
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
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
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
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
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
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Página del negocio
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            {esRestaurante
              ? "Servicios y carta"
              : "Servicios y productos"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Cargá lo que ofrece tu negocio. Después
            aparecerá automáticamente en la página
            pública.
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
          <Plus className="mr-2 h-4 w-4" />

          {mostrarFormulario
            ? "Cancelar"
            : "Agregar"}
        </Button>
      </header>

      {!puedeUsarCatalogo && (
        <Card className="mb-6 border-amber-500/20 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                Necesitás un plan activo
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                Activá uno de los planes de NDI AI para cargar y administrar los servicios de tu negocio.
              </p>

              <Button
                className="mt-4"
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
          <Card className="mb-6 border-blue-500/20 bg-blue-500/10 p-5">
            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />

              <div>
                <p className="font-semibold text-slate-950 dark:text-white">
                  {esRestaurante
                    ? "Carta básica incluida en Página Simple"
                    : "Catálogo básico incluido en Página Simple"}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                  Podés cargar nombre, descripción, precio y 1 imagen por elemento.
                  Página Completa habilita hasta 3 imágenes y las funciones avanzadas.
                </p>
              </div>
            </div>
          </Card>
        )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
        <Card className="mb-8 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">
              {editandoId
                ? "Editar elemento"
                : "Nuevo elemento"}
            </h2>
          </div>

          <form
            onSubmit={guardarItem}
            className="grid gap-5 p-6 md:grid-cols-2"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Tipo
              </label>

              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target.value as TipoItem,
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
                <p className="text-xs leading-5 text-slate-500 dark:text-zinc-500">
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
                    : "Ejemplo: Shampoo profesional"
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Categoría de la carta
                  </label>

                  <select
                    value={categoria}
                    onChange={(event) =>
                      setCategoria(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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

                  <p className="text-xs leading-5 text-slate-500 dark:text-zinc-500">
                    Se usará para ordenar automáticamente la carta pública.
                  </p>
                </div>
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Imágenes
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    {limiteImagenes === 1
                      ? "Opcional · 1 imagen · JPG, PNG o WEBP · Máximo 5 MB."
                      : "Opcional · Hasta 3 imágenes · JPG, PNG o WEBP · Máximo 5 MB por imagen."}
                  </p>
                </div>

                <span className="text-xs font-medium text-slate-500 dark:text-zinc-500">
                  {imagenes.length > limiteImagenes
                    ? `${limiteImagenes} visible / ${imagenes.length} guardadas`
                    : `${imagenes.length}/${limiteImagenes}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imagenes.map((url, indice) => (
                  <div
                    key={`${url}-${indice}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950"
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
                      className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-black/70 text-white backdrop-blur transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`Quitar imagen ${indice + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {indice === 0 && (
                      <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        Principal
                      </span>
                    )}
                  </div>
                ))}

                {imagenes.length < limiteImagenes && (
                  <label
                    className={`flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition ${
                      subiendoImagen
                        ? "cursor-wait border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                        : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                    }`}
                  >
                    {subiendoImagen ? (
                      <>
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
                        <p className="mt-2 text-xs font-medium">
                          Subiendo...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                          <ImageIcon className="h-5 w-5" />
                        </div>

                        <p className="mt-2 text-xs font-medium">
                          Agregar imagen
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-500">
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

              <p className="mt-2 text-[11px] leading-5 text-slate-400 dark:text-zinc-600">
                {limiteImagenes === 1
                  ? "La imagen será la portada del elemento. Con Página Completa podés cargar hasta 3 fotos."
                  : "La primera imagen será la portada. En la página pública el cliente podrá deslizar entre las fotos."}
              </p>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="descripcion"
                className="mb-2 block text-sm font-medium"
              >
                Descripción
              </label>

              <textarea
                id="descripcion"
                rows={4}
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(event.target.value)
                }
                placeholder="Explicá brevemente qué incluye."
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 md:col-span-2">
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
        <Card className="mb-6 border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-500">
            {error}
          </p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-6 border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-500">
            {mensaje}
          </p>
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <Package className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Todavía no cargaste nada
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-500">
            {esRestaurante
              ? "Agregá el primer servicio o elemento de la carta."
              : "Agregá el primer servicio o producto de este negocio."}
          </p>

          <Button
            className="mt-6"
            disabled={!puedeUsarCatalogo}
            onClick={() => setMostrarFormulario(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-10">
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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {valor}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
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
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          {titulo}
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">
          {descripcion}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden"
          >
            {(
              (Array.isArray(item.imagenes) &&
                item.imagenes[0]) ||
              item.imagenUrl
            ) && (
              <div className="relative aspect-[16/9] overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950">
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
                    <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                      {Math.min(
                        item.imagenes.length,
                        3,
                      )} fotos
                    </span>
                  )}
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">
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
                    <p className="mt-3 leading-6 text-slate-500 dark:text-zinc-400">
                      {item.descripcion}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {item.precio > 0 && (
                  <div className="rounded-xl bg-slate-100 px-4 py-2 dark:bg-zinc-950">
                    <p className="text-xs text-slate-500">
                      Precio
                    </p>

                    <p className="font-semibold">
                      ${item.precio.toLocaleString("es-AR")}
                    </p>
                  </div>
                )}

                {item.tipo === "servicio" &&
                  Boolean(item.duracionMinutos) && (
                    <div className="rounded-xl bg-slate-100 px-4 py-2 dark:bg-zinc-950">
                      <p className="text-xs text-slate-500">
                        Duración
                      </p>

                      <p className="font-semibold">
                        {item.duracionMinutos} min
                      </p>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onEditar(item)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => onEstado(item)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {item.activo ? "Ocultar" : "Activar"}
              </button>

              <button
                type="button"
                onClick={() => onEliminar(item)}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-sm text-red-500 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}