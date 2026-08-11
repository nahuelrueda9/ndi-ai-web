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
  Package,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
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

  const [items, setItems] = useState<CatalogoItem[]>([]);

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
  const [imagenUrl, setImagenUrl] = useState("");
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

          const empresa =
            empresaSnap.data() as Empresa;

          if (empresa.userId === currentUser.uid) {
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

  function limpiarFormulario() {
    setEditandoId(null);
    setTipo("servicio");
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setDuracion("");
    setImagenUrl("");
    setSubiendoImagen(false);
    setError("");
  }

  function cerrarFormulario() {
    limpiarFormulario();
    setMostrarFormulario(false);
  }

  function editarItem(item: CatalogoItem) {
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

    setImagenUrl(
      item.imagenUrl?.trim() || "",
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

    if (
      !archivo.type.startsWith("image/")
    ) {
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

      setImagenUrl(url);
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
        imagenUrl:
          imagenUrl.trim(),
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
            Servicios y productos
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
            Cargá lo que ofrece tu negocio. Después
            aparecerá automáticamente en la página
            pública.
          </p>
        </div>

        <Button
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
          titulo="Productos"
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
                  Producto
                </option>
              </select>
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
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Imagen
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                    Opcional. Recomendado: imagen horizontal o cuadrada, hasta 5 MB.
                  </p>
                </div>
              </div>

              {imagenUrl ? (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950">
                  <img
                    src={imagenUrl}
                    alt="Vista previa"
                    className="h-56 w-full object-cover sm:h-64"
                  />

                  <div className="absolute right-3 top-3 flex gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-black/80">
                      <Upload className="h-4 w-4" />
                      Cambiar

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={subiendoImagen}
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

                    <button
                      type="button"
                      onClick={() =>
                        setImagenUrl("")
                      }
                      disabled={subiendoImagen}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/70 text-white backdrop-blur transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Quitar imagen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {subiendoImagen && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-medium text-white backdrop-blur-sm">
                      Subiendo imagen...
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition ${
                    subiendoImagen
                      ? "cursor-wait border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                      : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
                  }`}
                >
                  {subiendoImagen ? (
                    <>
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500" />
                      <p className="mt-3 text-sm font-medium">
                        Subiendo imagen...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                        <ImageIcon className="h-5 w-5" />
                      </div>

                      <p className="mt-3 text-sm font-medium">
                        Subir imagen
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                        JPG, PNG, WEBP u otro formato de imagen
                      </p>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={subiendoImagen}
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
            Agregá el primer servicio o producto de
            este negocio.
          </p>

          <Button
            className="mt-6"
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
            titulo="Productos"
            descripcion="Productos disponibles para mostrar a los clientes."
            items={productos}
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

function SeccionCatalogo({
  titulo,
  descripcion,
  items,
  onEditar,
  onEstado,
  onEliminar,
}: {
  titulo: string;
  descripcion: string;
  items: CatalogoItem[];
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
            {item.imagenUrl && (
              <div className="aspect-[16/9] overflow-hidden border-b border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-950">
                <img
                  src={item.imagenUrl}
                  alt={item.nombre}
                  className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
                />
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