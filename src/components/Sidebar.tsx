import {
  LayoutDashboard,
  FileInput,
  Database,
  Users,
  Monitor,
  UserCog,
  TrendingUp,
  Radio,
  Settings,
  HelpCircle,
  Zap,
  Menu,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  open: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "input-rekap", label: "Input Rekap IPH", icon: FileInput },
  { id: "rekapan-data", label: "Rekapan Data", icon: Database },
  { id: "kelola-rapat", label: "Kelola Rapat", icon: Users },
  { id: "monitoring-resume", label: "Monitoring Resume", icon: Monitor },
  { id: "kelola-pegawai", label: "Kelola Pegawai", icon: UserCog },
  { id: "visualisasi-tren", label: "Visualisasi Tren IPH", icon: TrendingUp },
  { id: "analisis-teks", label: "Analisis Teks Siaran", icon: Radio },
];

const bottomItems = [
  { id: "pengaturan", label: "Pengaturan Sistem", icon: Settings },
  { id: "bantuan", label: "Bantuan Teknis", icon: HelpCircle },
];

export default function Sidebar({ activePage, open, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop — tampil hanya di mobile saat drawer terbuka */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`sidebar-surface fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-tight">TPID Kota Batu</div>
              <div className="text-xs text-gray-400 leading-tight">Sistem Pengendalian IPH</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup menu"
              className="lg:hidden ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

      {/* Quick Action */}
      <div className="px-3 pt-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold border border-emerald-200">
          <Zap size={13} />
          Disposisi Cepat
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom nav */}
        <div className="px-3 pb-4 pt-2 border-t border-gray-100 space-y-0.5">
          {bottomItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}