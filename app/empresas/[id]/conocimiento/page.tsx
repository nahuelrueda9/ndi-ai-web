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
import {
  empresaTieneFuncion,
  type PlanId,
} from "@/lib/plans/planAccess";
import Badge from "@/components/Ui/Badge";
import Button from "@/components/Ui/Button";
import Card from "@/components/Ui/Card";
import Input from "@/components/Ui/Input";

interface Empresa {
  nombre: string;
  userId: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
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
  const [puedeUsarConocimiento, setPuedeUsarConocimiento] =
    useState(false);
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

          const accesoConocimiento =
            empresaTieneFuncion(
              empresa,
              "asistente_ia",
            );

          if (!accesoConocimiento) {
            setPuedeUsarConocimiento(false);
            router.replace(
              `/empresas/${empresaId}/dashboard`,
            );
            return;
          }

          setPuedeUsarConocimiento(true);
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
    if (
      !user ||
      !empresaId ||
      !puedeUsarConocimiento
    ) {
      setCargandoLista(false);
      return;
    }

    setCargandoLista(true);

    const conocimientoQuery = query(
      collection(db, "knowledge"),
      where("empresaId", "==", empresaId),
      where("userId", "==", user.uid)
    );

    const unsubscribeConocimiento = onSnapshot(
      conocimientoQuery,
      (snapshot) => {
        const datos = snapshot.docs
          .map((documento) => ({
            id: documento.id,
            ...(documento.data() as Omit<Conocimiento, "id">),
          }))
          .sort((a, b) => {
            const fechaA = a.createdAt?.toMillis?.() ?? 0;
            const fechaB = b.createdAt?.toMillis?.() ?? 0;
            return fechaB - fechaA;
          });

        setConocimientos(datos);
        setCargandoLista(false);
      },
      (firebaseError) => {
        console.error(
          "Error al cargar la base de conocimiento:",
          firebaseError
        );

        setError(
          firebaseError.code === "permission-denied"
            ? "No hay permisos para leer la base de conocimiento."
            : firebaseError.code === "failed-precondition"
              ? "Firestore requiere un índice para esta consulta."
              : `No se pudo cargar la base de conocimiento (${firebaseError.code}).`
        );
        setCargandoLista(false);
      }
    );

    return () => unsubscribeConocimiento();
  }, [
    empresaId,
    puedeUsarConocimiento,
    user,
  ]);

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

    if (
      !user ||
      !empresaId ||
      !puedeUsarConocimiento
    ) {
      return;
    }

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
    if (!puedeUsarConocimiento) {
      return;
    }

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
      <section className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-6 sm:py-4">
        <Card className="p-6 text-center sm:p-10">
          <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 sm:mb-4 sm:h-8 sm:w-8" />
          <p className="text-xs font-medium text-slate-900 dark:text-white sm:text-base">
            Cargando base de conocimiento...
          </p>
        </Card>
      </section>
    );
  }

  if (error && !empresaNombre) {
    return (
      <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
        <Card className="border-red-200 bg-red-50 p-5 text-center dark:border-red-500/20 dark:bg-red-500/10 sm:p-8">
          <p className="text-xs font-medium text-red-700 dark:text-red-300 sm:text-base">{error}</p>

          <div className="mt-2.5 sm:mt-3">
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
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-8 sm:py-8">
      <header className="mb-3 flex items-end justify-between gap-2 sm:mb-4 sm:flex-col sm:items-stretch sm:gap-3 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 sm:text-sm">
            {empresaNombre}
          </p>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:mt-1 sm:gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Base de conocimiento
            </h1>

            <Badge variant="info">
              {conocimientos.length}{" "}
              {conocimientos.length === 1 ? "entrada" : "entradas"}
            </Badge>
          </div>

          <p className="mt-0.5 max-w-xl text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-1 sm:max-w-2xl sm:text-xs sm:leading-5">
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

      <div className="mb-3 grid grid-cols-3 gap-2 sm:mb-4 sm:gap-3">
        <Card className="p-2.5 sm:p-3.5">
          <p className="text-[8px] leading-3 uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px] sm:leading-normal">
            Entradas cargadas
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-xl">
            {conocimientos.length}
          </p>
        </Card>

        <Card className="p-2.5 sm:p-3.5">
          <p className="text-[8px] leading-3 uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px] sm:leading-normal">
            Con archivo
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-xl">
            {documentosConArchivo}
          </p>
        </Card>

        <Card className="p-2.5 sm:p-3.5">
          <p className="text-[8px] leading-3 uppercase tracking-wide text-slate-500 dark:text-zinc-500 sm:text-[10px] sm:leading-normal">
            Caracteres disponibles
          </p>
          <p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white sm:mt-1 sm:text-xl">
            {totalCaracteres.toLocaleString("es-AR")}
          </p>
        </Card>
      </div>

      {error && (
        <Card className="mb-3 border-red-200 bg-red-50 p-2.5 dark:border-red-500/20 dark:bg-red-500/10 sm:mb-4 sm:p-3">
          <p className="text-xs text-red-700 dark:text-red-300 sm:text-sm">{error}</p>
        </Card>
      )}

      {mensaje && (
        <Card className="mb-3 border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10 sm:mb-4 sm:p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300 sm:text-sm">{mensaje}</p>
        </Card>
      )}

      <div className="grid items-start gap-3 sm:gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleAgregar} className="h-fit">
          <Card className="p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
                  {editandoId
                    ? "Editar información"
                    : "Agregar información"}
                </h2>

                {editandoId && (
                  <Badge variant="warning">Editando</Badge>
                )}
              </div>

              <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs sm:leading-5">
                Podés escribir el contenido manualmente, subir un documento o
                combinar las dos opciones.
              </p>
            </div>

            <div>
              <label
                htmlFor="titulo"
                className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:text-xs"
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

            <div className="mt-2.5 sm:mt-3">
              <div className="mb-1 flex items-center justify-between gap-2 sm:gap-3">
                <label
                  htmlFor="contenido"
                  className="block text-xs font-medium text-slate-700 dark:text-zinc-300 sm:text-sm"
                >
                  Contenido
                </label>

                <span className="text-[10px] text-slate-500 dark:text-zinc-400 sm:text-xs">
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
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[11px] leading-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 sm:px-3 sm:text-xs sm:leading-5"
              />
            </div>

            <div className="mt-3 sm:mt-5">
              <label className="mb-1 block text-[10px] font-medium text-slate-700 dark:text-zinc-300 sm:text-xs">
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
                className={`rounded-lg border border-dashed px-3 py-2.5 text-center transition sm:rounded-xl sm:px-4 sm:py-3 ${
                  arrastrando
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700"
                }`}
              >
                <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-xs sm:h-8 sm:w-8 sm:rounded-lg sm:text-sm">
                  📄
                </div>

                <p className="mt-1.5 text-[10px] font-medium text-slate-900 dark:text-white sm:mt-2 sm:text-xs">
                  Arrastrá un archivo o seleccionalo
                </p>

                <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-zinc-400 sm:text-[10px] sm:leading-4">
                  PDF, DOCX o TXT. Máximo 10 MB.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleArchivoChange}
                  className="hidden"
                />

                <div className="mt-1.5 sm:mt-2">
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
                <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950 sm:mt-3 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-900 dark:text-white sm:text-sm">
                      {archivo.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-500 dark:text-zinc-400 sm:mt-1 sm:text-xs">
                      {formatearTamano(archivo.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => seleccionarArchivo(null)}
                    className="text-[10px] font-medium text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 sm:text-xs"
                  >
                    Quitar
                  </button>
                </div>
              )}

              {editandoId && (
                <p className="mt-2 text-[9px] leading-4 text-slate-500 dark:text-zinc-400 sm:mt-3 sm:text-xs sm:leading-5">
                  Si no seleccionás un archivo nuevo, se conservará la
                  información actual.
                </p>
              )}
            </div>

            <div className="mt-2.5 flex gap-1.5 sm:mt-3 sm:gap-2">
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
          <div className="border-b border-slate-200 p-3 dark:border-zinc-800 sm:p-4">
            <div className="flex flex-col justify-between gap-2 sm:gap-3 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white sm:text-base">
                  Información cargada
                </h2>

                <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-zinc-400 sm:text-xs sm:leading-normal">
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
            <div className="p-4 text-center sm:p-6">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 sm:mb-4 sm:h-8 sm:w-8" />
              <p className="text-xs text-slate-500 dark:text-zinc-400 sm:text-sm">
                Cargando información...
              </p>
            </div>
          ) : conocimientosFiltrados.length === 0 ? (
            <div className="p-5 text-center sm:p-8">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-sm sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg">
                📚
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-950 dark:text-white sm:mt-3 sm:text-base">
                {conocimientos.length === 0
                  ? "Todavía no cargaste información"
                  : "No encontramos resultados"}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-[10px] leading-4 text-slate-500 dark:text-zinc-400 sm:text-xs sm:leading-5">
                {conocimientos.length === 0
                  ? "Agregá el primer contenido para que el agente empiece a responder con información de la empresa."
                  : "Probá con otro término de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-zinc-800">
              {conocimientosFiltrados.map((item) => (
                <article key={item.id} className="p-3 sm:p-4">
                  <div className="flex flex-col justify-between gap-2.5 sm:gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                        <h3 className="text-xs font-semibold text-slate-950 dark:text-white sm:text-base">
                          {item.titulo}
                        </h3>

                        {item.archivoNombre && (
                          <Badge variant="info">
                            {obtenerExtension(item.archivoNombre)}
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words text-[10px] leading-4 text-slate-600 dark:text-zinc-400 sm:mt-2 sm:line-clamp-3 sm:text-xs sm:leading-5">
                        {item.contenido}
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 dark:text-zinc-500 sm:mt-4 sm:flex sm:flex-wrap sm:gap-4 sm:text-xs">
                        <span>
                          {item.contenido.length.toLocaleString("es-AR")}{" "}
                          caracteres
                        </span>

                        <span>
                          Actualizado {formatearFecha(item.updatedAt)}
                        </span>

                        {item.archivoNombre && (
                          <span className="col-span-2 max-w-full truncate sm:col-span-1 sm:max-w-[260px]">
                            {item.archivoNombre}
                          </span>
                        )}
                      </div>

                      {item.archivoUrl && (
                        <a
                          href={item.archivoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-[10px] font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 sm:mt-4 sm:text-sm"
                        >
                          Ver archivo original
                        </a>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1.5 sm:gap-2">
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