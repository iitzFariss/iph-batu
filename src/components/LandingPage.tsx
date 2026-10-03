import {
  TrendingDown,
  TrendingUp,
  Eye,
  BarChart2,
  FileText,
  ArrowRight,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface LandingPageProps {
  onLogin: () => void;
}

const features = [
  {
    icon: <Eye size={20} className="text-blue-600" />,
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Pantau Harga Komoditas",
    desc: "Lihat andil harga bahan pokok di Pasar Besar & Pasar Relokasi Batu secara mingguan.",
    points: ["Data diperbarui setiap Jumat", "Dibandingkan pekan sebelumnya"],
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-600" />,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Tren IPH Publik",
    desc: "Grafik indeks perkembangan harga yang mudah dibaca, diperbarui tiap pekan.",
    points: ["Visualisasi tren 12 bulan", "Dibandingkan periode sebelumnya"],
  },
  {
    icon: <FileText size={20} className="text-purple-600" />,
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Siaran Pers Resmi",
    desc: "Akses ringkasan eksekutif dan siaran pers inflasi langsung dari TPID Kota Batu.",
    points: ["Format resmi Kemendagri", "Rilis mengikuti periode survei"],
  },
];

const instansiList = [
  "BPS Kota Batu", "Disperindag", "Dinas Pertanian",
  "Bulog Sub-Divre", "Bank Indonesia", "Satgas Pangan",
];

const LANDING_THEME_KEY = "tpid-landing-theme";

interface PublicSummary {
  latest: {
    tahun: number;
    bulan: number;
    mingguIndeks: number;
    iph: number;
    status: string;
    pemicu: string | null;
    penutupan: boolean;
  } | null;
  trend: { tahun: number }[];
  frequency: { tahun: number; items: { name: string; count: number }[] }[];
  latestDetails: { name: string; nilai: number; isFluktuasi: boolean }[];
}

function useLandingTheme() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem(LANDING_THEME_KEY) === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANDING_THEME_KEY, isDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const { isDark, toggle } = useLandingTheme();
  const [summary, setSummary] = useState<PublicSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PublicSummary>("/public/rekap/summary")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = summary?.latest;
  const bulanSingkat = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const romawi = ["I", "II", "III", "IV", "V"];
  const periodeLabel = latest
    ? `Minggu ${romawi[latest.mingguIndeks - 1] ?? latest.mingguIndeks} ${bulanSingkat[latest.bulan - 1]} ${latest.tahun}`
    : "Memuat data…";
  const iphNilai = latest?.iph ?? 0;
  const isDeflasi = iphNilai < 0;
  const labelIph = latest
    ? latest.status === "deflasi-signifikan" || latest.status === "deflasi-terkendali"
      ? "Deflasi Terkendali"
      : latest.status === "inflasi-ringan" || latest.status === "inflasi-sedang"
      ? "Inflasi Terkendali"
      : "Perlu Intervensi"
    : "Memuat data…";

  const andilTeratas = (summary?.latestDetails ?? [])
    .filter((d) => !d.isFluktuasi)
    .sort((a, b) => b.nilai - a.nilai)
    .slice(0, 4);

  const komoditasCount = new Set(
    (summary?.frequency.find((f) => f.tahun === latest?.tahun)?.items ?? []).map((i) => i.name)
  ).size;
  const mingguData = summary?.trend.filter((t) => t.tahun === latest?.tahun).length ?? 0;
  const tahunAwal = summary?.trend[0]?.tahun;

  const statsList = [
    { value: loading ? "…" : String(komoditasCount), label: "Komoditas Dipantau", desc: latest ? `Terpantau tahun ${latest.tahun}` : "Belum ada data" },
    { value: loading ? "…" : String(mingguData), label: "Minggu Data", desc: latest ? `Tahun ${latest.tahun}` : "Belum ada data" },
    { value: loading ? "…" : String(summary?.trend.length ?? 0), label: "Periode Rekap", desc: tahunAwal ? `Sejak ${tahunAwal}` : "Belum ada data" },
    { value: latest?.pemicu ?? "—", label: "Pemicu Inflasi", desc: loading ? "Memuat data…" : "Andil tertinggi periode ini" },
  ];

  return (
    <div className={`min-h-screen bg-white overflow-x-hidden ${isDark ? "dark" : ""}`}>

      {/* ── Navbar — full width ── */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full px-4 sm:px-8 lg:px-16 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-gray-900 leading-tight">TPID Kota Batu</div>
              <div className="text-[9px] text-gray-400 leading-tight">Sistem Pengendalian Inflasi Daerah</div>
            </div>
          </div>

          {/* Center nav links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-medium text-gray-500">
            <span className="hover:text-gray-800 cursor-pointer">Data Harga</span>
            <span className="hover:text-gray-800 cursor-pointer">Tren IPH</span>
            <span className="hover:text-gray-800 cursor-pointer">Siaran Pers</span>
            <span className="hover:text-gray-800 cursor-pointer">Tentang TPID</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400">
              <MapPin size={10} />
              Kota Batu, Jawa Timur
            </div>
            <button
              onClick={toggle}
              aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
              title={isDark ? "Mode terang" : "Mode gelap"}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={onLogin}
              className="px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero — full bleed dengan split layout ── */}
      <section className="w-full bg-white">
        <div className="w-full px-4 sm:px-8 lg:px-16 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center">

          {/* Left: copy — dipusatkan & diperbesar */}
          <div className="flex flex-col justify-center lg:pl-8">
            <p className="text-xs font-semibold text-gray-400 mb-6">
              Periode data {periodeLabel}
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.1] mb-5">
              Pantau Stabilitas<br />
              Harga Pangan<br />
              <span className="text-emerald-600">Kota Batu.</span>
            </h1>

            <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-lg">
              Platform resmi Tim Pengendali Inflasi Daerah (TPID) untuk memantau
              indeks harga komoditas pangan dan koordinasi pengendalian inflasi daerah
              Kota Batu secara transparan.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex-1 sm:flex-none justify-center"
              >
                Masuk sebagai Tamu
                <ArrowRight size={15} />
              </button>
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-7 py-3.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex-1 sm:flex-none justify-center"
              >
                Masuk sebagai Petugas
              </button>
            </div>

            {/* Instansi strip — chip lebih besar */}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">
                Terintegrasi dengan
              </p>
              <div className="flex flex-wrap gap-2">
                {instansiList.map((inst) => (
                  <span
                    key={inst}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium rounded-lg"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: IPH live card — fills the column */}
          <div className="flex items-center justify-center">
            <div className="w-full bg-gray-950 rounded-3xl p-8 text-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                  IPH Terkini
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {latest ? "Terakhir" : "Memuat"}
                </div>
              </div>
              <div className="text-[11px] text-gray-500 mb-4">{periodeLabel}</div>

              {/* IPH value */}
              <div className={`text-5xl font-black mb-1 ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                {iphNilai > 0 ? "+" : ""}{iphNilai.toFixed(2)}%
              </div>
              <div className="flex items-center gap-1.5 mb-6">
                {isDeflasi
                  ? <TrendingDown size={14} className="text-emerald-400" />
                  : <TrendingUp size={14} className="text-amber-400" />}
                <span className={`text-sm font-bold ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                  {labelIph}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-800 mb-5" />

              {/* Commodity rows */}
              <div className="space-y-3">
                {loading && (
                  <div className="text-[12px] text-gray-500">Memuat data…</div>
                )}
                {!loading && andilTeratas.length === 0 && (
                  <div className="text-[12px] text-gray-500">Belum ada data andil.</div>
                )}
                {andilTeratas.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-gray-400 truncate">{d.name}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-gray-500">andil</span>
                      <span
                        className={`text-[12px] font-black w-16 text-right ${
                          d.nilai > 0 ? "text-red-400" : d.nilai < 0 ? "text-emerald-400" : "text-gray-500"
                        }`}
                      >
                        {d.nilai > 0 ? "+" : ""}
                        {d.nilai.toFixed(2)} poin
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center gap-2">
                <span className="text-[10px] text-gray-500">Sumber: BPS Kota Batu, survei harga mingguan</span>
                <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                  <RefreshCw size={9} />
                  Periode {periodeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar — full width ── */}
      <section className="w-full bg-gray-950 border-y border-gray-800">
        <div className="w-full px-4 sm:px-8 lg:px-16 py-6 grid grid-cols-2 lg:grid-cols-4 gap-y-6">
          {statsList.map(({ value, label, desc }, i) => (
            <div
              key={label}
              className={`text-center px-4 sm:px-8 ${
                i % 2 === 0 && i < 2 ? "border-r border-gray-800" : ""
              } ${i < 3 ? "lg:border-r" : ""}`}
            >
              <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">{value}</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-300">{label}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features — full width 3-col ── */}
      <section className="w-full bg-white py-12 lg:py-14">
        <div className="w-full px-4 sm:px-8 lg:px-16">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-2">
                Informasi Publik Terbuka
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Informasi harga pangan,<br />transparan dan terbuka.
              </h2>
            </div>
            <div className="lg:text-right">
              <p className="text-sm text-gray-400 mb-3">Tanpa pendaftaran — cukup masuk sebagai tamu.</p>
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Masuk sebagai Tamu <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Feature cards — fills full width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon, bg, border, title, desc, points }) => (
              <div
                key={title}
                className={`bg-white border-2 ${border} rounded-2xl p-6 sm:p-7 hover:shadow-md transition-all group`}
              >
                <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center mb-5`}>
                  {icon}
                </div>
                <div className="text-base font-black text-gray-900 mb-2">{title}</div>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{desc}</p>
                <div className="space-y-1.5">
                  {points.map((pt) => (
                    <div key={pt} className="flex items-center gap-2">
                      <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-[11px] text-gray-500">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Petugas CTA — full bleed dark ── */}
      <section className="w-full bg-gray-950 py-10 lg:py-14">
        <div className="w-full px-4 sm:px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mb-3">
              Untuk Aparatur & Petugas TPID
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-white mb-4 leading-tight">
              Akses penuh sistem<br />pengendalian inflasi daerah.
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
              Input rekap IPH mingguan, kelola jadwal rapat koordinasi, monitor
              notulensi resume, distribusi siaran pers ke Kemendagri — semua dalam
              satu platform terintegrasi.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { icon: "📊", label: "Input & verifikasi data IPH mingguan" },
              { icon: "📅", label: "Kelola jadwal & notulensi rapat koordinasi" },
              { icon: "📡", label: "Distribusi otomatis siaran pers ke Kemendagri" },
              { icon: "👥", label: "Manajemen tim & direktori pegawai TPID" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm text-gray-300">{label}</span>
              </div>
            ))}
            <button
              onClick={onLogin}
              className="mt-2 flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors w-fit"
            >
              Masuk sebagai Petugas
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer — full width ── */}
      <footer className="w-full bg-white border-t border-gray-100 py-6">
        <div className="w-full px-4 sm:px-8 lg:px-16 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={11} className="text-white" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              © 2026 TPID Kota Batu • Bagian Perekonomian Setda Kota Batu
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            Data IPH Kota Batu
          </div>
        </div>
      </footer>

    </div>
  );
}