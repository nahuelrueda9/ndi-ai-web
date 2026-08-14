"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
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
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { auth, db, storage } from "@/lib/firebase";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

interface Empresa {
  nombre: string;
  userId: string;
}

interface Conocimiento {
  id: string;
  titulo: string;
  contenido: string;
  empresaId: string;
  userId: string;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const FORMATOS_PERMITIDOS = [".pdf", ".docx", ".txt"];
const TAMANO_MAXIMO = 10 * 1024 * 1024;

export default function ConocimientoPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const empresaId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  const [user, setUser] = useState<User | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [conocimientos, setConocimientos] = useState<Conocimiento[]>([]);

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
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
        setError("");
        setLoading(true);

        try {
          const empresaReferencia = doc(db, "companies", empresaId);
          const empresaSnapshot = await getDoc(empresaReferencia);

          if (!empresaSnapshot.exists()) {
            setError("La empresa no existe.");
            return;
          }

          const empresa = empresaSnapshot.data() as Empresa;

          if (empresa.userId !== currentUser.uid) {
            setError("No tenés permiso para acceder a esta empresa.");
            return;
          }

          setEmpresaNombre(empresa.nombre);
        } catch (firebaseError) {
          console.error("Error al cargar la empresa:", firebaseError);
          setError("No se pudo cargar la empresa.");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribeAuth();
  }, [empresaId, router]);

  useEffect(() => {
    if (!user || !empresaId) {
      setCargandoLista(false);
      return;
    }

    setCargandoLista(true);

    const conocimientoQuery = query(
      collection(db, "knowledge"),
      where("empresaId", "==", empresaId),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeConocimiento = onSnapshot(
      conocimientoQuery,
      (snapshot) => {
        const datos = snapshot.docs.map((documento) => ({
          id: documento.id,
          ...(documento.data() as Omit<Conocimiento, "id">),
        }));

        setConocimientos(datos);
        setCargandoLista(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar la base de conocimiento:",
          firebaseError
        );

        setError(
          "No se pudo cargar la base de conocimiento. Puede faltar un índice en Firestore."
        );
        setCargandoLista(false);
      }
    );

    return () => unsubscribeConocimiento();
  }, [empresaId, user]);

  const conocimientosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return conocimientos;
    }

    return conocimientos.filter((item) => {
      return (
        item.titulo.toLowerCase().includes(texto) ||
        item.contenido.toLowerCase().includes(texto) ||
        item.archivoNombre?.toLowerCase().includes(texto)
      );
    });
  }, [busqueda, conocimientos]);

  const totalCaracteres = useMemo(
    () =>
      conocimientos.reduce(
        (total, item) => total + item.contenido.length,
        0
      ),
    [conocimientos]
  );

  const documentosConArchivo = useMemo(
    () => conocimientos.filter((item) => item.archivoNombre).length,
    [conocimientos]
  );

  const limpiarFormulario = () => {
    setTitulo("");
    setContenido("");
    setArchivo(null);
    setEditandoId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validarArchivo = (file: File) => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

    if (!FORMATOS_PERMITIDOS.includes(extension)) {
      setError("El archivo debe ser PDF, DOCX o TXT.");
      return false;
    }

    if (file.size > TAMANO_MAXIMO) {
      setError("El archivo no puede superar los 10 MB.");
      return false;
    }

    setError("");
    setMensaje("");
    return true;
  };

  const seleccionarArchivo = (file: File | null) => {
    if (!file) {
      setArchivo(null);
      return;
    }

    if (validarArchivo(file)) {
      setArchivo(file);

      if (!titulo.trim()) {
        const nombreSinExtension = file.name.replace(/\.[^/.]+$/, "");
        setTitulo(nombreSinExtension);
      }
    }
  };

  const handleArchivoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    seleccionarArchivo(event.target.files?.[0] || null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrando(false);
    seleccionarArchivo(event.dataTransfer.files?.[0] || null);
  };

  const extraerTextoArchivo = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "txt") {
      return await file.text();
    }

    if (extension === "docx") {
      const arrayBuffer = await file.arrayBuffer();

      const resultado = await mammoth.extractRawText({
        arrayBuffer,
      });

      return resultado.value;
    }

    if (extension === "pdf") {
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      let textoCompleto = "";

      for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
        const paginaPdf = await pdf.getPage(pagina);
        const contenidoPagina = await paginaPdf.getTextContent();

        const textoPagina = contenidoPagina.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");

        textoCompleto += `${textoPagina}\n`;
      }

      return textoCompleto.trim();
    }

    throw new Error("Formato de archivo no compatible.");
  };

  const handleAgregar = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!user || !empresaId) return;

    if (!titulo.trim()) {
      setError("Ingresá un título.");
      return;
    }

    if (!contenido.trim() && !archivo) {
      setError("Escribí contenido o seleccioná un archivo.");
      return;
    }

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      let archivoUrl = "";
      let archivoNombre = "";
      let archivoTipo = "";
      let contenidoFinal = contenido.trim();

      if (archivo) {
        const textoArchivo = await extraerTextoArchivo(archivo);

        if (textoArchivo) {
          contenidoFinal = contenidoFinal
            ? `${contenidoFinal}\n\n----- CONTENIDO DEL ARCHIVO -----\n\n${textoArchivo}`
            : textoArchivo;
        }

        if (!editandoId) {
          const nombreSeguro = archivo.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

          const archivoReferencia = ref(
            storage,
            `knowledge/${user.uid}/${empresaId}/${Date.now()}-${nombreSeguro}`
          );

          await uploadBytes(archivoReferencia, archivo);

          archivoUrl = await getDownloadURL(archivoReferencia);
          archivoNombre = archivo.name;
          archivoTipo = archivo.type;
        }
      }

      if (editandoId) {
        await updateDoc(doc(db, "knowledge", editandoId), {
          titulo: titulo.trim(),
          contenido: contenidoFinal,
          ...(archivoUrl && {
            archivoUrl,
            archivoNombre,
            archivoTipo,
          }),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "knowledge"), {
          titulo: titulo.trim(),
          contenido: contenidoFinal,
          empresaId,
          userId: user.uid,
          ...(archivoUrl && {
            archivoUrl,
            archivoNombre,
            archivoTipo,
          }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const estabaEditando = Boolean(editandoId);

      limpiarFormulario();

      setMensaje(
        estabaEditando
          ? "Información actualizada correctamente."
          : "Información agregada correctamente."
      );
    } catch (firebaseError) {
      console.error("Error al guardar conocimiento:", firebaseError);
      setError(
        "No se pudo guardar la información. Revisá el archivo e intentá nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (item: Conocimiento) => {
    setEditandoId(item.id);
    setTitulo(item.titulo);
    setContenido(item.contenido);
    setArchivo(null);
    setError("");
    setMensaje("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (conocimientoId: string) => {
    const confirmar = window.confirm(
      "¿Querés eliminar esta información de la base de conocimiento?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      await deleteDoc(doc(db, "knowledge", conocimientoId));

      if (editandoId === conocimientoId) {
        limpiarFormulario();
      }

      setMensaje("Información eliminada correctamente.");
    } catch (firebaseError) {
      console.error(
        "Error al eliminar conocimiento:",
        firebaseError
      );

      setError("No se pudo eliminar la información.");
    }
  };

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6">
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="font-medium text-white">
            Cargando base de conocimiento...
          </p>
        </Card>
      </section>
    );
  }

  if (error && !empresaNombre) {
    return (
      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <Card className="border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="font-medium text-red-300">{error}</p>

          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/empresas")}
            >
              Volver a empresas
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <header className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-blue-400">
            {empresaNombre}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Base de conocimiento
            </h1>

            <Badge variant="info">
              {conocimientos.length}{" "}
              {conocimientos.length === 1 ? "entrada" : "entradas"}
            </Badge>
          </div>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-400">
            Cargá servicios, precios, preguntas frecuentes, políticas y
            documentos para que el agente responda con información real.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push(`/empresas/${empresaId}`)}
        >
          Volver a la empresa
        </Button>
      </header>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Entradas cargadas
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {conocimientos.length}
          </p>
        </Card>

        <Card className="p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Con archivo
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {documentosConArchivo}
          </p>
        </Card>

        <Card className="p-3.5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-600">
            Caracteres disponibles
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {totalCaracteres.toLocaleString("es-AR")}
          </p>
        </Card>
      </div>

      {error && (
        <Card className="mb-4 border-red-500/20 bg-red-500/10 p-3">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-4 border-green-500/20 bg-green-500/10 p-3">
          <p className="text-sm text-green-300">{mensaje}</p>
        </Card>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleAgregar} className="h-fit">
          <Card className="p-4">
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-base font-semibold text-white">
                  {editandoId
                    ? "Editar información"
                    : "Agregar información"}
                </h2>

                {editandoId && (
                  <Badge variant="warning">Editando</Badge>
                )}
              </div>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Podés escribir el contenido manualmente, subir un documento o
                combinar las dos opciones.
              </p>
            </div>

            <div>
              <label
                htmlFor="titulo"
                className="mb-1 block text-xs font-medium text-zinc-300"
              >
                Título
              </label>

              <Input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  setMensaje("");
                }}
                placeholder="Ejemplo: Lista de servicios"
                required
              />
            </div>

            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <label
                  htmlFor="contenido"
                  className="block text-sm font-medium text-zinc-300"
                >
                  Contenido
                </label>

                <span className="text-xs text-zinc-600">
                  {contenido.length} caracteres
                </span>
              </div>

              <textarea
                id="contenido"
                value={contenido}
                onChange={(event) => {
                  setContenido(event.target.value);
                  setMensaje("");
                }}
                placeholder="Escribí toda la información que la IA debe conocer."
                rows={5}
                className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-5 text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500"
              />
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-xs font-medium text-zinc-300">
                Archivo
              </label>

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setArrastrando(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setArrastrando(false)}
                onDrop={handleDrop}
                className={`rounded-xl border border-dashed px-4 py-3 text-center transition ${
                  arrastrando
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                }`}
              >
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm">
                  📄
                </div>

                <p className="mt-2 text-xs font-medium text-white">
                  Arrastrá un archivo o seleccionalo
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-zinc-600">
                  PDF, DOCX o TXT. Máximo 10 MB.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleArchivoChange}
                  className="hidden"
                />

                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                </div>
              </div>

              {archivo && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {archivo.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatearTamano(archivo.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => seleccionarArchivo(null)}
                    className="text-xs font-medium text-red-400 transition hover:text-red-300"
                  >
                    Quitar
                  </button>
                </div>
              )}

              {editandoId && (
                <p className="mt-3 text-xs leading-5 text-zinc-600">
                  Si no seleccionás un archivo nuevo, se conservará la
                  información actual.
                </p>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="submit"
                disabled={guardando}
                className="flex-1"
              >
                {guardando
                  ? editandoId
                    ? "Actualizando..."
                    : "Guardando..."
                  : editandoId
                    ? "Actualizar información"
                    : "Agregar a la base"}
              </Button>

              {editandoId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    limpiarFormulario();
                    setError("");
                    setMensaje("");
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </Card>
        </form>

        <Card className="h-fit overflow-hidden">
          <div className="border-b border-zinc-800 p-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Información cargada
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Todo lo que aparece acá podrá ser utilizado por el agente.
                </p>
              </div>

              <div className="w-full lg:max-w-[260px]">
                <Input
                  id="buscarConocimiento"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar información..."
                />
              </div>
            </div>
          </div>

          {cargandoLista ? (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
              <p className="text-sm text-zinc-400">
                Cargando información...
              </p>
            </div>
          ) : conocimientosFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                📚
              </div>

              <h3 className="mt-3 text-base font-semibold text-white">
                {conocimientos.length === 0
                  ? "Todavía no cargaste información"
                  : "No encontramos resultados"}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">
                {conocimientos.length === 0
                  ? "Agregá el primer contenido para que el agente empiece a responder con información de la empresa."
                  : "Probá con otro término de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {conocimientosFiltrados.map((item) => (
                <article key={item.id} className="p-4">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-white">
                          {item.titulo}
                        </h3>

                        {item.archivoNombre && (
                          <Badge variant="info">
                            {obtenerExtension(item.archivoNombre)}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-400">
                        {item.contenido}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-600">
                        <span>
                          {item.contenido.length.toLocaleString("es-AR")}{" "}
                          caracteres
                        </span>

                        <span>
                          Actualizado {formatearFecha(item.updatedAt)}
                        </span>

                        {item.archivoNombre && (
                          <span className="max-w-[260px] truncate">
                            {item.archivoNombre}
                          </span>
                        )}
                      </div>

                      {item.archivoUrl && (
                        <a
                          href={item.archivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-medium text-blue-400 transition hover:text-blue-300"
                        >
                          Ver archivo original
                        </a>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditar(item)}
                      >
                        Editar
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEliminar(item.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function formatearTamano(bytes: number) {
  if (bytes === 0) return "0 KB";

  const megabytes = bytes / (1024 * 1024);

  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatearFecha(fecha?: Timestamp) {
  if (!fecha) return "sin fecha";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fecha.toDate());
}

function obtenerExtension(nombreArchivo: string) {
  return nombreArchivo.split(".").pop()?.toUpperCase() || "ARCHIVO";
}