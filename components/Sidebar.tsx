const menuItems = [
  "Dashboard",
  "Empresas",
  "Leads",
  "Conversaciones",
  "Automatizaciones",
  "Configuración",
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/10 bg-zinc-900 p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-bold">NDI AI</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Plataforma inteligente
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item, index) => (
          <a
            key={item}
            href="#"
            className={
              index === 0
                ? "block rounded-xl bg-white px-4 py-3 font-medium text-black"
                : "block rounded-xl px-4 py-3 text-zinc-300 transition hover:bg-white/5 hover:text-white"
            }
          >
            {item}
          </a>
        ))}
      </nav>
    </aside>
  );
}