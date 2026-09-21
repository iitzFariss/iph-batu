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
  CheckCircle2,
} from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

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

const stats = [
  { value: "20",   label: "Komoditas Dipantau",  desc: "Bahan pokok strategis"   },
  { value: "52",   label: "Minggu Data",          desc: "Siklus TA 2026"          },
  { value: "3",    label: "Pasar Referensi",      desc: "Besar, Relokasi, Bumiaji"},
  { value: "100%", label: "Terverifikasi BPS",    desc: "Data bersumber resmi"    },
];

const features = [
  {
    icon: <Eye size={20} className="text-blue-600" />,
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Pantau Harga Komoditas",
    desc: "Lihat harga 20 bahan pokok di Pasar Besar & Pasar Relokasi Batu secara mingguan.",
    points: ["Data diperbarui setiap Jumat", "Dibandingkan pekan sebelumnya"],
  },
  {
    icon: <BarChart2 size={20} className="text-emerald-600" />,
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Tren IPH Publik",
    desc: "Grafik indeks perkembangan harga yang mudah dibaca, diperbarui tiap pekan.",
    points: ["Visualisasi tren 12 bulan", "Dibandingkan koridor target"],
  },
  {
    icon: <FileText size={20} className="text-purple-600" />,
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Siaran Pers Resmi",
    desc: "Akses ringkasan eksekutif dan siaran pers inflasi langsung dari TPID Kota Batu.",
    points: ["Format resmi Kemendagri", "Terverifikasi BPS & TPID"],
  },
];

const instansiList = [
  "BPS Kota Batu", "Disperindag", "Dinas Pertanian",
  "Bulog Sub-Divre", "Bank Indonesia", "Satgas Pangan",
];

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const isDeflasi = iphSnapshot.nilai < 0;

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Navbar — full width ── */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="w-full px-16 h-14 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-[10px] text-gray-400">
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
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero — full bleed dengan split layout ── */}
      <section className="w-full bg-white">
        <div className="w-full px-16 py-16 grid grid-cols-2 gap-20 items-center">

          {/* Left: copy — dipusatkan & diperbesar */}
          <div className="flex flex-col justify-center pl-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-8 w-fit">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Data Terverifikasi BPS • {iphSnapshot.syncedAt}
            </div>

            <h1 className="text-5xl font-black text-gray-900 leading-[1.1] mb-5">
              Pantau Stabilitas<br />
              Harga Pangan<br />
              <span className="text-emerald-600">Kota Batu.</span>
            </h1>

            <p className="text-base text-gray-500 leading-relaxed mb-8 max-w-lg">
              Platform resmi Tim Pengendali Inflasi Daerah (TPID) untuk memantau
              indeks harga komoditas pangan dan koordinasi pengendalian inflasi daerah
              Kota Batu secara transparan.
            </p>

            <div className="flex items-center gap-4 mb-10">
              <button
                onClick={onRegister}
                className="flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Lihat Data Publik
                <ArrowRight size={15} />
              </button>
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-7 py-3.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
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
                  Live
                </div>
              </div>
              <div className="text-[11px] text-gray-500 mb-4">{iphSnapshot.periode}</div>

              {/* IPH value */}
              <div className={`text-5xl font-black mb-1 ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                {iphSnapshot.nilai > 0 ? "+" : ""}{iphSnapshot.nilai.toFixed(2)}%
              </div>
              <div className="flex items-center gap-1.5 mb-6">
                {isDeflasi
                  ? <TrendingDown size={14} className="text-emerald-400" />
                  : <TrendingUp size={14} className="text-amber-400" />}
                <span className={`text-sm font-bold ${isDeflasi ? "text-emerald-400" : "text-amber-400"}`}>
                  {iphSnapshot.label}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-800 mb-5" />

              {/* Commodity rows */}
              <div className="space-y-3">
                {commodityHighlights.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-400">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-gray-200">
                        {c.price}{c.unit}
                      </span>
                      <span className={`text-[11px] font-bold w-12 text-right ${
                        c.change < 0 ? "text-blue-400" :
                        c.change > 0 ? "text-red-400" :
                        "text-gray-600"
                      }`}>
                        {c.change === 0 ? "—" : `${c.change > 0 ? "+" : ""}${c.change.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-800 flex items-center gap-2">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span className="text-[10px] text-gray-500">Terverifikasi BPS Kota Batu</span>
                <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1">
                  <RefreshCw size={9} />
                  Diperbarui tiap Jumat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar — full width ── */}
      <section className="w-full bg-gray-950 border-y border-gray-800">
        <div className="w-full px-16 py-6 grid grid-cols-4">
          {stats.map(({ value, label, desc }, i) => (
            <div
              key={label}
              className={`text-center px-8 ${i < 3 ? "border-r border-gray-800" : ""}`}
            >
              <div className="text-3xl font-black text-white mb-0.5">{value}</div>
              <div className="text-sm font-semibold text-gray-300">{label}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features — full width 3-col ── */}
      <section className="w-full bg-white py-14">
        <div className="w-full px-16">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest mb-2">
                Untuk Masyarakat Umum
              </p>
              <h2 className="text-2xl font-black text-gray-900">
                Informasi harga pangan,<br />transparan dan terbuka.
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-3">Daftar gratis — tidak perlu akun instansi.</p>
              <button
                onClick={onRegister}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Mulai Sekarang <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Feature cards — fills full width */}
          <div className="grid grid-cols-3 gap-6">
            {features.map(({ icon, bg, border, title, desc, points }) => (
              <div
                key={title}
                className={`bg-white border-2 ${border} rounded-2xl p-7 hover:shadow-md transition-all group`}
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
      <section className="w-full bg-gray-950 py-14">
        <div className="w-full px-16 grid grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest mb-3">
              Untuk Aparatur & Petugas TPID
            </p>
            <h2 className="text-2xl font-black text-white mb-4 leading-tight">
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
        <div className="w-full px-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <TrendingDown size={11} className="text-white" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              © 2026 TPID Kota Batu • Bagian Perekonomian Setda Kota Batu
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <ShieldCheck size={10} className="text-emerald-500" />
            Data resmi BPS Kota Batu • SK Walikota No. 188.45/TPID/2026
          </div>
        </div>
      </footer>

    </div>
  );
}