import { useState } from "react";
import { TrendingUp, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface LoginPageProps {
  onGoRegister: () => void;
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

export default function LoginPage({ onGoRegister }: LoginPageProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 shadow-lg mb-4">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">TPID Kota Batu</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Pengendalian Inflasi Daerah</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Masuk ke Sistem</h2>
          <p className="text-xs text-gray-400 mb-5">
            Pilih peran dan masukkan kredensial Anda
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {roleOptions.map((opt) => {
              const isActive = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => { setSelectedRole(opt.key); setEmail(""); setPassword(""); setError(""); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                    isActive
                      ? `${opt.activeBorder} bg-white shadow-sm`
                      : `border-gray-100 hover:border-gray-200 hover:bg-gray-50`
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className={`text-[11px] font-bold leading-tight ${isActive ? opt.color : "text-gray-600"}`}>
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-gray-400 leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Access info banner */}
          <div className={`flex items-start gap-2 p-3 rounded-xl mb-5 ${activeRole.bg} border ${activeRole.border}`}>
            <span className="text-base">{activeRole.icon}</span>
            <div>
              <p className={`text-[11px] font-bold ${activeRole.color}`}>{activeRole.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {selectedRole === "admin" && "Akses penuh: manajemen pengguna, konfigurasi sistem, semua modul data."}
                {selectedRole === "petugas" && "Akses: input rekap IPH, kelola rapat, monitoring resume, visualisasi data."}
                {selectedRole === "masyarakat" && "Akses terbatas: hanya dapat melihat data harga komoditas dan tren IPH publik."}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {selectedRole === "masyarakat" ? "Email" : "Email Dinas / Instansi"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder={
                  selectedRole === "admin"      ? "admin@tpid-batu.go.id" :
                  selectedRole === "petugas"    ? "nama@instansi.go.id" :
                  "email@gmail.com"
                }
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                loading
                  ? "bg-gray-200 text-gray-400 cursor-wait"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                Akun Demo — {activeRole.label}
              </span>
              <button
                type="button"
                onClick={fillDemo}
                className="text-[10px] text-emerald-600 font-bold hover:text-emerald-700"
              >
                Isi Otomatis →
              </button>
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
              {demoHints[selectedRole].email}
            </p>
            <p className="text-[10px] text-gray-500 font-mono">
              {demoHints[selectedRole].password}
            </p>
          </div>

          {/* Register link */}
          <p className="text-center text-[11px] text-gray-400 mt-5">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={onGoRegister}
              className="text-emerald-600 font-bold hover:text-emerald-700"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          © 2026 TPID Kota Batu • Bagian Perekonomian Setda
        </p>
      </div>
    </div>
  );
}