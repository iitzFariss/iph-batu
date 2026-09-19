import {
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Eye,
  BarChart2,
  FileText,
  ArrowRight,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

// ─── Live IPH snapshot (data publik) ─────────────────────────────────────────

const iphSnapshot = {
  nilai: -0.42,
  label: "Deflasi Terkendali",
  periode: "Minggu III April 2026",
  syncedAt: "20 Apr 2026, 08:30 WIB",
};

const commodityHighlights = [
  { name: "Beras Medium",    price: "Rp 13.200", change: -0.25, unit: "/kg"    },
  { name: "Cabai Rawit",     price: "Rp 38.500", change:  0.18, unit: "/kg"    },
  { name: "Daging Ayam Ras", price: "Rp 34.800", change: -0.12, unit: "/kg"    },
  { name: "Minyak Goreng",   price: "Rp 15.700", change:  0.00, unit: "/liter" },
];

const features = [
  {
    icon: <Eye size={18} className="text-blue-600" />,
    bg: "bg-blue-50",
    title: "Pantau Harga Komoditas",
    desc: "Lihat harga 20 bahan pokok di Pasar Besar & Pasar Relokasi Batu secara mingguan.",
  },
  {
    icon: <BarChart2 size={18} className="text-emerald-600" />,
    bg: "bg-emerald-50",
    title: "Tren IPH Publik",
    desc: "Grafik indeks perkembangan harga yang mudah dibaca, diperbarui tiap pekan.",
  },
  {
    icon: <FileText size={18} className="text-purple-600" />,
    bg: "bg-purple-50",
    title: "Siaran Pers Resmi",
    desc: "Akses ringkasan eksekutif dan siaran pers inflasi langsung dari TPID Kota Batu.",
  },
];

const stats = [
  { value: "20",   label: "Komoditas Dipantau"   },
  { value: "52",   label: "Minggu Data (2026)"   },
  { value: "3",    label: "Pasar Referensi"       },
  { value: "100%", label: "Terverifikasi BPS"     },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const isDeflasi = iphSnapshot.nilai < 0;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
              <TrendingDown size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-gray-900 leading-tight">TPID Kota Batu</div>
              <div className="text-[9px] text-gray-400 leading-tight">Sistem Pengendalian Inflasi Daerah</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-400 mr-2">
              <MapPin size={10} />
              Kota Batu, Jawa Timur
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={onRegister}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Daftar
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-12">
        <div className="grid grid-cols-[1fr_300px] gap-10 items-center">

          {/* Left copy */}
          <div>
            {/* Live badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Data Terverifikasi BPS • {iphSnapshot.syncedAt}
            </div>

            <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
              Pantau Stabilitas Harga<br />
              Pangan Kota Batu,<br />
              <span className="text-emerald-600">Secara Realtime.</span>
            </h1>

            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-md">
              Platform resmi Tim Pengendali Inflasi Daerah (TPID) Kota Batu untuk memantau
              indeks harga komoditas pangan dan koordinasi pengendalian inflasi daerah.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onRegister}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Lihat Data Publik
                <ArrowRight size={14} />
              </button>
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Masuk sebagai Petugas
              </button>
            </div>
          </div>

          {/* Right: IPH card */}
          <div className="bg-gray-950 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                IPH Terkini
              </span>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <RefreshCw size={9} />
                Live
              </div>
            </div>

            <div className="text-[11px] text-gray-500 mb-3">{iphSnapshot.periode}</div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-5xl font-black ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                {iphSnapshot.nilai > 0 ? "+" : ""}{iphSnapshot.nilai.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-5">
              {isDeflasi
                ? <TrendingDown size={13} className="text-emerald-400" />
                : <TrendingUp size={13} className="text-amber-400" />}
              <span className={`text-xs font-bold ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                {iphSnapshot.label}
              </span>
            </div>

            {/* Mini commodity list */}
            <div className="space-y-2">
              {commodityHighlights.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-200">{c.price}{c.unit}</span>
                    <span className={`text-[10px] font-bold ${
                      c.change < 0 ? "text-blue-400" :
                      c.change > 0 ? "text-red-400" :
                      "text-gray-500"
                    }`}>
                      {c.change === 0 ? "—" : `${c.change > 0 ? "+" : ""}${c.change.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 flex items-center gap-1.5">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span className="text-[10px] text-gray-500">Terverifikasi BPS Kota Batu</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5 py-5 grid grid-cols-4 divide-x divide-gray-200">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center px-4">
              <div className="text-2xl font-black text-gray-900">{value}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features (for masyarakat) ── */}
      <section className="max-w-5xl mx-auto px-5 py-14">
        <div className="text-center mb-8">
          <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-2">
            Untuk Masyarakat Umum
          </p>
          <h2 className="text-xl font-black text-gray-900">
            Informasi harga pangan, transparan dan terbuka.
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Daftar gratis — tidak perlu akun instansi.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {features.map(({ icon, bg, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                {icon}
              </div>
              <div className="text-sm font-bold text-gray-900 mb-1">{title}</div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onRegister}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Daftar sebagai Masyarakat — Gratis
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── Petugas CTA ── */}
      <section className="bg-gray-950 py-12">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between gap-8">
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">
              Untuk Aparatur & Petugas
            </p>
            <h2 className="text-lg font-black text-white mb-1">
              Akses penuh sistem pengendalian inflasi.
            </h2>
            <p className="text-xs text-gray-400">
              Input rekap IPH, kelola rapat koordinasi, monitor resume, dan distribusi siaran pers.
              Gunakan email dinas instansi Anda.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Masuk sebagai Petugas
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <TrendingDown size={11} className="text-white" />
            </div>
            <span className="text-xs text-gray-500">
              © 2026 TPID Kota Batu • Bagian Perekonomian Setda
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <ShieldCheck size={10} className="text-emerald-500" />
            Data resmi BPS Kota Batu
          </div>
        </div>
      </footer>

    </div>
  );
}