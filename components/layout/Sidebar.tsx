"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BarChart3, Bot, Building2, Home, MessageSquare, Settings, BookOpen } from "lucide-react";
import NavItem from "./NavItem";

export default function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const empresaId = Object.values(params)[0] as string;

  const items = [
    { label: "Inicio", href: `/empresas/${empresaId}`, icon: Home },
    { label: "Conversaciones", href: `/empresas/${empresaId}/conversaciones`, icon: MessageSquare },
    { label: "Estadísticas", href: `/empresas/${empresaId}/estadisticas`, icon: BarChart3 },
    { label: "Base de conocimiento", href: `/empresas/${empresaId}/knowledge`, icon: BookOpen, },
    { label: "Configuración", href: `/empresas/${empresaId}/configuracion`, icon: Settings },
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-900 md:flex md:flex-col">
      <div className="border-b border-zinc-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-400">NDI AI</p>
            <h2 className="text-xl font-bold text-white">Workspace</h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {items.map((item) => (
          <NavItem
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            activo={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-white">Agente activo</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Plan Free</p>
        </div>

        <Link href="/empresas" className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800">
          <Building2 className="h-4 w-4" />
          Volver a empresas
        </Link>
      </div>
    </aside>
  );
}
