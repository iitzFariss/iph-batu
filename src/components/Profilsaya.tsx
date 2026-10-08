import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Building2,
  BadgeCheck,
  Shield,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { UserRole } from "../types/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const roleLabel: Record<UserRole, string> = {
  admin:   "Administrator",
  petugas: "Petugas TPID",
  tamu:    "Tamu",
};

const roleBadgeCls: Record<UserRole, string> = {
  admin:   "bg-purple-100 text-purple-700 border border-purple-200",
  petugas: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  tamu:    "bg-sky-100 text-sky-700 border border-sky-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ActivityItem {
  label: string;
  at: string;
}

function formatWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilSaya() {
  const { user, refresh } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [phone, setPhone]             = useState(user?.phone ?? "");
  const [bio, setBio]                 = useState(user?.bio ?? "");
  const [activity, setActivity]       = useState<ActivityItem[]>([]);
  const [activityError, setActivityError] = useState("");
  const [ringkasan, setRingkasan]     = useState<{ rekap: number; perangkat: number; terakhirMasuk: string | null } | null>(null);

  useEffect(() => {
    api
      .get<{
        items: { label: string; at: string }[];
        ringkasan: { rekap: number; perangkat: number; terakhirMasuk: string | null };
      }>("/auth/me/activity")
      .then(({ items, ringkasan: r }) => {
        setActivity(items.map((i) => ({ label: i.label, at: i.at })));
        setRingkasan(r);
      })
      .catch(() => setActivityError("Gagal memuat riwayat aktivitas."));
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(" ").slice(0, 2)
    .map((n: string) => n[0])
    .join("").toUpperCase();

  async function handleSave() {
    setErrorMsg("");
    try {
      await api.patch("/auth/me", {
        name: displayName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      });
      await refresh();
      setEditMode(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : "Gagal memperbarui profil.");
    }
  }

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
          <span>Pengaturan</span>
          <ChevronRight size={10} />
          <span className="text-gray-700 font-medium">Profil Saya</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Profil Saya</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Informasi akun dan riwayat aktivitas Anda di sistem TPID Kota Batu.
        </p>
      </div>

      {/* Saved message */}
      {savedMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span className="text-xs text-emerald-700 font-semibold">Profil berhasil diperbarui.</span>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-xs text-red-700 font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

        {/* Left: avatar card */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-black mx-auto">
                {initials}
              </div>
            </div>

            <div className="text-sm font-black text-gray-900 mb-0.5">{user.name}</div>
            <div className="text-sm text-gray-400 mb-2">{user.email}</div>

            {/* Role badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${roleBadgeCls[user.role]}`}>
              <Shield size={10} />
              {roleLabel[user.role]}
            </span>

            {/* NIP */}
            {user.nip && (
              <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">NIP</div>
                <div className="text-sm font-mono font-semibold text-gray-700">{user.nip}</div>
              </div>
            )}

            {/* Instansi */}
            {user.instansi && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Instansi</div>
                <div className="text-sm font-semibold text-gray-700">{user.instansi}</div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Statistik Aktivitas</div>
            {ringkasan ? (
              [
                { label: "Rekap IPH Disimpan", value: String(ringkasan.rekap) },
                { label: "Perangkat Login Aktif", value: String(ringkasan.perangkat) },
                {
                  label: "Login Terakhir",
                  value: ringkasan.terakhirMasuk ? formatWaktu(ringkasan.terakhirMasuk) : "Belum pernah",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-xs font-black text-gray-900 text-right">{value}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Statistik belum tersedia.</p>
            )}
          </div>
        </div>

        {/* Right: detail form + activity */}
        <div className="space-y-4">

          {/* Info section */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Informasi Pribadi</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-3 py-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                >
                  Edit Profil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Nama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Nama Lengkap
                  </label>
                  {editMode ? (
                    <div className="relative">
                      <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <User size={13} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-900 font-semibold">{displayName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Nomor Telepon
                  </label>
                  {editMode ? (
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <div className="py-2">
                      <span className="text-xs text-gray-900 font-semibold">{phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email - read only */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Mail size={12} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600">{user.email}</span>
                  <span className="ml-auto text-[11px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                    Tidak dapat diubah
                  </span>
                </div>
              </div>

              {/* Instansi - read only */}
              {user.instansi && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Instansi / OPD
                  </label>
                  <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600">{user.instansi}</span>
                    <span className="ml-auto text-[11px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                      Tidak dapat diubah
                    </span>
                  </div>
                </div>
              )}

              {/* NIP - read only */}
              {user.nip && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    NIP
                  </label>
                  <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                    <BadgeCheck size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-gray-600 tracking-wider">{user.nip}</span>
                    <span className="ml-auto text-[11px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                      Tidak dapat diubah
                    </span>
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Bio / Keterangan
                </label>
                {editMode ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed py-1">{bio}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">Aktivitas Terkini</h2>
              <span className="text-xs text-gray-400">dari data akun ini</span>
            </div>
            {activityError ? (
              <p className="text-xs text-red-600">{activityError}</p>
            ) : activity.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada aktivitas tercatat untuk akun ini.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((act) => (
                  <div key={`${act.label}-${act.at}`} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-emerald-600 bg-emerald-50">
                      <Clock size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 leading-snug">{act.label}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={9} className="text-gray-400" />
                        <span className="text-xs text-gray-400">{formatWaktu(act.at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}