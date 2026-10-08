import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  UserCog,
  CheckCircle2,
  Clock,
  Ban,
  RotateCcw,
  X,
  Search,
  User as UserIcon,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { AdminUserRow, UserRole, UserStatus, UsersResponse } from "../types/auth";

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  cls: string;
  dot: string;
}

const statusConfig: Record<UserStatus, StatusMeta> = {
  pending: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-500" },
  aktif: { label: "Aktif", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  nonaktif: { label: "Nonaktif", cls: "bg-gray-100 text-gray-500 border border-gray-200", dot: "bg-gray-400" },
};

const statusFallback: StatusMeta = {
  label: "Tidak Diketahui",
  cls: "bg-gray-100 text-gray-600 border border-gray-300",
  dot: "bg-gray-400",
};

function statusMeta(status: string): StatusMeta {
  return statusConfig[status as UserStatus] ?? statusFallback;
}

const roleConfig: Record<UserRole, { label: string; cls: string }> = {
  admin: { label: "Administrator", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  petugas: { label: "Petugas TPID", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  tamu: { label: "Tamu", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
};

const PALETTE = [
  "bg-gray-700",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-teal-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-cyan-600",
];

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function formatTanggal(iso: string | null): string {
  if (!iso) return "Belum pernah";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetModal({
  nama,
  email,
  onClose,
  onReset,
}: {
  nama: string;
  email: string;
  onClose: () => void;
  onReset: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <KeyRound size={20} className="text-amber-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 text-center mb-1">Reset Kata Sandi?</h3>
        <p className="text-xs text-gray-500 text-center mb-4">
          Kata sandi <strong className="text-gray-700">{nama}</strong> ({email}) akan diganti dengan
          kata sandi sementara dan semua sesi login yang aktif dicabut.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={() => { setBusy(true); onReset(); }}
            disabled={busy}
            className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50"
          >
            {busy ? "Memproses..." : "Ya, Reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TempPasswordModal({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [disalin, setDisalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(password);
      setDisalin(true);
    } catch {
      setDisalin(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Kata Sandi Sementara</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Kata sandi baru untuk <strong className="text-gray-700">{email}</strong>. Salin dan
          titipkan ke penggunanya.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
          <code className="text-sm font-mono font-bold text-gray-900 tracking-wider flex-1 break-all">
            {password}
          </code>
          <button
            onClick={salin}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              disalin ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {disalin ? "Tersalin" : "Salin"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KelolaAkun() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const [roleMap, setRoleMap] = useState<Record<string, UserRole>>({});
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);
  const [tempBaru, setTempBaru] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    api
      .get<UsersResponse>("/users")
      .then((res) => {
        setData(res);
        setRoleMap(Object.fromEntries(res.rows.map((r) => [r.id, r.role])));
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : "Gagal memuat daftar akun.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = (data?.rows ?? []).filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  function pesan(teks: string, tipe: "info" | "error" = "info") {
    setMessage(teks);
    setMessageType(tipe);
  }

  async function ubahStatus(u: AdminUserRow, status: UserStatus) {
    try {
      const res = await api.patch<{ user: AdminUserRow }>(`/users/${u.id}`, { status });
      setData((d) => d ? { ...d, rows: d.rows.map((r) => (r.id === u.id ? res.user : r)) } : d);
      pesan(`Status akun ${u.name} diubah menjadi ${statusConfig[status].label}.`);
    } catch (e) {
      pesan(e instanceof ApiError ? e.message : "Gagal mengubah status akun.", "error");
    }
  }

  async function ubahRole(u: AdminUserRow, role: UserRole) {
    setRoleMap((m) => ({ ...m, [u.id]: role }));
    try {
      const res = await api.patch<{ user: AdminUserRow }>(`/users/${u.id}`, { role });
      setData((d) => d ? { ...d, rows: d.rows.map((r) => (r.id === u.id ? res.user : r)) } : d);
      setRoleMap((m) => ({ ...m, [u.id]: res.user.role }));
      pesan(`Peran akun ${u.name} diubah menjadi ${roleConfig[res.user.role].label}.`);
    } catch (e) {
      setRoleMap((m) => ({ ...m, [u.id]: u.role }));
      pesan(e instanceof ApiError ? e.message : "Gagal mengubah peran akun.", "error");
    }
  }

  async function resetPassword() {
    if (!resetTarget) return;
    try {
      const res = await api.post<{ temporaryPassword: string; email: string }>(`/users/${resetTarget.id}/reset-password`);
      setTempBaru({ email: res.email, password: res.temporaryPassword });
      setData((d) => d ? { ...d, rows: d.rows.map((r) => (r.id === resetTarget.id ? { ...r, status: "aktif" } : r)) } : d);
    } catch (e) {
      pesan(e instanceof ApiError ? e.message : "Gagal mereset kata sandi.", "error");
    }
    setResetTarget(null);
  }

  const dapatDiubah = (u: AdminUserRow) => !u.isSelf && u.role !== "admin";

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {resetTarget && (
        <ResetModal
          nama={resetTarget.name}
          email={resetTarget.email}
          onClose={() => setResetTarget(null)}
          onReset={resetPassword}
        />
      )}
      {tempBaru && (
        <TempPasswordModal
          email={tempBaru.email}
          password={tempBaru.password}
          onClose={() => setTempBaru(null)}
        />
      )}

      {message && (
        <div
          className={`flex items-start gap-2 p-3 border rounded-xl ${
            messageType === "error" ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <span className={`text-xs ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>
            {message}
          </span>
          <button onClick={() => setMessage("")} className={`ml-auto hover:opacity-70 ${messageType === "error" ? "text-red-500" : "text-emerald-500"}`}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Akses &amp; Hak Pengguna Sistem
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Kelola Akun Pengguna</h1>
          <p className="text-xs text-gray-500 max-w-lg">
            Aktivasi akun yang menunggu persetujuan, ubah peran, nonaktifkan, dan reset kata sandi login.
          </p>
        </div>

        {/* Stat cards */}
        <div className="flex flex-col sm:flex-row items-start gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <UserCog size={16} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Total Akun</div>
              <div className="text-xl font-black text-gray-900">{data?.ringkasan.total ?? "…"} Akun</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Menunggu Aktivasi</div>
              <div className="text-xl font-black text-amber-700">{data?.ringkasan.pending ?? "…"} Akun</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Aktif</div>
              <div className="text-xl font-black text-emerald-700">{data?.ringkasan.aktif ?? "…"} Akun</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-sm font-bold text-gray-900">Seluruh Akun Terdaftar</div>
            <p className="text-xs text-gray-400 mt-0.5">
              Akun dibuat lewat menu Kelola Pegawai saat email pegawai diisi.
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52 placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Pengguna", "Instansi / NIP", "Peran", "Status", "Masuk Terakhir", "Aksi"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-normal text-gray-400 uppercase tracking-wide px-5 py-3"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                    Memuat daftar akun…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                    {loadError || "Tidak ada akun ditemukan."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const stat = statusMeta(u.status);
                  const role = roleMap[u.id] ?? u.role;
                  const editable = dapatDiubah(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${colorOf(u.name)} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                            {initialsOf(u.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-900">{u.name}</span>
                              {u.isSelf && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-1.5 py-0.5">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-700">{u.instansi ?? "-"}</div>
                        {u.nip && <div className="text-xs text-gray-400 font-mono mt-0.5">{u.nip}</div>}
                      </td>

                      <td className="px-5 py-4">
                        {role === "tamu" || !editable ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${roleConfig[role].cls}`}>
                            {roleConfig[role].label}
                          </span>
                        ) : (
                          <select
                            value={role}
                            onChange={(e) => ubahRole(u, e.target.value as UserRole)}
                            className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          >
                            <option value="petugas">Petugas TPID</option>
                            <option value="admin">Administrator</option>
                          </select>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${stat.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${stat.dot}`} />
                          {stat.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTanggal(u.lastLoginAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {u.status === "pending" && editable && (
                            <button
                              onClick={() => ubahStatus(u, "aktif")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                              <CheckCircle2 size={12} />
                              Setujui
                            </button>
                          )}
                          {u.status === "aktif" && editable && (
                            <button
                              onClick={() => ubahStatus(u, "nonaktif")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <Ban size={12} />
                              Nonaktifkan
                            </button>
                          )}
                          {u.status === "nonaktif" && editable && (
                            <button
                              onClick={() => ubahStatus(u, "aktif")}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                            >
                              <RotateCcw size={12} />
                              Aktifkan
                            </button>
                          )}
                          {!u.isSelf && u.role !== "admin" && (
                            <button
                              onClick={() => setResetTarget(u)}
                              title="Reset kata sandi"
                              className="w-7 h-7 rounded-lg border border-amber-200 flex items-center justify-center hover:bg-amber-50 text-amber-500 transition-colors"
                            >
                              <KeyRound size={12} />
                            </button>
                          )}
                          {u.pegawaiName && (
                            <span className="text-[10px] text-gray-400" title="Terhubung ke data pegawai">
                              <UserIcon size={12} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-gray-400">
            Menampilkan <strong className="text-gray-600">{filtered.length}</strong> dari{" "}
            <strong className="text-gray-600">{data?.rows.length ?? 0}</strong> akun terdaftar
          </span>
          <span className="text-xs text-gray-400">
            Akun admin &amp; akun tamu dikelola langsung, tidak bisa diubah dari menu ini.
          </span>
        </div>
      </div>
    </div>
  );
}