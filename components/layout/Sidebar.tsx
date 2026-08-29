"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useParams,
  usePathname,
  useRouter,
} from "next/navigation";
import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Clock,
  Code2,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  Globe2,
  MessageSquare,
  Package,
  ShoppingBag,
  Plug,
  X,
  type LucideIcon,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import {
  empresaTieneFuncion,
  type PlanFeature,
  type PlanId,
} from "@/lib/plans/planAccess";
import NavItem from "./NavItem";

type RolEmpresa =
  | "propietario"
  | "administrador"
  | "supervisor"
  | "operador";

type ItemMenu = {
  label: string;
  ruta: string;
  icon: LucideIcon;
  roles: RolEmpresa[];
  feature?: PlanFeature;
};

type EmpresaData = {
  userId?: string;
  rubro?: string;
  plan?: PlanId;
  subscriptionStatus?: string;
  subscriptionEndsAt?: unknown;
};

type MiembroData = {
  rol?: Exclude<
    RolEmpresa,
    "propietario"
  >;
  estado?: "activo" | "inactivo";
};

const TODOS_LOS_ROLES: RolEmpresa[] = [
  "propietario",
  "administrador",
  "supervisor",
  "operador",
];

const ROLES_SUPERVISION: RolEmpresa[] = [
  "propietario",
  "administrador",
  "supervisor",
];

const ROLES_ADMINISTRACION: RolEmpresa[] = [
  "propietario",
  "administrador",
];

const SOLO_PROPIETARIO: RolEmpresa[] = [
  "propietario",
];

function obtenerHrefMenu(
  empresaId: string,
  ruta: string,
) {
  return ruta
    ? `/empresas/${empresaId}/${ruta}`
    : `/empresas/${empresaId}`;
}

function rutaEstaActiva(
  pathname: string,
  href: string,
  ruta: string,
) {
  if (!ruta) {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

const NOMBRE_ROL: Record<
  RolEmpresa,
  string
> = {
  propietario: "Propietario",
  administrador: "Administrador",
  supervisor: "Supervisor",
  operador: "Operador",
};

export default function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const parametroEmpresa =
    params.id ?? params.empresaId;

  const empresaId = Array.isArray(
    parametroEmpresa,
  )
    ? parametroEmpresa[0]
    : (parametroEmpresa as
        | string
        | undefined);

  const [usuario, setUsuario] =
    useState<User | null>(null);

  const [rol, setRol] =
    useState<RolEmpresa | null>(null);

  const [
    empresa,
    setEmpresa,
  ] = useState<EmpresaData | null>(
    null,
  );

  const [
    cargandoRol,
    setCargandoRol,
  ] = useState(true);

  const [
    menuMobileAbierto,
    setMenuMobileAbierto,
  ] = useState(false);

  useEffect(() => {
    const cancelar =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUsuario(currentUser);

          if (!currentUser) {
            setRol(null);
            setEmpresa(null);
            setCargandoRol(false);
          }
        },
      );

    return () => cancelar();
  }, []);

  useEffect(() => {
    if (!empresaId || !usuario) {
      return;
    }

    const empresaIdSeguro =
      empresaId;

    const usuarioSeguro =
      usuario;

    let activo = true;

    async function cargarRol() {
      setCargandoRol(true);

      try {
        const empresaReferencia =
          doc(
            db,
            "companies",
            empresaIdSeguro,
          );

        const empresaSnapshot =
          await getDoc(
            empresaReferencia,
          );

        if (
          !empresaSnapshot.exists()
        ) {
          if (activo) {
            setRol(null);
            router.replace(
              "/empresas",
            );
          }

          return;
        }

        const empresaData =
          empresaSnapshot.data() as EmpresaData;

        if (activo) {
          setEmpresa(empresaData);
        }

        if (
          empresaData.userId ===
          usuarioSeguro.uid
        ) {
          if (activo) {
            setRol(
              "propietario",
            );
          }

          return;
        }

        const miembroReferencia =
          doc(
            db,
            "companies",
            empresaIdSeguro,
            "members",
            usuarioSeguro.uid,
          );

        const miembroSnapshot =
          await getDoc(
            miembroReferencia,
          );

        if (
          !miembroSnapshot.exists()
        ) {
          if (activo) {
            setRol(null);
            router.replace(
              "/empresas",
            );
          }

          return;
        }

        const miembro =
          miembroSnapshot.data() as MiembroData;

        if (
          miembro.estado !==
            "activo" ||
          !miembro.rol
        ) {
          if (activo) {
            setRol(null);
            router.replace(
              "/empresas",
            );
          }

          return;
        }

        if (activo) {
          setRol(miembro.rol);
        }
      } catch (error) {
        console.error(
          "Error al cargar el rol:",
          error,
        );

        if (activo) {
          setRol(null);
          router.replace(
            "/empresas",
          );
        }
      } finally {
        if (activo) {
          setCargandoRol(false);
        }
      }
    }

    void cargarRol();

    return () => {
      activo = false;
    };
  }, [
    empresaId,
    router,
    usuario,
  ]);

  // Clasificación inteligente del rubro
  const rubroConfig = useMemo(() => {
    const r = (empresa?.rubro || "").trim().toLowerCase();

    // 1. Detección prioritaria de Barbería, Peluquería y Estética
    const esBarberiaPeluqueria = [
      "barberia", "barbería", "barbero", "peluqueria", "peluquería", "estilista", "estetica", "estética", "spa", "unas", "uñas"
    ].some((palabra) => r.includes(palabra));

    // 2. Gastronomía evitando colisiones con 'bar' en 'barberia'
    const esGastronomia = !esBarberiaPeluqueria && (
      /\bbar\b/.test(r) ||
      [
        "restaurante", "restaurant", "cafe", "café", "pizzeria", "pizzería", "panaderia", "panadería", "comida", "heladeria", "heladería", "rotiseria", "rotisería"
      ].some((palabra) => r.includes(palabra))
    );

    const esAlojamiento = [
      "hotel", "hostal", "cabaña", "cabana", "cabañas", "cabanas", "alojamiento", "hospedaje"
    ].some((palabra) => r.includes(palabra));

    const esTienda = [
      "tienda", "ropa", "indumentaria", "calzado", "bazar", "kiosco", "almacen", "almacén", "supermercado", "accesorios", "joyeria", "joyería", "electronica", "electrónica"
    ].some((palabra) => r.includes(palabra));

    const esConsultorio = [
      "consultorio", "medico", "médico", "clinica", "clínica", "odontologia", "odontología", "dentista", "psicologia", "psicología", "nutricion", "nutrición", "kinesiologia", "kinesiología"
    ].some((palabra) => r.includes(palabra));

    // Nombres dinámicos
    let labelCatalogo = "Servicios y productos";
    if (esGastronomia) labelCatalogo = "Menú y carta";
    else if (esAlojamiento) labelCatalogo = "Habitaciones";
    else if (esTienda) labelCatalogo = "Catálogo de productos";
    else if (esBarberiaPeluqueria) labelCatalogo = "Servicios y productos";
    else if (esConsultorio) labelCatalogo = "Prestaciones y servicios";

    let labelTurnos = "Turnos y reservas";
    if (esGastronomia || esAlojamiento) labelTurnos = "Reservas";
    else if (esBarberiaPeluqueria || esConsultorio) labelTurnos = "Turnos";

    // Visibilidad condicional
    const muestraTurnos = !esTienda;
    const muestraPedidos = esGastronomia || esTienda;
    const muestraPresupuestos = !esGastronomia && !esTienda && !esBarberiaPeluqueria;

    return {
      labelCatalogo,
      labelTurnos,
      muestraTurnos,
      muestraPedidos,
      muestraPresupuestos,
    };
  }, [empresa?.rubro]);

  const items =
    useMemo<ItemMenu[]>(
      () => {
        if (!empresaId) {
          return [];
        }

        return [
          {
            label: "Inicio",
            ruta: "dashboard",
            icon: Home,
            roles: TODOS_LOS_ROLES,
          },
          {
            label: "Mi página",
            ruta: "",
            icon: Globe2,
            roles: ROLES_ADMINISTRACION,
            feature: "pagina_publica",
          },
          {
            label: rubroConfig.labelCatalogo,
            ruta: "catalogo",
            icon: Package,
            roles: ROLES_SUPERVISION,
            feature: "catalogo",
          },
          {
            label: "Horarios de atención",
            ruta: "horarios",
            icon: Clock,
            roles: TODOS_LOS_ROLES,
            feature: "turnos",
          },
          ...(rubroConfig.muestraTurnos
            ? [
                {
                  label: rubroConfig.labelTurnos,
                  ruta: "agenda",
                  icon: CalendarDays,
                  roles: TODOS_LOS_ROLES,
                  feature: "turnos" as PlanFeature,
                },
              ]
            : []),
          ...(rubroConfig.muestraPedidos
            ? [
                {
                  label: "Pedidos",
                  ruta: "pedidos",
                  icon: ShoppingBag,
                  roles: TODOS_LOS_ROLES,
                  feature: "productos" as PlanFeature,
                },
              ]
            : []),
          ...(rubroConfig.muestraPresupuestos
            ? [
                {
                  label: "Presupuestos",
                  ruta: "presupuestos",
                  icon: FileText,
                  roles: TODOS_LOS_ROLES,
                  feature: "presupuestos" as PlanFeature,
                },
              ]
            : []),
          {
            label: "Métodos de pago",
            ruta: "pagos",
            icon: CreditCard,
            roles: ROLES_ADMINISTRACION,
          },
          {
            label: "Consultas",
            ruta: "conversaciones",
            icon: MessageSquare,
            roles: TODOS_LOS_ROLES,
            feature: "asistente_ia",
          },
          {
            label: "Estadísticas",
            ruta: "estadisticas",
            icon: BarChart3,
            roles: TODOS_LOS_ROLES,
            feature: "estadisticas_basicas",
          },
          {
            label: "Base de conocimiento",
            ruta: "conocimiento",
            icon: BookOpen,
            roles: ROLES_SUPERVISION,
            feature: "asistente_ia",
          },
          {
            label: "Asistente IA",
            ruta: "configuracion",
            icon: Bot,
            roles: ROLES_ADMINISTRACION,
            feature: "asistente_ia",
          },
          {
            label: "Widget web",
            ruta: "widget",
            icon: Code2,
            roles: ROLES_ADMINISTRACION,
            feature: "asistente_ia",
          },
          {
            label: "Facturación",
            ruta: "facturacion",
            icon: CreditCard,
            roles: SOLO_PROPIETARIO,
          },
          {
            label: "Ayuda",
            ruta: "ayuda",
            icon: HelpCircle,
            roles: TODOS_LOS_ROLES,
          },
          {
            label: "Próximamente",
            ruta: "integraciones",
            icon: Plug,
            roles: ROLES_SUPERVISION,
          },
        ];
      },
      [
        empresaId,
        rubroConfig,
      ],
    );

  const itemsPermitidos =
    useMemo(
      () =>
        rol && empresa
          ? items.filter(
              (item) =>
                item.roles.includes(
                  rol,
                ) &&
                (!item.feature ||
                  empresaTieneFuncion(
                    empresa,
                    item.feature,
                  )),
            )
          : [],
      [
        empresa,
        items,
        rol,
      ],
    );

  useEffect(() => {
    setMenuMobileAbierto(false);
  }, [pathname]);

  useEffect(() => {
    function abrirMenuDesdeHeader() {
      setMenuMobileAbierto(true);
    }

    window.addEventListener(
      "ndi-ai:open-mobile-sidebar",
      abrirMenuDesdeHeader,
    );

    return () => {
      window.removeEventListener(
        "ndi-ai:open-mobile-sidebar",
        abrirMenuDesdeHeader,
      );
    };
  }, []);

  useEffect(() => {
    if (
      cargandoRol ||
      !rol ||
      !empresaId
    ) {
      return;
    }

    const itemActual =
      items.find((item) => {
        const href = obtenerHrefMenu(
          empresaId,
          item.ruta,
        );

        return rutaEstaActiva(
          pathname,
          href,
          item.ruta,
        );
      });

    if (itemActual) {
      const rolPermitido =
        itemActual.roles.includes(
          rol,
        );

      const planPermitido =
        !itemActual.feature ||
        (empresa &&
          empresaTieneFuncion(
            empresa,
            itemActual.feature,
          ));

      if (
        !rolPermitido ||
        !planPermitido
      ) {
        router.replace(
          `/empresas/${empresaId}/dashboard`,
        );
      }
    }
  }, [
    cargandoRol,
    empresa,
    empresaId,
    items,
    pathname,
    rol,
    router,
  ]);

  if (
    !empresaId ||
    cargandoRol ||
    !rol
  ) {
    return null;
  }

  return (
    <>
      {/* OVERLAY MOBILE */}
      {menuMobileAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() =>
            setMenuMobileAbierto(false)
          }
          className="fixed inset-0 z-[79] bg-black/55 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* DRAWER MOBILE */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] flex w-[86vw] max-w-[320px] flex-col overflow-y-auto border-r border-slate-200 bg-white text-slate-900 shadow-2xl transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white md:hidden ${
          menuMobileAbierto
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-zinc-800">
          <Link
            href={`/empresas/${empresaId}/dashboard`}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 p-2 shadow-md shadow-blue-600/20">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={20}
                height={20}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                NDI AI
              </p>

              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Panel del negocio
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuMobileAbierto(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {itemsPermitidos.map(
            (item) => {
              const href =
                obtenerHrefMenu(
                  empresaId,
                  item.ruta,
                );

              return (
                <NavItem
                  key={`mobile-${item.label}-${href}`}
                  label={item.label}
                  href={href}
                  icon={item.icon}
                  activo={rutaEstaActiva(
                    pathname,
                    href,
                    item.ruta,
                  )}
                />
              );
            },
          )}
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-zinc-800">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {NOMBRE_ROL[rol]}
              </span>
            </div>
          </div>

          <Link
            href="/empresas"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Building2 className="h-4 w-4" />
            Volver a empresas
          </Link>
        </div>
      </aside>

      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white text-slate-900 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-white md:flex">
        <Link
          href={`/empresas/${empresaId}/dashboard`}
          className="border-b border-slate-200 p-6 transition hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 p-2.5 shadow-md shadow-blue-600/20">
              <Image
                src="/logo-ndi.png"
                alt="Logo NDI"
                width={24}
                height={24}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
                NDI AI
              </p>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Negocio
              </h2>
            </div>
          </div>
        </Link>

        <nav className="flex-1 space-y-2 p-4">
          {itemsPermitidos.map(
            (item) => {
              const href = obtenerHrefMenu(
                empresaId,
                item.ruta,
              );

              return (
                <NavItem
                  key={`${item.label}-${href}`}
                  label={item.label}
                  href={href}
                  icon={item.icon}
                  activo={rutaEstaActiva(
                    pathname,
                    href,
                    item.ruta,
                  )}
                />
              );
            },
          )}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-zinc-800">
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />

              <span className="text-sm text-slate-900 dark:text-white">
                Panel del negocio
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">
              {NOMBRE_ROL[rol]}
            </p>
          </div>

          <Link
            href="/empresas"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Building2 className="h-4 w-4" />
            Volver a empresas
          </Link>
        </div>
      </aside>
    </>
  );
}