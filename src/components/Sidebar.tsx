import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";

interface SidebarProps {
  activePage: string;
  open: boolean;
  onNavigate: (page: string) => void;
  onClose: () => void;
  hiddenPages?: string[];
}
const navItems = [
  { id: "dashboard", label: "Dashboard", group: "Pemantauan harga" },
  { id: "input-rekap", label: "Input rekap IPH", group: "Pemantauan harga" },
  { id: "rekapan-data", label: "Rekap data", group: "Pemantauan harga" },
  { id: "visualisasi-tren", label: "Visualisasi tren", group: "Pemantauan harga" },
  { id: "kelola-rapat", label: "Kelola rapat", group: "Rapat TPID" },
  { id: "monitoring-rapat", label: "Monitoring rapat", group: "Rapat TPID" },
  { id: "analisis-teks", label: "Analisis teks siaran", group: "Rapat TPID" },
  { id: "hasil-rapat", label: "Hasil rapat", group: "Rapat TPID" },
  { id: "kelola-pegawai", label: "Kelola pegawai", group: "Administrasi" },
];

export default function Sidebar({ activePage, open, onNavigate, onClose, hiddenPages = [] }: SidebarProps) {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const changed = () => setDesktop(media.matches);
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, []);
  const dialogRef = useDialogFocus<HTMLElement>(onClose, open && !desktop);
  return <>
    {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
    <aside ref={dialogRef} role={open && !desktop ? "dialog" : undefined} aria-modal={open && !desktop ? true : undefined} inert={!open && !desktop} aria-label="Navigasi utama" className={`sidebar-surface fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
      <div className="sidebar-brand"><img src="/bps-logo.png" alt="BPS Kota Batu" /><div><strong>TPID Kota Batu</strong><span>Pengendalian inflasi daerah</span></div><button onClick={onClose} aria-label="Tutup menu" className="sidebar-close lg:hidden"><X size={18} /></button></div>
      <nav className="sidebar-nav flex-1 overflow-y-auto" aria-label="Halaman aplikasi">
        {["Pemantauan harga", "Rapat TPID", "Administrasi"].map(group => {
          const items = navItems.filter(item => item.group === group && !hiddenPages.includes(item.id));
          return items.length > 0 && <div key={group}><p className="sidebar-group">{group}</p>{items.map(({ id, label }) => <button key={id} aria-current={activePage === id ? "page" : undefined} onClick={() => onNavigate(id)}>{label}</button>)}</div>;
        })}
      </nav>
      <div className="sidebar-footer"><a href="/#/publik" target="_blank" rel="noopener noreferrer">Dashboard publik<ExternalLink size={12} /></a><p>Tim Pengendalian Inflasi Daerah<br />Kota Batu</p></div>
    </aside>
  </>;
}
