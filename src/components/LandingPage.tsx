import { useEffect, useState } from "react";
import { Moon, Sun, ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

interface Point { tahun: number; bulan: number; mingguIndeks: number; iph: number }
interface Summary { latest: Point | null; trend: Point[]; latestDetails: { name: string; nilai: number; isFluktuasi: boolean }[] }
const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const weeks = ["I", "II", "III", "IV", "V"];
const number = (value: number) => `${value > 0 ? "+" : ""}${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PriceLine({ points }: { points: Point[] }) {
  if (!points.length) return <p className="text-sm text-gray-500 py-8">Tren belum tersedia.</p>;
  const min = Math.min(0, ...points.map(row => row.iph));
  const max = Math.max(.1, ...points.map(row => row.iph));
  const y = (value: number) => 135 - (value - min) / (max - min) * 115;
  const x = (index: number) => points.length === 1 ? 200 : 8 + index / (points.length - 1) * 384;
  return <><svg viewBox="0 0 400 160" role="img" aria-label={`Tren IPH ${points[0]?.tahun}. Nilai terakhir ${number(points[points.length - 1]!.iph)} persen.`} preserveAspectRatio="none">
    <line x1="0" x2="400" y1={y(0)} y2={y(0)} stroke="var(--line)" strokeDasharray="4 4" />
    <polyline points={points.map((row, index) => `${x(index)},${y(row.iph)}`).join(" ")} fill="none" stroke="var(--chart)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    <circle cx={x(points.length - 1)} cy={y(points[points.length - 1]!.iph)} r="4" fill="var(--chart)" />
  </svg><div className="flex justify-between text-xs text-gray-500 mt-1"><span>{months[points[0]!.bulan - 1]} M{points[0]!.mingguIndeks}</span><span>{months[points[points.length - 1]!.bulan - 1]} M{points[points.length - 1]!.mingguIndeks}</span></div></>;
}

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  const { isDark, toggleTheme } = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api.get<Summary>("/public/rekap/summary").then(data => { if (!cancelled) { setSummary(data); setState("ready"); } }).catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [reload]);
  const latest = summary?.latest;
  const period = latest ? `Minggu ${weeks[latest.mingguIndeks - 1]} · ${months[latest.bulan - 1]} ${latest.tahun}` : "Periode belum tersedia";
  const commodities = [...(summary?.latestDetails ?? [])].filter(row => !row.isFluktuasi).sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai)).slice(0, 3);
  return <div className={isDark ? "dark" : ""}><div className="landing">
    <nav className="landing-nav" aria-label="Navigasi beranda"><div className="landing-inner">
      <div className="landing-brand"><img src="/bps-logo.png" alt="BPS Kota Batu" /><div><strong>TPID Kota Batu</strong><span>Pengendalian inflasi daerah</span></div></div>
      <div className="flex items-center gap-3"><a href="#panduan" className="text-sm text-gray-600 hidden sm:inline-flex items-center min-h-11">Membaca data</a><button type="button" onClick={toggleTheme} aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"} className="icon-button">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button><button onClick={onLogin} className="secondary-action">Masuk</button></div>
    </div></nav>
    <main className="landing-inner">
      <section className="landing-hero" aria-labelledby="landing-heading">
        <h1 id="landing-heading">Harga Kota Batu,<br /><span>dari pekan ke pekan.</span></h1>
        <aside><p className="intro">Ikuti perkembangan harga pangan melalui rekap IPH mingguan dan andil komoditas di Pasar Besar Kota Batu.</p><div className="landing-actions"><a href="#/publik" className="primary-action">Lihat dashboard publik<ArrowUpRight size={17} /></a></div><p className="text-xs text-gray-500 mt-4">Terbuka untuk masyarakat, tanpa perlu akun.</p></aside>
      </section>
      <section className="landing-data" aria-label="Ringkasan IPH terbaru" aria-live="polite">
        <header><strong>Ringkasan harga terbaru</strong><span className="landing-period">{period}</span></header>
        {state === "loading" ? <p className="p-8 text-sm text-gray-500">Memuat ringkasan harga…</p> : state === "error" ? <div className="p-8"><p className="text-red-600 mb-4">Ringkasan harga belum dapat dimuat.</p><button className="secondary-action" onClick={() => { setState("loading"); setReload(value => value + 1); }}>Coba lagi</button></div> : !latest ? <p className="p-8 text-sm text-gray-500">Belum ada rekap harga yang tersedia. Data akan tampil setelah rekap ditambahkan.</p> : <div className="landing-data-grid">
          <div className="landing-data-stat"><h2 className="text-sm font-medium text-gray-500">IPH pekan terbaru</h2><div className="iph-value">{number(latest.iph)}<small>%</small></div><p>{latest.iph > 0 ? "Harga meningkat" : latest.iph < 0 ? "Harga menurun" : "Harga tidak berubah"} dibandingkan periode acuan.</p></div>
          <div className="landing-data-chart"><h2>Pergerakan IPH {latest.tahun}</h2><PriceLine points={(summary?.trend ?? []).filter(row => row.tahun === latest.tahun)} /></div>
          <div className="landing-commodities"><div className="section-heading"><h2>Andil terbesar</h2><span className="text-xs text-gray-500">Persen poin</span></div><ul className="commodity-list">{commodities.map(row => <li key={row.name}><strong>{row.name}</strong><span className={`text-sm tabular-nums font-medium ${row.nilai > 0 ? "text-amber-600" : "text-emerald-700"}`}>{number(row.nilai)}</span></li>)}</ul>{!commodities.length && <p className="text-sm text-gray-500">Rincian andil belum tersedia.</p>}</div>
        </div>}
      </section>
      <section id="panduan" className="landing-guide"><h2>Membaca arah<br />perubahan harga.</h2><dl>
        <div><dt>Indeks Perkembangan Harga</dt><dd>IPH positif menunjukkan kenaikan harga. IPH negatif menunjukkan penurunan harga dibandingkan periode acuan.</dd></div>
        <div><dt>Andil komoditas</dt><dd>Kontribusi setiap komoditas, dalam persen poin. Rincian dapat bersifat parsial sehingga jumlahnya belum tentu sama dengan IPH.</dd></div>
      </dl></section>
    </main>
    <footer className="landing-inner landing-footer"><span>Tim Pengendalian Inflasi Daerah Kota Batu</span><span>Berdasarkan rekap harga yang tersimpan di sistem.</span></footer>
  </div></div>;
}
