import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function PublicHeader({ onGoBack }: { onGoBack?: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  return <header className="landing-nav"><div className="landing-inner">
    <a href="/" className="landing-brand" onClick={onGoBack ? event => { event.preventDefault(); onGoBack(); } : undefined}><img src="/bps-logo.png" alt="BPS Kota Batu" /><div><strong>TPID Kota Batu</strong><span>Pengendalian inflasi daerah</span></div></a>
    <div className="flex items-center gap-3"><button onClick={toggleTheme} className="icon-button" aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>{onGoBack ? <button onClick={onGoBack} className="text-action" aria-label="Kembali ke beranda">Beranda</button> : <a href="/" className="text-action">Beranda</a>}</div>
  </div></header>;
}
