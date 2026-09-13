import { NavLink } from "react-router-dom";
import { BookOpen, Library, Activity, FileText, Moon } from "lucide-react";

interface SidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const links = [
  { to: "/", label: "Biblioteca", icon: Library, end: true },
  { to: "/progresso", label: "Progresso", icon: Activity, end: false },
  { to: "/notas", label: "Notas", icon: FileText, end: false },
];

export default function Sidebar({ darkMode, onToggleDarkMode }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-black/5 dark:border-white/5 flex flex-col justify-between py-6 px-4">
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-terracota text-white flex items-center justify-center">
            <BookOpen size={16} />
          </div>
          <span className="font-bold text-[17px]">Leitura</span>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active font-semibold" : ""}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button onClick={onToggleDarkMode} className="nav-item">
        <Moon size={18} />
        Modo escuro
      </button>
    </aside>
  );
}
