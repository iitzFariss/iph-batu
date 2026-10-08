import { useEffect, useState, type ComponentType } from "react";
import { TrendingUp, TrendingDown, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { UserRole } from "../types/auth";

interface LoginPageProps {
  onGoBack?: () => void;
}

interface PublicSummary {
  latest: {
    tahun: number;
    bulan: number;
    mingguIndeks: number;
    iph: number;
    status: string;
    pemicu: string | null;
  } | null;
}

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MINGGU_ROMAWI = ["I", "II", "III", "IV", "V"];

// ─── Role selector data ───────────────────────────────────────────────────────

interface RoleOption {
  key: UserRole;
  label: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
  icon: string;
}

const roleOptions: RoleOption[] = [
  {
    key: "admin",
    label: "Administrator",
    desc: "Pengelola sistem & data penuh",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    activeBg: "bg-purple-600",
    activeBorder: "border-purple-600",
    icon: "🛡️",
  },
  {
    key: "petugas",
    label: "Petugas TPID",
    desc: "Monitoring data & verifikasi IPH",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
    activeBorder: "border-emerald-600",
    icon: "👤",
  },
  {
    key: "tamu",
    label: "Tamu",
    desc: "Akses cepat tanpa pendaftaran",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    activeBg: "bg-sky-600",
    activeBorder: "border-sky-600",
    icon: "🔑",
  },
];

// Kredensial demo (email + password yang sama dengan prisma/seed.ts) hanya
// boleh muncul di build development.
//
// Penting: jangan menuliskan nilai passwordnya di file ini, bahkan di balik
// gating pada JSX. Minifier tetap menyimpan helper di module scope, jadi
// gating pada tampilan saja tidak cukup. Modul kredensialnya ada di
// LoginDemoHints.tsx, dimuat lewat import() dinamis yang dijaga
// import.meta.env.DEV, sehingga di build produksi file itu tidak ikut
// ter-emit sama sekali.
type DemoHint = { email: string; password: string };

const CARI_DEMO = import.meta.env.DEV;

export default function LoginPage({ onGoBack }: LoginPageProps) {
  const { login, loginAsGuest } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("petugas");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [latest, setLatest]             = useState<PublicSummary["latest"]>(null);
  const [DemoHints, setDemoHints]       = useState<ComponentType<{
    role: UserRole;
    label: string;
    onFill: (hint: DemoHint) => void;
  }> | null>(null);

  // Modul kredensial demo dimuat terpisah dan hanya saat development, supaya
  // password seed tidak pernah ikut ter-bundle ke build produksi.
  useEffect(() => {
    if (!CARI_DEMO) return;
    let cancelled = false;
    import("./LoginDemoHints").then((m) => {
      if (!cancelled) setDemoHints(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<PublicSummary>("/public/rekap/summary")
      .then((data) => {
        if (!cancelled) setLatest(data.latest);
      })
      .catch(() => {
        if (!cancelled) setLatest(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  async function handleGuest() {
    setError("");
    setLoading(true);
    const result = await loginAsGuest();
    setLoading(false);
    if (!result.success) setError(result.message);
  }

  function fillDemo(hint: DemoHint) {
    setEmail(hint.email);
    setPassword(hint.password);
    setError("");
  }

  const activeRole = roleOptions.find((r) => r.key === selectedRole)!;

  const iphPeriode = latest
    ? `Minggu ${MINGGU_ROMAWI[latest.mingguIndeks - 1] ?? latest.mingguIndeks} ${BULAN_SINGKAT[latest.bulan - 1]} ${latest.tahun}`
    : null;
  const iphDeflasi = (latest?.iph ?? 0) < 0;
  const iphLabel = latest
    ? latest.status === "deflasi-signifikan" || latest.status === "deflasi-terkendali"
      ? "Deflasi Terkendali"
      : latest.status === "inflasi-ringan"
      ? "Inflasi Terkendali"
      : "Perlu Intervensi"
    : "Memuat data…";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left panel: branding ── */}
      <div className="bg-gray-950 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-8 lg:py-12 relative overflow-hidden lg:min-h-screen">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-emerald-600 opacity-10 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-emerald-400 opacity-5 blur-3xl" />
        </div>

        {/* Brand + back */}
        <div className="relative z-10 mb-8 lg:mb-12 overflow-hidden">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-6 lg:mb-8 transition-colors"
            >
              <ArrowLeft size={13} /> Kembali ke Beranda
            </button>
          )}
          <div className="flex items-center gap-3">
            <img
              src="/bps-logo.png"
              alt="Logo BPS Kota Batu"
              className="h-10 w-auto flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-lg font-black text-white leading-tight">TPID Kota Batu</div>
              <div className="text-xs text-gray-500 truncate">Sistem Pengendalian Inflasi Daerah</div>
            </div>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 mb-8 lg:mb-12">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] lg:leading-[1.05] mb-4 lg:mb-6">
            Satu platform<br />
            untuk<br />
            kendalikan<br />
            <span className="text-emerald-400">inflasi daerah.</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
            Masuk untuk mengakses data IPH dan menyusun draf siaran pers.
          </p>
        </div>

        {/* IPH live card */}
        <div className="relative z-10 mb-8 lg:mb-12">
          <div className="flex items-start gap-4 sm:gap-5 bg-gray-900 border border-gray-800 rounded-2xl px-5 sm:px-7 py-5 sm:py-6 w-full">
            <div className="mt-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                IPH Terkini{iphPeriode ? ` • ${iphPeriode}` : ""}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                <span
                  className={`text-4xl sm:text-5xl font-black ${
                    iphDeflasi ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {latest ? `${latest.iph > 0 ? "+" : ""}${latest.iph.toFixed(2)}%` : "—"}
                </span>
                <span
                  className={`text-sm sm:text-base font-semibold ${
                    iphDeflasi ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  {iphDeflasi ? <TrendingDown size={14} className="inline mb-0.5" /> : <TrendingUp size={14} className="inline mb-0.5" />}{" "}
                  {iphLabel}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                {latest ? `Pemicu: ${latest.pemicu ?? "—"}` : "Periode data belum tersedia"}
              </div>
            </div>
          </div>
        </div>

        {/* Role chips */}
        <div className="relative z-10">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
            Akses tersedia untuk
          </p>
          <div className="flex flex-wrap gap-3 mb-8 lg:mb-10">
            {roleOptions.map((r) => (
              <span
                key={r.key}
                className="px-4 py-2.5 bg-gray-900 border border-gray-800 text-sm text-gray-400 font-medium rounded-xl flex items-center gap-2"
              >
                <span className="text-base">{r.icon}</span> {r.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-700">
            © 2026 TPID Kota Batu • Bagian Perekonomian Setda
          </p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="bg-white flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 lg:py-12 overflow-y-auto border-t lg:border-t-0 lg:border-l border-gray-100">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">Masuk ke Sistem</h1>
          <p className="text-sm sm:text-base text-gray-400 mb-6 lg:mb-8">
            Pilih peran dan masukkan kredensial Anda
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            {roleOptions.map((opt) => {
              const isActive = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSelectedRole(opt.key); setEmail(""); setPassword(""); setError(""); }}
                  className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all text-center ${
                    isActive
                      ? `${opt.activeBorder} bg-white shadow-sm`
                      : `border-gray-100 hover:border-gray-200 hover:bg-gray-50`
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{opt.icon}</span>
                  <span className={`text-xs font-bold leading-tight ${isActive ? opt.color : "text-gray-600"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Access info banner */}
          <div className={`flex items-start gap-3 p-4 rounded-2xl mb-6 ${activeRole.bg} border ${activeRole.border}`}>
            <span className="text-xl">{activeRole.icon}</span>
            <div>
              <p className={`text-sm font-bold ${activeRole.color}`}>{activeRole.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedRole === "admin" && "Akses penuh: manajemen pengguna, kelola komoditas, dan semua modul data."}
                {selectedRole === "petugas" && "Akses: rekapan data IPH, visualisasi tren, dan analisis siaran pers."}
                {selectedRole === "tamu" && "Masuk langsung tanpa kredensial — lihat dashboard dan data publik."}
              </p>
            </div>
          </div>

          {/* Form */}
          {selectedRole === "tamu" ? (
            <div className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleGuest}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all ${
                  loading
                    ? "bg-gray-200 text-gray-400 cursor-wait"
                    : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Memasuki sistem...
                  </>
                ) : (
                  <>Masuk sebagai Tamu <ArrowRight size={16} /></>
                )}
              </button>
              <p className="text-center text-sm text-gray-400">
                Akun dibuat oleh Administrator TPID melalui menu Kelola Pegawai.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Dinas / Instansi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder={selectedRole === "admin" ? "email@tpid-batu.go.id" : "nama@instansi.go.id"}
                className="w-full px-4 py-3.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-4 py-3.5 pr-12 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition-all ${
                loading
                  ? "bg-gray-200 text-gray-400 cursor-wait"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>Masuk <ArrowRight size={16} /></>
              )}
            </button>
          </form>
          )}

          {/* Demo hint — hanya di build development */}
          {DemoHints && selectedRole !== "tamu" && (
            <DemoHints
              role={selectedRole}
              label={activeRole.label}
              onFill={fillDemo}
            />
          )}

          {selectedRole !== "tamu" && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Belum punya akun? Hubungi Administrator TPID.
          </p>
          )}
        </div>
      </div>
    </div>
  );
}