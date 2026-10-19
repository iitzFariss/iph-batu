import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Smartphone,
  Trash2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import PageHeading from "./PageHeading";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionRow {
  id: string;
  device: string;
  ip: string;
  userAgent: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <span className="text-gray-500">{icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-1">{desc}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLastActive(iso: string): string {
  const t = new Date(iso);
  const diffMs = Date.now() - t.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Sekarang";
  if (mins < 60) return `${mins} menit lalu`;
  if (mins < 1440) return `${Math.floor(mins / 60)} jam lalu`;
  return `${Math.floor(mins / 1440)} hari lalu`;
}

function deviceLabel(userAgent: string | null, device: string): string {
  if (!userAgent) return device;
  if (/Mobi|Android|iPhone/i.test(userAgent)) return `${device} · Perangkat Seluler`;
  if (/Mac OS/.test(userAgent) && !/Windows/i.test(userAgent)) return `${device} · macOS`;
  if (/Windows/i.test(userAgent)) return `${device} · Windows`;
  return `${device} · Linux`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PengaturanAkun() {
  const { user, logout } = useAuth();

  // Password change state
  const [passForm, setPassForm]   = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass]   = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionsBusy, setSessionsBusy] = useState(false);

  // Danger zone confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadSessions = useCallback(() => api.get<{ rows: SessionRow[] }>("/auth/sessions")
    .then(({ rows }) => {
      setSessions(rows);
      setSessionsError("");
    }).catch(error => {
      setSessionsError(error instanceof ApiError ? error.message : "Gagal memuat sesi aktif. Coba lagi.");
    }).finally(() => setSessionsLoading(false)), []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  if (!user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePassSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passLoading) return;
    setPassError("");
    setPassSaved(false);

    if (!passForm.current)              { setPassError("Kata sandi saat ini wajib diisi."); return; }
    if (passForm.newPass.length < 8)    { setPassError("Kata sandi baru minimal 8 karakter."); return; }
    if (!passForm.confirm) { setPassError("Konfirmasi kata sandi wajib diisi."); return; }
    if (passForm.newPass !== passForm.confirm) { setPassError("Konfirmasi kata sandi tidak cocok."); return; }

    setPassLoading(true);
    api
      .post("/auth/change-password", {
        passwordSaatIni: passForm.current,
        passwordBaru: passForm.newPass,
        konfirmasi: passForm.confirm,
      })
      .then(() => {
        setPassSaved(true);
        setPassForm({ current: "", newPass: "", confirm: "" });
        setShowPass({ current: false, newPass: false, confirm: false });
        void loadSessions();
        setTimeout(() => setPassSaved(false), 3000);
      })
      .catch((e) => {
        setPassError(e instanceof ApiError ? e.message : "Gagal memperbarui kata sandi.");
      })
      .finally(() => setPassLoading(false));
  }

  async function revokeSession(id: string) {
    if (sessionsBusy) return;
    setSessionsBusy(true);
    setSessionsError("");
    try {
      await api.post("/auth/sessions/revoke", { id });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      setSessionsError(error instanceof ApiError ? error.message : "Sesi belum berhasil diakhiri. Coba lagi.");
    } finally { setSessionsBusy(false); }
  }

  async function revokeAllOthers() {
    if (sessionsBusy) return;
    setSessionsBusy(true);
    setSessionsError("");
    const others = sessions.filter((s) => !s.isCurrent);
    try {
      for (const s of others) {
        await api.post("/auth/sessions/revoke", { id: s.id });
        setSessions(prev => prev.filter(row => row.id !== s.id));
      }
    } catch (error) {
      setSessionsError(error instanceof ApiError ? error.message : "Sebagian sesi belum berhasil diakhiri. Coba lagi.");
    } finally { setSessionsBusy(false); }
  }

  async function deleteAccount() {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api.delete("/auth/me");
      await logout();
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "Akun belum berhasil dihapus. Coba lagi.");
    } finally { setDeleteBusy(false); }
  }

  const passStrength = (() => {
    const p = passForm.newPass;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Lemah", "Cukup", "Kuat", "Sangat Kuat"][passStrength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400", "bg-emerald-600"][passStrength];

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      <PageHeading title="Pengaturan akun" description="Ubah kata sandi dan kelola perangkat yang masuk ke akun Anda." />

      {/* ── Keamanan: Ganti Password ── */}
      <SectionCard
        title="Keamanan Akun"
        desc="Ubah kata sandi dan kelola keamanan login"
        icon={<Lock size={15} className="text-gray-600" />}
      >
        {passSaved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span className="text-xs text-emerald-700 font-semibold">Kata sandi berhasil diperbarui.</span>
          </div>
        )}

        <form onSubmit={handlePassSubmit} noValidate className="space-y-4" aria-busy={passLoading}>
          <div className="grid grid-cols-1 gap-4">
            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass.current ? "text" : "password"}
                  value={passForm.current}
                  aria-label="Kata sandi saat ini"
                  autoComplete="current-password" required disabled={passLoading}
                  onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                  aria-label={showPass.current ? "Sembunyikan kata sandi saat ini" : "Tampilkan kata sandi saat ini"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass.current ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass.newPass ? "text" : "password"}
                    value={passForm.newPass}
                    aria-label="Kata sandi baru"
                    autoComplete="new-password" required minLength={8} disabled={passLoading}
                    aria-describedby="new-password-help"
                    onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
                    placeholder="Min. 8 karakter"
                    className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({ ...showPass, newPass: !showPass.newPass })}
                    aria-label={showPass.newPass ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass.newPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <p id="new-password-help" className="text-xs text-gray-500 mt-1.5">Minimal 8 karakter. Kombinasikan huruf, angka, dan simbol agar lebih sulit ditebak.</p>
                {passForm.newPass && (
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
                    <span className="text-xs text-gray-500 w-20 text-right">{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass.confirm ? "text" : "password"}
                    value={passForm.confirm}
                    aria-label="Konfirmasi kata sandi baru"
                    autoComplete="new-password" required disabled={passLoading}
                    onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                    placeholder="Ulangi kata sandi baru"
                    className={`w-full pl-8 pr-10 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-2 placeholder:text-gray-300 ${
                      passForm.confirm && passForm.confirm !== passForm.newPass
                        ? "border-red-300 focus:ring-red-400"
                        : passForm.confirm && passForm.confirm === passForm.newPass
                        ? "border-emerald-300 focus:ring-emerald-500"
                        : "border-gray-200 focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                    aria-label={showPass.confirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass.confirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {passError && (
            <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">{passError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={passLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              passLoading
                ? "bg-gray-200 text-gray-400 cursor-wait"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {passLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                Perbarui Kata Sandi
              </>
            )}
          </button>
        </form>
      </SectionCard>

      {/* ── Sesi Aktif ── */}
      <SectionCard
        title="Sesi Aktif"
        desc="Perangkat yang sedang atau pernah login ke akun Anda"
        icon={<Monitor size={15} className="text-gray-600" />}
      >
        {sessionsError && <div role="alert" className="text-sm text-red-600 mb-3">{sessionsError}<button type="button" disabled={sessionsLoading || sessionsBusy} onClick={() => void loadSessions()} className="secondary-action ml-2">Muat ulang sesi</button></div>}
        <div className="space-y-3">
          {sessionsLoading ? <p role="status" className="text-sm text-gray-500">Memuat sesi aktif...</p> : sessions.length === 0 && !sessionsError ? (
            <div className="text-xs text-gray-400 py-3 text-center">Belum ada sesi aktif.</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  s.isCurrent
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    s.isCurrent ? "bg-emerald-100" : "bg-gray-100"
                  }`}>
                    {s.isCurrent
                      ? <Monitor size={14} className="text-emerald-600" />
                      : <Smartphone size={14} className="text-gray-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900">{deviceLabel(s.userAgent, s.device)}</span>
                      {s.isCurrent && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          Sesi Ini
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      IP {s.ip} · {formatLastActive(s.lastActiveAt)}
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button
                    type="button" disabled={sessionsBusy}
                    onClick={() => revokeSession(s.id)}
                    className="text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1"
                  >
                    <LogOut size={10} />
                    Akhiri
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <button
          type="button" disabled={sessionsLoading || sessionsBusy || !sessions.some(s => !s.isCurrent)}
          onClick={revokeAllOthers}
          className="mt-3 text-sm text-red-500 font-semibold hover:text-red-700 flex items-center gap-1"
        >
          <LogOut size={11} />
          Akhiri Semua Sesi Lain
        </button>
      </SectionCard>

      {/* Backend melarang penghapusan akun administrator. */}
      {user.role !== "admin" && (
        <div className="bg-white border border-red-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50/50">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} className="text-red-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-700">Zona Berbahaya</div>
              <div className="text-sm text-red-400">Tindakan permanen yang tidak dapat dibatalkan</div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-900">Hapus Akun</div>
                <div className="text-sm text-gray-400 mt-0.5">
                  Hapus akun login Anda secara permanen. Akun yang masih memiliki rekap tidak dapat dihapus.
                </div>
              </div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-3 py-1.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Hapus Akun
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 font-semibold">Yakin?</span>
                  <button
                    disabled={deleteBusy}
                    onClick={deleteAccount}
                    className="px-3 py-1.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    {deleteBusy ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                  <button
                    disabled={deleteBusy}
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
            {deleteError && <p role="alert" className="text-sm text-red-600 mt-3">{deleteError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
