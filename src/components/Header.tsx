import { Menu, Sun, Moon, ChevronRight } from "lucide-react";
import UserMenu from "./Usermenu";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  title?: string;
  onNavigate?: (page: string) => void;
  onOpenSidebar?: () => void;
}

export default function Header({ onNavigate, onOpenSidebar, title = "Dashboard" }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  return <header className="workspace-header">
    {onOpenSidebar && <button onClick={onOpenSidebar} aria-label="Buka menu navigasi" className="lg:hidden flex items-center gap-2 text-sm text-gray-600"><Menu size={19} />Menu</button>}
    <div className="workspace-caption"><span>Ruang kerja</span><ChevronRight size={12} aria-hidden="true" /><b>{title}</b></div>
    <div className="workspace-header-actions">
      <button onClick={toggleTheme} aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"} className="icon-button">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
      <UserMenu onNavigate={onNavigate} />
    </div>
  </header>;
}
