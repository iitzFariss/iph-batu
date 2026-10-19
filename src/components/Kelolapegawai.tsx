import { useEffect, useState } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  BadgeCheck,
  User,
  Mail,
  Phone,
  KeyRound,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import PageHeading from "./PageHeading";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status yang bisa dipilih di form; sama dengan PEGAWAI_STATUSES di backend. */
type PegawaiStatus = "aktif" | "nonaktif" | "cuti";

interface Pegawai {
  id: string;
  initials: string;
  color: string;
  name: string;
  nip: string;
  instansi: string;
  instansiSub: string;
  peran: string;
  peranIcon: string;
  /** String, bukan PegawaiStatus: dikirim apa adanya oleh API. */
  status: string;
  email?: string;
  phone?: string | null;
  isAccountCreated?: boolean;
}

// ─── Status config ──────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  cls: string;
  dot: string;
  selectedCls: string;
}

/**
 * Satu-satunya sumber warna status. Badge tabel dan tombol form keduanya membaca
 * dari sini, sehingga menambah status baru tidak bisa lupa diberi warna.
 */
const statusConfig: Record<PegawaiStatus, StatusMeta> = {
  aktif: {
    label: "Aktif",
    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    selectedCls: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  nonaktif: {
    label: "Nonaktif",
    cls: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
    selectedCls: "border-gray-400 bg-gray-100 text-gray-600",
  },
  cuti: {
    label: "Cuti",
    cls: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
    selectedCls: "border-amber-500 bg-amber-50 text-amber-700",
  },
};

const DAFTAR_STATUS = Object.keys(statusConfig) as PegawaiStatus[];

const statusFallback: StatusMeta = {
  label: "Tidak Diketahui",
  cls: "bg-gray-100 text-gray-600 border border-gray-300",
  dot: "bg-gray-400",
  selectedCls: "border-gray-400 bg-gray-100 text-gray-600",
};

/** Lookup defensif: status dari database tidak dijamin ada di daftar di atas. */
function statusMeta(status: string): StatusMeta {
  return statusConfig[status as PegawaiStatus] ?? statusFallback;
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  mode: "add" | "edit";
  initial?: Pegawai;
  onClose: () => void;
  onSave: (p: Pegawai) => Promise<void>;
}

function PegawaiModal({ mode, initial, onClose, onSave }: ModalProps) {
  const [saving, setSaving] = useState(false);
  const dialogRef = useDialogFocus(() => { if (!saving) onClose(); });
  const [form, setForm] = useState({
    name:       initial?.name       ?? "",
    nip:        initial?.nip        ?? "",
    instansi:   initial?.instansi   ?? "",
    instansiSub: initial?.instansiSub ?? "",
    peran:      initial?.peran      ?? "",
    peranIcon:  initial?.peranIcon  ?? "",
    status:     initial?.status     ?? "aktif",
    email:      initial?.email      ?? "",
    phone:      initial?.phone      ?? "",
  });
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");

  function reportError(message: string, field = "") {
    setError(message);
    setErrorField(field);
    const input = dialogRef.current?.querySelector<HTMLInputElement>(`[name="${field}"]`);
    input?.focus();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (form.name.trim().length < 3) { reportError("Nama pegawai minimal 3 karakter.", "name"); return; }
    if (!/^[0-9]{16,18}$/.test(form.nip.replace(/\s/g, ""))) { reportError("NIP harus 16–18 digit angka. Spasi pemisah boleh digunakan.", "nip"); return; }
    if (form.peran.trim().length < 3) { reportError("Peran penugasan minimal 3 karakter.", "peran"); return; }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { reportError("Format email tidak valid.", "email"); return; }
    if (form.phone.trim() && !/^(\+?62|0)8[0-9]{8,12}$/.test(form.phone.trim().replace(/[\s\-()]/g, ""))) {
      reportError("Nomor WhatsApp tidak valid. Gunakan awalan 08 atau +628.", "phone"); return;
    }

    const initials = form.name.split(" ").slice(0,2).map((n: string) => n[0]).join("").toUpperCase();
    const colors = ["bg-gray-700","bg-emerald-600","bg-blue-600","bg-teal-600","bg-purple-600","bg-amber-600","bg-rose-600"];
    const color  = initial?.color ?? colors[Math.floor(Math.random() * colors.length)];

    setSaving(true);
    setError("");
    try { await onSave({
      id:         initial?.id ?? String(Date.now()),
      initials,
      color,
      name:       form.name,
      nip:        form.nip,
      instansi:   form.instansi,
      instansiSub: form.instansiSub,
      peran:      form.peran,
      peranIcon:  form.peranIcon,
      status:     form.status,
      email:      form.email.trim() || undefined,
      phone:      form.phone.trim() || null,
    }); } catch (error) {
      reportError(error instanceof ApiError ? error.message : "Gagal menyimpan pegawai. Coba lagi.", error instanceof ApiError ? error.field ?? "" : "");
    } finally { setSaving(false); }
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={mode === "add" ? "Tambah pegawai" : "Edit pegawai"} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSave} noValidate className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden" aria-busy={saving}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {mode === "add" ? "Tambah Pegawai Baru" : "Edit Data Pegawai"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add" ? "Daftarkan personil baru ke direktori TPID" : "Perbarui informasi pegawai terdaftar"}
            </p>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Tutup dialog pegawai" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 min-h-0 overflow-y-auto">
          {error && (
            <div id="pegawai-form-error" role="alert" className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <X size={11} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nama Lengkap & Gelar <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.name}
                name="name" required minLength={3} disabled={saving}
                aria-invalid={!!error && errorField === "name"}
                aria-describedby={error && errorField === "name" ? "pegawai-form-error" : undefined}
                aria-label="Nama lengkap dan gelar"
                onChange={(e) => { setForm({...form, name: e.target.value}); setError(""); }}
                placeholder="Nama lengkap pegawai"
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* NIP */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              NIP <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <BadgeCheck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.nip}
                name="nip" required inputMode="numeric" disabled={saving}
                aria-invalid={!!error && errorField === "nip"}
                aria-describedby={error && errorField === "nip" ? "pegawai-nip-help pegawai-form-error" : "pegawai-nip-help"}
                aria-label="NIP pegawai"
                onChange={(e) => { setForm({...form, nip: e.target.value}); setError(""); }}
                placeholder="18 digit NIP ASN"
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 font-mono tracking-wider"
              />
            </div>
            <p id="pegawai-nip-help" className="text-xs text-gray-500 mt-1.5">NIP terdiri dari 16–18 digit angka. Spasi pemisah boleh digunakan.</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.email}
                name="email" disabled={saving}
                aria-invalid={!!error && errorField === "email"}
                aria-describedby={error && errorField === "email" ? "pegawai-form-error" : undefined}
                aria-label="Email pegawai"
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="nama@instansi.go.id"
                type="email"
                inputMode="email"
                autoComplete="off"
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
              {mode === "add"
                ? "Isi untuk sekaligus membuat akun login berperan petugas."
                : initial?.email
                ? "Dipakai sebagai akun login pegawai. Mengubahnya juga mengubah email masuk aplikasi."
                : "Belum ada akun login. Mengisi email akan membuat akun berperan petugas untuk pegawai ini."}
            </p>
          </div>

          <div>
            <label htmlFor="pegawai-phone" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Nomor WhatsApp</label>
            <div className="relative">
              <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="pegawai-phone" name="phone" disabled={saving} aria-invalid={!!error && errorField === "phone"} aria-describedby={error && errorField === "phone" ? "pegawai-form-error" : undefined} type="tel" inputMode="tel" autoComplete="tel" value={form.phone}
                onChange={(e) => { setForm({ ...form, phone: e.target.value }); setError(""); }}
                placeholder="Contoh: 0812 3456 7890"
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300" />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">Untuk undangan dan pengingat rapat. Dapat diisi tanpa membuat akun login.</p>
          </div>

          {/* Peran */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Peran Penugasan TPID <span className="text-red-400">*</span>
            </label>
            <input
              value={form.peran}
              name="peran" required minLength={3} disabled={saving}
              aria-invalid={!!error && errorField === "peran"}
              aria-describedby={error && errorField === "peran" ? "pegawai-form-error" : undefined}
              aria-label="Peran penugasan"
              onChange={(e) => { setForm({...form, peran: e.target.value}); setError(""); }}
              placeholder="Contoh: Analis Data BPS & Verifikator"
              className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Status Penugasan
            </label>
            <div className="flex gap-2">
              {DAFTAR_STATUS.map((s) => (
                <button
                  key={s}
                  disabled={saving}
                  type="button"
                  onClick={() => setForm({...form, status: s})}
                  aria-pressed={form.status === s}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.status === s
                      ? statusConfig[s].selectedCls
                      : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dialog-actions px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button" disabled={saving}
            onClick={onClose}
            className="secondary-action"
          >
            Batal
          </button>
          <button
            type="submit" disabled={saving}
            className="primary-action"
          >
            {saving ? "Menyimpan..." : mode === "add" ? "Tambah Pegawai" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Kata Sandi Sementara Modal ───────────────────────────────────────────────

function KataSandiModal({
  email,
  password,
  mode,
  onClose,
}: {
  email: string;
  password: string;
  mode: "buat" | "reset";
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus(onClose);
  const [disalin, setDisalin] = useState(false);

  async function salin() {
    try {
      await navigator.clipboard.writeText(password);
      setDisalin(true);
    } catch {
      setDisalin(false);
    }
  }

  const judul = mode === "buat" ? "Akun Login Dibuat" : "Kata Sandi Direset";

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Kata sandi sementara" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">{judul}</h3>
          <button onClick={onClose} aria-label="Tutup kata sandi sementara" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3 leading-snug">
          {mode === "buat" ? (
            <>
              Pegawai sekarang bisa masuk aplikasi dengan{" "}
              <strong className="text-gray-700">{email}</strong> dan kata sandi sementara di bawah
              ini.
            </>
          ) : (
            <>
              Kata sandi akun <strong className="text-gray-700">{email}</strong> sudah direset.
              Semua perangkat yang sedang masuk akan keluar otomatis. Bagikan sandi sementara di
              bawah ini.
            </>
          )}
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
          Selesai
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KelolaPegawai() {
  const [pegawai, setPegawai]         = useState<Pegawai[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal]             = useState<null | { mode: "add" | "edit"; data?: Pegawai }>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<Pegawai | null>(null);
  const [resetBusy, setResetBusy]     = useState(false);
  const [tempPass, setTempPass]       = useState<null | { email: string; password: string; mode: "buat" | "reset" }>(null);
  const perPage = 4;
  const confirmationRef = useDialogFocus(() => { if (!resetBusy) { setDeleteId(null); setResetTarget(null); } }, !!deleteId || !!resetTarget);

  useEffect(() => {
    api
      .get<{ rows: Pegawai[] }>("/pegawai")
      .then(({ rows }) => {
        setPegawai(rows.map((p) => ({ ...p, nip: p.nip.trim() })));
      })
      .catch((e) => {
        setLoadError(e instanceof ApiError ? e.message : "Gagal memuat data pegawai.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter
  const filtered = pegawai.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nip.includes(search);
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalAktif    = pegawai.filter((p) => p.status === "aktif").length;
  const totalInstansi = new Set(pegawai.map((p) => p.instansi)).size;

  async function handleSave(p: Pegawai) {
    setMessage("");
    setMessageType("info");
    const payload: Record<string, string | null> = {
      name: p.name,
      nip: p.nip,
      instansi: p.instansi === "-" ? "" : p.instansi,
      instansiSub: p.instansiSub,
      peran: p.peran,
      peranIcon: p.peranIcon,
      status: p.status,
      phone: p.phone ?? null,
    };
    const emailBaru = (p.email ?? "").trim();
    if (modal?.mode === "add") {
      if (emailBaru) payload.email = emailBaru;
    } else {
      // Email hanya dikirim saat berubah. Email kosong tidak menghapus akun
      // yang sudah ada (akun tetap aktif), hanya data direktori saja.
      const emailSemula = (modal?.data?.email ?? "").trim();
      if (emailBaru !== emailSemula) payload.email = emailBaru || null;
    }
    if (modal?.mode === "add") {
      const res = await api.post<{ pegawai: Pegawai; temporaryPassword?: string | null }>("/pegawai", payload);
      setPegawai((prev) => [res.pegawai, ...prev]);
      if (res.temporaryPassword) {
        setTempPass({ email: res.pegawai.email ?? "", password: res.temporaryPassword, mode: "buat" });
      }
    } else {
      const res = await api.patch<{ pegawai: Pegawai; temporaryPassword?: string | null }>(`/pegawai/${p.id}`, payload);
      setPegawai((prev) => prev.map((x) => (x.id === p.id ? res.pegawai : x)));
      if (res.temporaryPassword) {
        setTempPass({ email: res.pegawai.email ?? "", password: res.temporaryPassword, mode: "buat" });
      }
    }
    setModal(null);
    setCurrentPage(1);
  }

  async function handleResetPassword(p: Pegawai) {
    setMessage("");
    setMessageType("info");
    setResetBusy(true);
    try {
      const res = await api.post<{ email: string; temporaryPassword: string }>(
        `/pegawai/${p.id}/reset-password`
      );
      setResetTarget(null);
      setTempPass({ email: res.email, password: res.temporaryPassword, mode: "reset" });
    } catch (e) {
      setMessage(e instanceof ApiError ? `Gagal reset: ${e.message}` : "Gagal mereset kata sandi.");
      setMessageType("error");
      setResetTarget(null);
    } finally {
      setResetBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setMessage("");
    try {
      await api.delete(`/pegawai/${id}`);
      setMessage("Pegawai berhasil dihapus.");
      setMessageType("info");
      setPegawai((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setMessage(e instanceof ApiError ? `Gagal menghapus: ${e.message}` : "Gagal menghapus pegawai.");
      setMessageType("error");
    }
    setDeleteId(null);
  }

  return (
    <div className="pegawai-page space-y-6 w-full">
      {/* Modal */}
      {modal && (
        <PegawaiModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div ref={confirmationRef} role="dialog" aria-modal="true" aria-label="Hapus pegawai" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Hapus Pegawai?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Data pegawai ini akan dihapus permanen dari direktori TPID.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset kata sandi confirm */}
      {resetTarget && (
        <div ref={confirmationRef} role="dialog" aria-modal="true" aria-label="Reset kata sandi" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <KeyRound size={20} className="text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Reset Kata Sandi?</h3>
            <p className="text-xs text-gray-500 mb-4 leading-snug">
              Sandi akun login <strong className="text-gray-700">{resetTarget.email ?? "-"}</strong>{" "}
              diganti baru sementara; semua perangkat yang sedang masuk akan keluar otomatis.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setResetTarget(null)}
                disabled={resetBusy}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleResetPassword(resetTarget)}
                disabled={resetBusy}
                className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-60"
              >
                {resetBusy ? "Memproses…" : "Ya, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kata sandi sementara setelah akun dibuat / direset */}
      {tempPass && (
        <KataSandiModal
          email={tempPass.email}
          password={tempPass.password}
          mode={tempPass.mode}
          onClose={() => setTempPass(null)}
        />
      )}

      {/* Feedback message */}
      {message && (
        <div
          className={`flex items-start gap-2 p-3 border rounded-xl ${
            messageType === "error"
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
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

      <PageHeading title="Kelola pegawai" description="Data pegawai, nomor WhatsApp, penugasan, dan akses akun TPID."><button onClick={() => setModal({ mode: "add" })} className="primary-action"><Plus size={16} />Tambah Pegawai Baru</button></PageHeading>
      <dl className="summary-strip"><div><dd>{pegawai.length}</dd><dt>Pegawai terdaftar</dt></div><div><dd>{totalAktif}</dd><dt>Pegawai aktif</dt></div><div><dd>{totalInstansi}</dd><dt>Instansi</dt></div></dl>

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Direktori pegawai</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Perbarui nomor WhatsApp untuk menerima undangan dan pengingat rapat.
            </p>
          </div>


          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari nama atau NIP..."
              aria-label="Cari pegawai berdasarkan nama atau NIP"
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-64 placeholder:text-gray-300"
            />
          </div>

        </div>

        {/* Table */}
        <p className="table-scroll-hint">Geser tabel untuk melihat penugasan dan tombol aksi pegawai.</p>
        <div className="overflow-x-auto" role="region" aria-label="Tabel direktori pegawai" tabIndex={0}>
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Nama Pegawai & NIP", "Peran Penugasan TPID", "Status", "Aksi"].map((col) => (
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
<td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                    Memuat data pegawai…
                  </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
<td colSpan={4} className="text-center py-10 text-sm text-gray-400">
                    {loadError || "Tidak ada pegawai ditemukan."}
                  </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Nama */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="account-avatar flex-shrink-0">
                        {p.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">NIP {p.nip}</div>
                        <div className="text-xs text-gray-400 mt-0.5">WhatsApp: {p.phone || "Belum diisi"}</div>
                        {p.email && (
                          <div className="text-xs text-gray-400 truncate max-w-[220px] mt-0.5">
                            {p.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Peran */}
                  <td className="px-5 py-4">
                    <div className="max-w-[220px]">
                      <span className="text-sm font-semibold text-gray-700 truncate">{p.peran}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    {(() => {
                      const meta = statusMeta(p.status);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                          {meta.label}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label={`Edit pegawai ${p.name}`}
                        onClick={() => setModal({ mode: "edit", data: p })}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setResetTarget(p)}
                        disabled={!p.email}
                        title={p.email ? "Reset kata sandi akun login" : "Belum ada akun login"}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <KeyRound size={12} />
                      </button>
                      <button
                        aria-label={`Hapus pegawai ${p.name}`}
                        onClick={() => setDeleteId(p.id)}
                        className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-400">
            Menampilkan <strong>{Math.min((currentPage - 1) * perPage + 1, filtered.length)}–{Math.min(currentPage * perPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> Pegawai TPID Terdaftar
          </span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Halaman sebelumnya"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentPage === p ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              aria-label="Halaman berikutnya"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>
</div>
      </div>
    </div>
  );
}
