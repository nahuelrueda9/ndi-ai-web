"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
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
  Code2,
  CreditCard,
  HelpCircle,
  Home,
  MessageSquare,
  Package,
  Plug,
  Settings,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
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
};

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
    cargandoRol,
    setCargandoRol,
  ] = useState(true);

  useEffect(() => {
    const cancelar =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          setUsuario(currentUser);

          if (!currentUser) {
            setRol(null);
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

        const empresa =
          empresaSnapshot.data() as EmpresaData;

        if (
          empresa.userId ===
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
            roles:
              TODOS_LOS_ROLES,
          },
          {
            label:
              "Conversaciones",
            ruta:
              "conversaciones",
            icon:
              MessageSquare,
            roles:
              TODOS_LOS_ROLES,
          },
          {
            label:
              "Automatizaciones",
            ruta:
              "automatizaciones",
            icon: Zap,
            roles:
              ROLES_SUPERVISION,
          },
          {
            label: "Agenda",
            ruta: "agenda",
            icon: CalendarDays,
            roles:
              TODOS_LOS_ROLES,
          },
          {
            label:
              "Servicios y productos",
            ruta: "catalogo",
            icon: Package,
            roles:
              ROLES_SUPERVISION,
          },
          {
            label: "Equipo",
            ruta: "equipo",
            icon: Users,
            roles:
              ROLES_ADMINISTRACION,
          },
          {
            label:
              "Estadísticas",
            ruta:
              "estadisticas",
            icon: BarChart3,
            roles:
              TODOS_LOS_ROLES,
          },
          {
            label:
              "Base de conocimiento",
            ruta:
              "conocimiento",
            icon: BookOpen,
            roles:
              ROLES_SUPERVISION,
          },
          {
            label: "Widget web",
            ruta: "widget",
            icon: Code2,
            roles:
              ROLES_ADMINISTRACION,
          },
          {
            label:
              "Integraciones",
            ruta:
              "integraciones",
            icon: Plug,
            roles:
              ROLES_SUPERVISION,
          },
          {
            label:
              "Facturación",
            ruta:
              "facturacion",
            icon: CreditCard,
            roles:
              SOLO_PROPIETARIO,
          },
          {
            label:
              "Configuración",
            ruta:
              "configuracion",
            icon: Settings,
            roles:
              ROLES_ADMINISTRACION,
          },
          {
            label: "Ayuda",
            ruta: "ayuda",
            icon: HelpCircle,
            roles:
              TODOS_LOS_ROLES,
          },
        ];
      },
      [empresaId],
    );

  const itemsPermitidos =
    useMemo(
      () =>
        rol
          ? items.filter(
              (item) =>
                item.roles.includes(
                  rol,
                ),
            )
          : [],
      [items, rol],
    );

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
        const href =
          `/empresas/${empresaId}/${item.ruta}`;

        return (
          pathname === href ||
          pathname.startsWith(
            `${href}/`,
          )
        );
      });

    if (
      itemActual &&
      !itemActual.roles.includes(
        rol,
      )
    ) {
      router.replace(
        `/empresas/${empresaId}/conversaciones`,
      );
    }
  }, [
    cargandoRol,
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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white text-slate-900 transition-colors dark:border-zinc-800 dark:bg-zinc-900 dark:text-white md:flex">
      <Link
        href={`/empresas/${empresaId}/dashboard`}
        className="border-b border-slate-200 p-6 transition hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <Bot className="h-6 w-6 text-white" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
              NDI AI
            </p>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Workspace
            </h2>
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-2 p-4">
        {itemsPermitidos.map(
          (item) => {
            const href =
              `/empresas/${empresaId}/${item.ruta}`;

            return (
              <NavItem
                key={href}
                label={item.label}
                href={href}
                icon={item.icon}
                activo={
                  pathname === href ||
                  pathname.startsWith(
                    `${href}/`,
                  )
                }
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
              Agente activo
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
  );
}