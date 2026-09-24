import { useState } from "react";
import {
  Shield,
  Bell,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

interface SessionItem {
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  icon: React.ReactNode;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${
        checked ? "bg-emerald-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

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
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">{title}</div>
          <div className="text-sm text-gray-400">{desc}</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Mock session data ────────────────────────────────────────────────────────

const sessions: SessionItem[] = [
  {
    device: "Chrome · Windows 11",
    location: "Kota Batu, Jawa Timur",
    lastActive: "Sekarang",
    current: true,
    icon: <Monitor size={14} className="text-emerald-600" />,
  },
  {
    device: "Chrome · Android",
    location: "Kota Batu, Jawa Timur",
    lastActive: "2 jam lalu",
    current: false,
    icon: <Smartphone size={14} className="text-gray-500" />,
  },
  {
    device: "Firefox · macOS",
    location: "Malang, Jawa Timur",
    lastActive: "1 hari lalu",
    current: false,
    icon: <Globe size={14} className="text-gray-500" />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PengaturanAkun() {
  const { user, logout } = useAuth();

  // Password change state
  const [passForm, setPassForm]   = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass]   = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState("");
  const [passSaved, setPassSaved] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Notification toggles
  const [notif, setNotif] = useState({
    emailSync:     true,
    emailRapat:    true,
    emailSiaran:   false,
    browserPush:   true,
    whatsapp:      true,
  });

  // Privacy toggles
  const [privacy, setPrivacy] = useState({
    showActivity:  true,
    showInstansi:  true,
    auditLog:      true,
  });

  // Danger zone confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!user) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePassSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPassError("");

    if (!passForm.current)              { setPassError("Kata sandi saat ini wajib diisi."); return; }
    if (passForm.newPass.length < 8)    { setPassError("Kata sandi baru minimal 8 karakter."); return; }
    if (passForm.newPass !== passForm.confirm) { setPassError("Konfirmasi kata sandi tidak cocok."); return; }

    setPassLoading(true);
    setTimeout(() => {
      setPassLoading(false);
      setPassSaved(true);
      setPassForm({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setPassSaved(false), 3000);
    }, 900);
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
      {/* Page header */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
          <span>Pengaturan</span>
          <ChevronRight size={10} />
          <span className="text-gray-700 font-medium">Pengaturan Akun</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Pengaturan Akun</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Kelola keamanan, notifikasi, dan preferensi akun Anda.
        </p>
      </div>

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

        <form onSubmit={handlePassSubmit} className="space-y-4">
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
                  onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                  placeholder="Masukkan kata sandi saat ini"
                  className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
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
                    onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
                    placeholder="Min. 8 karakter"
                    className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({ ...showPass, newPass: !showPass.newPass })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass.newPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass.confirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {passError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
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
                <Shield size={12} />
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
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                s.current
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-gray-100 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  s.current ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  {s.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-900">{s.device}</span>
                    {s.current && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                        Sesi Ini
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {s.location} · {s.lastActive}
                  </div>
                </div>
              </div>
              {!s.current && (
                <button className="text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
                  <LogOut size={10} />
                  Akhiri
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
          <LogOut size={11} />
          Akhiri Semua Sesi Lain
        </button>
      </SectionCard>

      {/* ── Notifikasi ── */}
      <SectionCard
        title="Notifikasi"
        desc="Atur kapan dan bagaimana Anda menerima pemberitahuan"
        icon={<Bell size={15} className="text-gray-600" />}
      >
        <div className="space-y-1">
          {(
            [
              { key: "emailSync",   label: "Email: Sinkronisasi Data BPS Selesai",    desc: "Notifikasi saat data IPH baru tersedia"          },
              { key: "emailRapat",  label: "Email: Pengingat Rapat",                   desc: "H-1 dan H-0 sebelum jadwal rapat"                },
              { key: "emailSiaran", label: "Email: Distribusi Siaran Pers",            desc: "Konfirmasi saat siaran berhasil dikirim"         },
              { key: "browserPush", label: "Notifikasi Browser",                       desc: "Pop-up langsung di browser saat ada aktivitas"   },
              { key: "whatsapp",    label: "WhatsApp: Disposisi Cepat",                desc: "Pesan otomatis ke nomor terdaftar"               },
            ] as { key: keyof typeof notif; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-xs font-semibold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <Toggle
                checked={notif[key]}
                onChange={() => setNotif({ ...notif, [key]: !notif[key] })}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Privasi ── */}
      <SectionCard
        title="Privasi & Visibilitas"
        desc="Kontrol informasi yang dapat dilihat pengguna lain"
        icon={<Eye size={15} className="text-gray-600" />}
      >
        <div className="space-y-1">
          {(
            [
              { key: "showActivity", label: "Tampilkan aktivitas saya di log sistem",    desc: "Admin dapat melihat riwayat aksi Anda"        },
              { key: "showInstansi", label: "Tampilkan instansi di profil publik",        desc: "Terlihat oleh petugas lain dalam sistem"     },
              { key: "auditLog",     label: "Catat semua aksi di audit trail",            desc: "Wajib untuk akun petugas & admin"            },
            ] as { key: keyof typeof privacy; label: string; desc: string }[]
          ).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-xs font-semibold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
              </div>
              <Toggle
                checked={privacy[key]}
                onChange={() => {
                  // auditLog cannot be turned off for petugas/admin
                  if (key === "auditLog" && user.role !== "tamu") return;
                  setPrivacy({ ...privacy, [key]: !privacy[key] });
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      {user.role === "tamu" && (
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
                  Seluruh data akun Anda akan dihapus secara permanen.
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
                    onClick={() => { logout(); }}
                    className="px-3 py-1.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}