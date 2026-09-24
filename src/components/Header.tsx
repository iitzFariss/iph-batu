import { Menu, Search, Download, Bell, Sun, Moon } from "lucide-react";
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

      {/* Nav tabs */}
      <nav className="hidden md:flex items-center gap-1">
        {[
          { label: "TPID Kota Batu", active: false },
          { label: "Monitoring IPH", active: false },
        ].map(({ label, active }) => (
          <button
            key={label}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Search — full baris di mobile */}
      <div className="relative order-last md:order-none w-full md:w-auto md:flex-1">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari komoditas, data IPH, atau jadwal..."
          className="w-full pl-8 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
          <Download size={12} />
          <span className="hidden sm:inline">Unduh Rekap IPH</span>
        </button>
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
        <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={15} className="text-gray-500" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-px h-6 bg-gray-100" />
        <UserMenu onNavigate={onNavigate} />
      </div>
    </header>
  );
}