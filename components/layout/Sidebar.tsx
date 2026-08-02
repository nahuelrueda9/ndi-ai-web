"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Code2,
  Home,
  MessageSquare,
  Plug,
  Settings,
} from "lucide-react";

import NavItem from "./NavItem";

export default function Sidebar() {
  const params = useParams();
  const pathname = usePathname();

  const parametroEmpresa = params.id ?? params.empresaId;

  const empresaId = Array.isArray(parametroEmpresa)
    ? parametroEmpresa[0]
    : (parametroEmpresa as string | undefined);

  if (!empresaId) {
    return null;
  }

  const items = [
    {
      label: "Inicio",
      href: `/empresas/${empresaId}/dashboard`,
      icon: Home,
    },
    {
      label: "Conversaciones",
      href: `/empresas/${empresaId}/conversaciones`,
      icon: MessageSquare,
    },
    {
      label: "Estadísticas",
      href: `/empresas/${empresaId}/estadisticas`,
      icon: BarChart3,
    },
    {
      label: "Base de conocimiento",
      href: `/empresas/${empresaId}/conocimiento`,
      icon: BookOpen,
    },
    {
      label: "Widget web",
      href: `/empresas/${empresaId}/widget`,
      icon: Code2,
    },
    {
      label: "Integraciones",
      href: `/empresas/${empresaId}/integraciones`,
      icon: Plug,
    },
    {
      label: "Configuración",
      href: `/empresas/${empresaId}/configuracion`,
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900 md:flex">
      <Link
        href={`/empresas/${empresaId}/dashboard`}
        className="border-b border-zinc-800 p-6 transition hover:bg-zinc-800/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <Bot className="h-6 w-6 text-white" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400">
              NDI AI
            </p>

            <h2 className="text-xl font-bold text-white">
              Workspace
            </h2>
          </div>
        </div>
      </Link>

      <nav className="flex-1 space-y-2 p-4">
        {items.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            activo={
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)
            }
          />
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />

            <span className="text-sm text-white">
              Agente activo
            </span>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Plan Free
          </p>
        </div>

        <Link
          href="/empresas"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          <Building2 className="h-4 w-4" />
          Volver a empresas
        </Link>
      </div>
    </aside>
  );
}