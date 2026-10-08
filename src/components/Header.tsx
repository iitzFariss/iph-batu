import { Menu, Sun, Moon } from "lucide-react";
import UserMenu from "./Usermenu";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  onNavigate?: (page: string) => void;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({ onNavigate, onOpenSidebar, sidebarOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="app-header">
      {onOpenSidebar && (
        <button onClick={onOpenSidebar} className="menu-trigger lg:hidden" aria-label="Buka menu navigasi" aria-controls="app-sidebar" aria-expanded={sidebarOpen}>
          <Menu size={20} aria-hidden="true" /><span>Menu</span>
        </button>
      )}
      <div className="header-context">
        <span className="font-semibold text-gray-900">Pemantauan IPH</span>
        <span className="hidden sm:inline text-gray-500">Kota Batu, Jawa Timur</span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button onClick={toggleTheme} className="icon-button" aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"} title={theme === "dark" ? "Mode terang" : "Mode gelap"}>
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
}
