import { useEffect, useState, type ComponentType, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { UserRole } from "../types/auth";
import PublicHeader from "./PublicHeader";

const roles: { key: UserRole; label: string; description: string }[] = [
  { key: "admin", label: "Administrator", description: "Kelola data harga, pegawai, akun, dan jadwal rapat." },
  { key: "petugas", label: "Petugas TPID", description: "Baca rekap harga, susun siaran, dan isi notulensi sesuai penugasan." },
  { key: "tamu", label: "Tamu", description: "Lihat dashboard publik tanpa memasukkan email dan kata sandi." },
];
type DemoHint = { email: string; password: string };
export default function LoginPage({ onGoBack }: { onGoBack?: () => void }) {
  const { login, loginAsGuest } = useAuth();
  const { isDark } = useTheme();
  const [role, setRole] = useState<UserRole>("petugas");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [DemoHints, setDemoHints] = useState<ComponentType<{ role: UserRole; label: string; onFill: (hint: DemoHint) => void }> | null>(null);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    import("./LoginDemoHints").then(module => { if (!cancelled) setDemoHints(() => module.default); });
    return () => { cancelled = true; };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (role !== "tamu" && (!email.trim() || !password)) { setError("Email dan kata sandi wajib diisi."); return; }
    setBusy(true);
    try {
      const result = role === "tamu" ? await loginAsGuest() : await login(email.trim(), password);
      if (!result.success) setError(result.message);
    } catch { setError("Tidak dapat masuk. Periksa koneksi dan coba lagi."); }
    finally { setBusy(false); }
  }
  const active = roles.find(item => item.key === role)!;
  return <div className={isDark ? "dark" : ""}><div className="login-page"><PublicHeader onGoBack={onGoBack} /><main className="login-layout">
    <section className="login-intro">
      <h2>Ruang kerja<br />pengendalian harga.</h2>
      <p>Kelola rekap mingguan dan koordinasikan tindak lanjut bersama tim TPID Kota Batu.</p>
      <div className="login-index"><div><b>Data harga</b><span>Rekap IPH dan andil komoditas</span></div><div><b>Koordinasi</b><span>Agenda, peserta, dan hasil rapat</span></div><div><b>Teks siaran</b><span>Ringkasan untuk peserta rapat</span></div></div>
    </section>
    <section className="login-form" aria-label="Formulir masuk"><div>
      <h1 className="text-2xl text-gray-900">Masuk ke sistem</h1>
      <p className="text-sm text-gray-500 mt-3">Pilih peran dan gunakan akun TPID Anda.</p>
      <div className="login-role-tabs" aria-label="Peran pengguna">{roles.map(item => <button key={item.key} type="button" aria-label={item.label} aria-pressed={role === item.key} disabled={busy} onClick={() => { setRole(item.key); setEmail(""); setPassword(""); setError(""); }}><span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.key === "admin" ? "Admin" : item.key === "petugas" ? "Petugas" : "Tamu"}</span></button>)}</div>
      <p className="text-xs text-gray-500 mb-6 min-h-9">{active.description}</p>
      <form onSubmit={submit} className="space-y-5">
        {role !== "tamu" && <>
          <div><label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label><input id="login-email" name="email" type="email" autoComplete="username" value={email} onChange={event => { setEmail(event.target.value); setError(""); }} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3" placeholder="Email akun Anda" /></div>
          <div><label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">Kata sandi</label><div className="relative"><input id="login-password" name="password" type={showPass ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setError(""); }} className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-14 py-3" placeholder="Masukkan kata sandi" /><button type="button" aria-label={showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setShowPass(value => !value)} className="absolute right-1 inset-y-0 flex items-center justify-center text-gray-600">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
        </>}
        {error && <p role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="primary-action w-full">{busy ? "Memproses…" : role === "tamu" ? "Lihat dashboard sebagai tamu" : "Masuk"}</button>
      </form>
      {DemoHints && role !== "tamu" && <DemoHints role={role} label={active.label} onFill={hint => { setEmail(hint.email); setPassword(hint.password); setError(""); }} />}
      {role !== "tamu" && <p className="text-sm text-gray-500 mt-6">Belum punya akun? Hubungi administrator TPID.</p>}
    </div></section>
  </main></div></div>;
}
