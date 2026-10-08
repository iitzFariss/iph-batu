import { Menu, Sun, Moon } from "lucide-react";
import UserMenu from "./Usermenu";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  onNavigate?: (page: string) => void;
  onOpenSidebar?: () => void;
}

export default function Header({ onNavigate, onOpenSidebar }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 flex-shrink-0">
      {/* Hamburger — mobile only */}
      {onOpenSidebar && (
        <button
          onClick={onOpenSidebar}
          aria-label="Buka menu navigasi"
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
          title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {theme === "dark" ? (
            <Sun size={15} className="text-gray-500" />
          ) : (
            <Moon size={15} className="text-gray-500" />
          )}
        </button>
        <div className="w-px h-6 bg-gray-100" />
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
}