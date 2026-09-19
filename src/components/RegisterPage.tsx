import { useState } from "react";
import {
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Lock,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { useAuth, type RegisterData } from "../context/AuthContext";
import type { UserRole } from "../types/auth";

interface RegisterPageProps {
  onGoLogin: () => void;
}

interface RoleCard {
  key: UserRole;
  label: string;
  desc: string;
  permissions: string[];
  restrictions: string[];
  icon: string;
  color: string;
  activeBg: string;
  activeBorder: string;
}

const roleCards: RoleCard[] = [
  {
    key: "petugas",
    label: "Petugas TPID",
    desc: "Aparatur pemerintah / OPD",
    permissions: ["Input & verifikasi data IPH", "Kelola rapat & notulensi", "Visualisasi tren", "Kirim siaran pers"],
    restrictions: ["Tidak dapat mengelola akun pengguna"],
    icon: "👤",
    color: "text-emerald-700",
    activeBg: "bg-emerald-600",
    activeBorder: "border-emerald-500",
  },
  {
    key: "masyarakat",
    label: "Masyarakat",
    desc: "Warga umum / publik",
    permissions: ["Lihat data harga komoditas", "Lihat tren IPH publik", "Akses ringkasan eksekutif"],
    restrictions: ["Tidak dapat input/edit data", "Tidak dapat kelola rapat", "Tidak dapat akses laporan internal"],
    icon: "🏘️",
    color: "text-blue-700",
    activeBg: "bg-blue-600",
    activeBorder: "border-blue-500",
  },
];

// Instansi options for petugas
const instansiOptions = [
  "BPS Kota Batu",
  "Bagian Perekonomian Setda Kota Batu",
  "Disperindag Kota Batu",
  "Diskumperindag Kota Batu",
  "Dinas Pertanian Kota Batu",
  "Bulog Sub-Divre Malang",
  "Bank Indonesia Malang",
  "Dinas Kominfo Kota Batu",
  "Satgas Pangan Polres Batu",
  "Lainnya",
];

export default function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const { register } = useAuth();

  const [step, setStep]               = useState<1 | 2>(1);
  const [role, setRole]               = useState<UserRole>("masyarakat");
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [instansi, setInstansi]       = useState("");
  const [nip, setNip]                 = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree]             = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  // Password strength
  const passStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8)              score++;
    if (/[A-Z]/.test(password))            score++;
    if (/[0-9]/.test(password))            score++;
    if (/[^A-Za-z0-9]/.test(password))    score++;
    return score;
  })();

  const strengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][passStrength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"][passStrength];

  function validateStep1() {
    if (!role) return "Pilih peran terlebih dahulu.";
    return "";
  }

  function validateStep2() {
    if (!name.trim())              return "Nama lengkap wajib diisi.";
    if (!email.trim())             return "Email wajib diisi.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Format email tidak valid.";
    if (role === "petugas" && !instansi) return "Pilih instansi terlebih dahulu.";
    if (role === "petugas" && !nip.trim()) return "NIP wajib diisi untuk petugas.";
    if (password.length < 8)      return "Kata sandi minimal 8 karakter.";
    if (password !== confirmPass)  return "Konfirmasi kata sandi tidak cocok.";
    if (!agree)                    return "Anda harus menyetujui syarat & ketentuan.";
    return "";
  }

  function handleNext() {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    const data: RegisterData = { name, email, password, role, instansi, nip };
    const result = await register(data);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    } else {
      setSuccessMsg(result.message);
    }
  }

  const selectedCard = roleCards.find((r) => r.key === role)!;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successMsg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm mx-auto">{successMsg}</p>
          <button
            onClick={onGoLogin}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
          >
            Kembali ke Login
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-600 shadow-lg mb-3">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Daftar Akun TPID</h1>
          <p className="text-xs text-gray-500 mt-0.5">Sistem Pengendalian Inflasi Daerah Kota Batu</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 justify-center">
          {[
            { n: 1, label: "Pilih Peran" },
            { n: 2, label: "Data Diri" },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                step === n
                  ? "bg-emerald-600 text-white"
                  : step > n
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {step > n ? <CheckCircle2 size={10} /> : <span>{n}</span>}
                {label}
              </div>
              {i === 0 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* ── Step 1: Role selection ── */}
          {step === 1 && (
            <>
              <h2 className="text-sm font-bold text-gray-900 mb-1">Pilih Peran Anda</h2>
              <p className="text-xs text-gray-400 mb-4">
                Peran menentukan hak akses Anda dalam sistem TPID.
              </p>

              <div className="space-y-3 mb-5">
                {roleCards.map((card) => {
                  const isActive = role === card.key;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => { setRole(card.key); setError(""); }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isActive
                          ? `${card.activeBorder} bg-white shadow-sm`
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{card.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-bold ${isActive ? card.color : "text-gray-700"}`}>
                              {card.label}
                            </span>
                            <span className="text-[10px] text-gray-400">{card.desc}</span>
                            {isActive && (
                              <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${card.activeBg}`}>
                                Dipilih
                              </span>
                            )}
                          </div>
                          {/* Permissions */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
                            {card.permissions.map((p) => (
                              <div key={p} className="flex items-start gap-1">
                                <CheckCircle2 size={9} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span className="text-[10px] text-gray-600">{p}</span>
                              </div>
                            ))}
                            {card.restrictions.map((r) => (
                              <div key={r} className="flex items-start gap-1">
                                <span className="text-[9px] text-red-400 flex-shrink-0 mt-0.5">✕</span>
                                <span className="text-[10px] text-gray-400">{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Admin note */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <BadgeCheck size={14} className="text-purple-500 flex-shrink-0" />
                  <p className="text-[11px] text-gray-500">
                    Akun <strong>Administrator</strong> hanya dapat dibuat oleh Admin yang sudah
                    ada. Hubungi pengelola sistem TPID.
                  </p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertCircle size={12} className="text-red-500" />
                  <span className="text-xs text-red-600">{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
              >
                Lanjutkan <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* ── Step 2: Personal data ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Data Diri</h2>
                  <p className="text-[10px] text-gray-400">
                    Daftar sebagai: <strong>{selectedCard.icon} {selectedCard.label}</strong>
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(""); }}
                    placeholder="Nama sesuai identitas resmi"
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {role === "petugas" ? "Email Dinas / Instansi" : "Email Aktif"}
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder={role === "petugas" ? "nama@instansi.go.id" : "email@gmail.com"}
                    className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Petugas-only fields */}
              {role === "petugas" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Instansi / OPD</label>
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={instansi}
                        onChange={(e) => { setInstansi(e.target.value); setError(""); }}
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none bg-white text-gray-700"
                      >
                        <option value="">Pilih instansi...</option>
                        {instansiOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">NIP</label>
                    <div className="relative">
                      <BadgeCheck size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={nip}
                        onChange={(e) => { setNip(e.target.value.replace(/\D/g, "")); setError(""); }}
                        placeholder="18 digit NIP ASN"
                        maxLength={18}
                        className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 font-mono tracking-wider"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-8 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex gap-0.5 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i <= passStrength ? strengthColor : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium w-20 text-right">
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => { setConfirmPass(e.target.value); setError(""); }}
                    placeholder="Ulangi kata sandi"
                    className={`w-full pl-8 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 placeholder:text-gray-300 transition ${
                      confirmPass && confirmPass !== password
                        ? "border-red-300 focus:ring-red-400"
                        : confirmPass && confirmPass === password
                        ? "border-emerald-300 focus:ring-emerald-500"
                        : "border-gray-200 focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  {confirmPass && confirmPass === password && (
                    <CheckCircle2 size={13} className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* Agree checkbox */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => { setAgree(e.target.checked); setError(""); }}
                  className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-gray-500 leading-relaxed">
                  Saya menyetujui{" "}
                  <span className="text-emerald-600 font-semibold">syarat & ketentuan</span>{" "}
                  penggunaan Sistem TPID Kota Batu dan menyatakan data yang diberikan adalah benar.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
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
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="text-center text-[11px] text-gray-400 mt-4">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={onGoLogin}
              className="text-emerald-600 font-bold hover:text-emerald-700"
            >
              Masuk
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-5">
          © 2026 TPID Kota Batu • Bagian Perekonomian Setda
        </p>
      </div>
    </div>
  );
}