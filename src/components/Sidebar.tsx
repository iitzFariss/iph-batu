import { useEffect, useRef } from "react";
import { LayoutDashboard, FileInput, Database, Users, Monitor, UserCog, TrendingUp, Radio, X } from "lucide-react";

interface SidebarProps {
  activePage: string;
  open: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
  hiddenPages?: string[];
}

const navGroups = [
  { label: "Data harga", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "input-rekap", label: "Input rekap IPH", icon: FileInput },
    { id: "rekapan-data", label: "Rekap data IPH", icon: Database },
    { id: "visualisasi-tren", label: "Tren IPH", icon: TrendingUp },
    { id: "analisis-teks", label: "Draf siaran pers", icon: Radio },
  ] },
  { label: "Koordinasi", items: [
    { id: "kelola-rapat", label: "Jadwal rapat", icon: Users },
    { id: "monitoring-rapat", label: "Pemantauan rapat", icon: Monitor },
    { id: "kelola-pegawai", label: "Kelola pegawai", icon: UserCog },
  ] },
];

export default function Sidebar({ activePage, open, onNavigate, onClose, hiddenPages = [] }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button') ?? []).filter((item) => item.getClientRects().length);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); previousFocus?.focus(); };
  }, [open, onClose]);
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside ref={sidebarRef} id="app-sidebar" aria-label="Navigasi utama" className={`app-sidebar sidebar-surface ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><TrendingUp size={21} aria-hidden="true" /></div>
          <div className="min-w-0"><div className="font-bold text-gray-900">TPID Kota Batu</div><div className="text-xs text-gray-500 mt-1">Pemantauan IPH</div></div>
          <button onClick={onClose} aria-label="Tutup menu" className="icon-button lg:hidden ml-auto"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => {
            const items = group.items.filter(({ id }) => !hiddenPages.includes(id));
            if (!items.length) return null;
            return (
              <div key={group.label} className="mb-7">
                <p className="px-3 mb-2 text-xs font-medium text-gray-500">{group.label}</p>
                {items.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => onNavigate(id)} aria-current={activePage === id ? "page" : undefined} className={`sidebar-link ${activePage === id ? "is-active" : ""}`}>
                    <Icon size={18} aria-hidden="true" /><span>{label}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer"><span className="font-semibold text-gray-700">Indeks Perkembangan Harga</span><span>Rekap mingguan Kota Batu</span></div>
      </aside>
    </>
  );
}
