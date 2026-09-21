import { useState } from "react";
import { TrendingUp, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface LoginPageProps {
  onGoRegister: () => void;
  onGoBack?: () => void;
}

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
    desc: "Input data & verifikasi IPH",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
    activeBorder: "border-emerald-600",
    icon: "👤",
  },
  {
    key: "masyarakat",
    label: "Masyarakat",
    desc: "Lihat data harga & IPH publik",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
    activeBorder: "border-blue-600",
    icon: "🏘️",
  },
];

// Demo hint accounts per role
const demoHints: Record<UserRole, { email: string; password: string }> = {
  admin:       { email: "admin@tpid-batu.go.id",              password: "admin123"      },
  petugas:     { email: "siti.rahmawati@bps-batu.go.id",      password: "petugas123"    },
  masyarakat:  { email: "masyarakat@gmail.com",               password: "masyarakat123" },
};

export default function LoginPage({ onGoRegister, onGoBack }: LoginPageProps) {
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>("petugas");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

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

  function fillDemo() {
    const hint = demoHints[selectedRole];
    setEmail(hint.email);
    setPassword(hint.password);
    setError("");
  }

  const activeRole = roleOptions.find((r) => r.key === selectedRole)!;

  return (
    <div className="min-h-screen grid grid-cols-2">

      {/* ── Left panel: branding ── */}
      <div className="bg-gray-950 flex flex-col justify-center px-16 py-12 relative overflow-hidden min-h-screen">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-emerald-600 opacity-10 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 rounded-full bg-emerald-400 opacity-5 blur-3xl" />
        </div>

        {/* Brand + back */}
        <div className="relative z-10 mb-12">
          {onGoBack && (
            <button
              onClick={onGoBack}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 mb-8 transition-colors"
            >
              <ArrowLeft size={13} /> Kembali ke Beranda
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/40">
              <TrendingUp size={22} className="text-white" />
            </div>
            <div>
              <div className="text-lg font-black text-white">TPID Kota Batu</div>
              <div className="text-xs text-gray-500">Sistem Pengendalian Inflasi Daerah</div>
            </div>
          </div>
        </div>

        {/* Main copy — besar dan menonjol */}
        <div className="relative z-10 mb-12">
          <h2 className="text-6xl font-black text-white leading-[1.05] mb-6">
            Satu platform<br />
            untuk<br />
            kendalikan<br />
            <span className="text-emerald-400">inflasi daerah.</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            Masuk untuk mengakses data IPH, kelola<br />
            rapat koordinasi, dan distribusi siaran pers<br />
            ke Kemendagri secara realtime.
          </p>
        </div>

        {/* IPH live card */}
        <div className="relative z-10 mb-12">
          <div className="flex items-start gap-5 bg-gray-900 border border-gray-800 rounded-2xl px-7 py-6 w-full">
            <div className="mt-2 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                IPH Terkini • Minggu III April 2026
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-5xl font-black text-emerald-400">-0.42%</span>
                <span className="text-base text-emerald-500 font-semibold">Deflasi Terkendali</span>
              </div>
              <div className="text-xs text-gray-600">Terverifikasi BPS Kota Batu</div>
            </div>
          </div>
        </div>

        {/* Role chips */}
        <div className="relative z-10">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
            Akses tersedia untuk
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
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
      <div className="bg-white flex flex-col justify-center px-16 py-12 overflow-y-auto border-l border-gray-100">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Masuk ke Sistem</h1>
          <p className="text-base text-gray-400 mb-8">
            Pilih peran dan masukkan kredensial Anda
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roleOptions.map((opt) => {
              const isActive = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSelectedRole(opt.key); setEmail(""); setPassword(""); setError(""); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
                    isActive
                      ? `${opt.activeBorder} bg-white shadow-sm`
                      : `border-gray-100 hover:border-gray-200 hover:bg-gray-50`
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
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
                {selectedRole === "admin" && "Akses penuh: manajemen pengguna, konfigurasi sistem, semua modul data."}
                {selectedRole === "petugas" && "Akses: input rekap IPH, kelola rapat, monitoring resume, visualisasi data."}
                {selectedRole === "masyarakat" && "Akses terbatas: hanya dapat melihat data harga komoditas dan tren IPH publik."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {selectedRole === "masyarakat" ? "Email" : "Email Dinas / Instansi"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder={
                  selectedRole === "admin"   ? "admin@tpid-batu.go.id" :
                  selectedRole === "petugas" ? "nama@instansi.go.id"   :
                  "email@gmail.com"
                }
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

          {/* Demo hint */}
          <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                Akun Demo — {activeRole.label}
              </span>
              <button type="button" onClick={fillDemo} className="text-xs text-emerald-600 font-bold hover:text-emerald-700">
                Isi Otomatis →
              </button>
            </div>
            <p className="text-xs text-gray-500 font-mono">{demoHints[selectedRole].email}</p>
            <p className="text-xs text-gray-500 font-mono">{demoHints[selectedRole].password}</p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Belum punya akun?{" "}
            <button type="button" onClick={onGoRegister} className="text-emerald-600 font-bold hover:text-emerald-700">
              Daftar Sekarang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}