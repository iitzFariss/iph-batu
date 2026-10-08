import { useEffect, useState, type ComponentType } from "react";
import { TrendingUp, Eye, EyeOff, ArrowLeft, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import type { UserRole } from "../types/auth";

type DemoHint = { email: string; password: string };
const roles: { key: UserRole; label: string; description: string }[] = [
  { key: "petugas", label: "Petugas", description: "Akses rekapan data, visualisasi tren, dan analisis siaran pers sesuai akun Anda." },
  { key: "admin", label: "Administrator", description: "Kelola data, akun pegawai, dan koordinasi TPID sesuai akses administrator." },
  { key: "tamu", label: "Tamu", description: "Lihat dashboard publik tanpa memasukkan email dan kata sandi." },
];

export default function LoginPage({ onGoBack }: { onGoBack?: () => void }) {
  const { login, loginAsGuest } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>("petugas");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [DemoHints, setDemoHints] = useState<ComponentType<{ role: UserRole; label: string; onFill: (hint: DemoHint) => void }> | null>(null);

  // Keep demo credentials out of the production bundle.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    import("./LoginDemoHints").then((module) => { if (!cancelled) setDemoHints(() => module.default); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (selectedRole !== "tamu" && (!email.trim() || !password)) { setError("Email dan kata sandi wajib diisi."); return; }
    setLoading(true);
    const result = selectedRole === "tamu" ? await loginAsGuest() : await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.message);
  }
  const role = roles.find((item) => item.key === selectedRole)!;

  return (
    <div className={`login-page ${isDark ? "dark" : ""}`}>
      <header className="login-header">
        {onGoBack && <button onClick={onGoBack} className="button-text"><ArrowLeft size={17} aria-hidden="true" />Beranda</button>}
        <button className="icon-button ml-auto" onClick={toggleTheme} aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>{isDark ? <Sun size={19} /> : <Moon size={19} />}</button>
      </header>
      <main className="login-layout">
        <section className="login-intro">
          <div className="flex items-center gap-3"><div className="brand-mark"><TrendingUp size={21} aria-hidden="true" /></div><div className="brand-name"><strong>TPID Kota Batu</strong><span>Pengendalian inflasi daerah</span></div></div>
          <h2>Pemantauan harga dan koordinasi TPID</h2>
          <p>Gunakan akun Anda untuk mengakses rekap IPH dan kegiatan TPID. Masyarakat dapat melihat dashboard melalui akses tamu.</p>
          <div className="login-context"><span>Kota Batu, Jawa Timur</span><span>Indeks Perkembangan Harga</span></div>
        </section>
        <section className="login-form-panel" aria-labelledby="login-title">
          <h1 id="login-title">Masuk ke sistem</h1>
          <p className="text-gray-500 mt-2 mb-6">Pilih akses yang ingin Anda gunakan.</p>
          <div className="role-selector" aria-label="Jenis akses">
            {roles.map((item) => <button type="button" key={item.key} aria-pressed={selectedRole === item.key} disabled={loading} onClick={() => { setSelectedRole(item.key); setEmail(""); setPassword(""); setError(""); }} className={selectedRole === item.key ? "is-selected" : ""}>{item.label}</button>)}
          </div>
          <p className="role-description" id="role-description">{role.description}</p>
          <form onSubmit={handleSubmit} aria-describedby="role-description" aria-busy={loading} className="space-y-5">
            {selectedRole !== "tamu" && <>
              <div><label htmlFor="login-email" className="field-label">Email dinas / instansi</label><input id="login-email" name="email" type="email" autoComplete="username" required value={email} disabled={loading} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="nama@instansi.go.id" className="form-input" /></div>
              <div><label htmlFor="login-password" className="field-label">Kata sandi</label><div className="relative"><input id="login-password" name="password" type={showPass ? "text" : "password"} autoComplete="current-password" required value={password} disabled={loading} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Masukkan kata sandi" className="form-input pr-14" /><button type="button" className="password-toggle icon-button" aria-label={showPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPass} onClick={() => setShowPass((value) => !value)}>{showPass ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
            </>}
            {error && <p role="alert" className="feedback-error">{error}</p>}
            <button type="submit" disabled={loading} className="button-primary w-full">{loading ? "Memverifikasi akses..." : selectedRole === "tamu" ? "Lihat dashboard sebagai tamu" : "Masuk"}</button>
          </form>
          {DemoHints && selectedRole !== "tamu" && <DemoHints role={selectedRole} label={role.label} onFill={(hint) => { setEmail(hint.email); setPassword(hint.password); setError(""); }} />}
          {selectedRole !== "tamu" && <p className="text-sm text-gray-500 mt-6">Untuk memperoleh akun, hubungi administrator TPID.</p>}
        </section>
      </main>
      <footer className="login-footer">TPID Kota Batu · Ruang kerja pengendalian inflasi daerah</footer>
    </div>
  );
}
