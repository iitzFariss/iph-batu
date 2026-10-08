import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  X,
  Printer,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  Ban,
  Clock,
  MapPin,
} from "lucide-react";
import { api, ApiError } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KaderPersonil {
  id: string;
  name: string;
  peran: string;
}

interface PetugasTerpilih {
  pegawaiId: string;
  name: string;
  peran: string;
}

interface RapatAgenda {
  id: string;
  topik: string;
  tanggal: string;
  lokasi: string | null;
  catatan: string | null;
  status: string;
  petugas: { pegawaiId: string; name: string; peran: string }[];
  notulensi: { submittedAt: string; by: string; isi: string } | null;
}

type StatusKader = "memuat" | "siap" | "gagal";

// ─── Format helper ────────────────────────────────────────────────────────────

/** ISO → "YYYY-MM-DD" lokal untuk input type="date". */
function tanggalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO → "HH:mm" lokal untuk input type="time". */
function waktuInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatJadwal(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : `${FORMAT_TANGGAL.format(d)} • ${waktuInput(iso)} WIB`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusBadge: Record<string, { label: string; cls: string; dot: string }> = {
  terjadwal: { label: "Terjadwal", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  selesai: { label: "Selesai", cls: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-500" },
  dibatalkan: { label: "Dibatalkan", cls: "bg-red-50 text-red-600 border border-red-200", dot: "bg-red-500" },
};

const statusFallback = { label: "Tidak Diketahui", cls: "bg-gray-100 text-gray-600 border border-gray-300", dot: "bg-gray-400" };

function badgeStatus(status: string) {
  return statusBadge[status] ?? statusFallback;
}

// ─── Edit Rapat Modal ─────────────────────────────────────────────────────────

interface EditRapatModalProps {
  rapat: RapatAgenda;
  kader: KaderPersonil[];
  onClose: () => void;
  onSaved: (rapat: RapatAgenda) => void;
}

function EditRapatModal({ rapat, kader, onClose, onSaved }: EditRapatModalProps) {
  const [form, setForm] = useState({
    topik: rapat.topik,
    tanggal: tanggalInput(rapat.tanggal),
    waktu: waktuInput(rapat.tanggal),
    lokasi: rapat.lokasi ?? "",
    catatan: rapat.catatan ?? "",
  });
  const [petugas, setPetugas] = useState<PetugasTerpilih[]>(
    rapat.petugas.map((p) => ({ pegawaiId: p.pegawaiId, name: p.name, peran: p.peran }))
  );
  const [openPicker, setOpenPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const available = kader.filter((k) => !petugas.some((p) => p.pegawaiId === k.id));

  function tambah(k: KaderPersonil) {
    setPetugas((cur) => [...cur, { pegawaiId: k.id, name: k.name, peran: cur.length === 0 ? "notulis" : "peserta" }]);
    setOpenPicker(false);
  }

  async function simpan() {
    setErr("");
    if (!form.topik.trim()) { setErr("Topik / agenda rapat wajib diisi."); return; }
    if (!form.tanggal || !form.waktu) { setErr("Tanggal dan waktu pelaksanaan wajib diisi."); return; }
    if (petugas.length === 0) { setErr("Pilih minimal satu petugas rapat."); return; }
    if (!petugas.some((p) => p.peran === "notulis")) { setErr("Minimal satu petugas berperan notulis."); return; }

    setBusy(true);
    try {
      const res = await api.patch<{ rapat: RapatAgenda }>(`/rapat/${rapat.id}`, {
        topik: form.topik.trim(),
        tanggal: new Date(`${form.tanggal}T${form.waktu}`).toISOString(),
        lokasi: form.lokasi.trim() || null,
        catatan: form.catatan.trim() || null,
        petugas: petugas.map((p) => ({ pegawaiId: p.pegawaiId, peran: p.peran })),
      });
      onSaved(res.rapat);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Gagal memperbarui rapat.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Ubah Jadwal Rapat</h3>
            <p className="text-xs text-gray-400 mt-0.5">Perbarui agenda, waktu, lokasi, atau personil rapat</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {err && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">{err}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Topik / Agenda Koordinasi <span className="text-red-500 font-normal">*Wajib</span>
            </label>
            <input
              type="text"
              value={form.topik}
              onChange={(e) => setForm({ ...form, topik: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Rapat <span className="text-red-500 font-normal">*Wajib</span></label>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Waktu Pelaksanaan <span className="text-red-500 font-normal">*Wajib</span></label>
              <input
                type="time"
                value={form.waktu}
                onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ruang Rapat / Tautan Virtual</label>
            <input
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Petugas Notulis</label>
              <button
                onClick={() => setOpenPicker((v) => !v)}
                className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
              >
                <UserPlus size={12} />
                + Tambah Personil
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {petugas.map((p) => (
                  <div key={p.pegawaiId} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-emerald-800 font-medium">{p.name}</span>
                    <select
                      value={p.peran}
                      onChange={(e) => setPetugas((cur) => cur.map((x) => (x.pegawaiId === p.pegawaiId ? { ...x, peran: e.target.value } : x)))}
                      className="text-[11px] border border-emerald-200 bg-white rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      aria-label={`Peran ${p.name}`}
                    >
                      <option value="notulis">Notulis</option>
                      <option value="peserta">Peserta</option>
                    </select>
                    <button
                      onClick={() => setPetugas((cur) => cur.filter((x) => x.pegawaiId !== p.pegawaiId))}
                      className="ml-0.5 text-emerald-400 hover:text-emerald-700"
                      aria-label={`Hapus ${p.name}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                readOnly
                value={petugas.length === 0 ? "" : `${petugas.length} personil terpilih`}
                placeholder="Pilih aparatur penugasan notulis di sini..."
                className="w-full text-xs text-gray-500 focus:outline-none cursor-pointer"
                onClick={() => setOpenPicker((v) => !v)}
              />
            </div>
            {openPicker && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {available.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                    Semua personil sudah ditambahkan.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {available.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => tambah(k)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={12} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{k.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{k.peran}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <textarea
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={simpan}
            disabled={busy}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KelolaRapat() {
  const [petugas, setPetugas] = useState<PetugasTerpilih[]>([]);
  const [kader, setKader] = useState<KaderPersonil[]>([]);
  const [status, setStatus] = useState<StatusKader>("memuat");
  const [percobaan, setPercobaan] = useState(0);
  const [openPicker, setOpenPicker] = useState(false);

  const [topik, setTopik] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "sukses" | "gagal"; teks: string } | null>(null);

  const [rapatRows, setRapatRows] = useState<RapatAgenda[]>([]);
  const [kini, setKini] = useState(0);
  const [statistikGagal, setStatistikGagal] = useState(false);
  const [editRapat, setEditRapat] = useState<RapatAgenda | null>(null);
  const [batalRapat, setBatalRapat] = useState<RapatAgenda | null>(null);
  const [hapusRapat, setHapusRapat] = useState<RapatAgenda | null>(null);
  const [aksiBusy, setAksiBusy] = useState(false);

  // Daftar personil selalu berasal dari server. Hanya pegawai berstatus aktif
  // yang ditawarkan, karena backend menolak petugas nonaktif saat rapat dibuat.
  useEffect(() => {
    let batal = false;
    api
      .get<{ rows: { id: string; name: string; peran: string; status: string }[] }>("/pegawai")
      .then(({ rows }) => {
        if (batal) return;
        setKader(
          rows
            .filter((p) => p.status === "aktif")
            .map((p) => ({ id: p.id, name: p.name, peran: p.peran }))
        );
        setStatus("siap");
      })
      .catch(() => {
        if (batal) return;
        setKader([]);
        setStatus("gagal");
      });
    return () => {
      batal = true;
    };
  }, [percobaan]);

  const muatStatistik = useCallback(() => {
    api
      .get<{ rows: RapatAgenda[] }>("/rapat")
      .then(({ rows }) => {
        setRapatRows(rows);
        setKini(Date.now());
        setStatistikGagal(false);
      })
      .catch(() => {
        setRapatRows([]);
        setStatistikGagal(true);
      });
  }, []);

  useEffect(() => {
    muatStatistik();
  }, [muatStatistik]);

  const available = kader.filter((k) => !petugas.some((p) => p.pegawaiId === k.id));

  function addPersonil(k: KaderPersonil) {
    setPetugas((cur) => [...cur, { pegawaiId: k.id, name: k.name, peran: cur.length === 0 ? "notulis" : "peserta" }]);
    setOpenPicker(false);
  }

  function removePersonil(pegawaiId: string) {
    setPetugas((cur) => cur.filter((p) => p.pegawaiId !== pegawaiId));
  }

  function ubahPeran(pegawaiId: string, peran: string) {
    setPetugas((cur) => cur.map((p) => (p.pegawaiId === pegawaiId ? { ...p, peran } : p)));
  }

  const totalTerjadwal = rapatRows.filter((r) => r.status === "terjadwal").length;
  const menungguResume = rapatRows.filter(
    (r) => r.status === "terjadwal" && !r.notulensi && new Date(r.tanggal).getTime() < kini
  ).length;
  const selesaiTervalidasi = rapatRows.filter((r) => r.notulensi).length;

  function gantiRapat(baru: RapatAgenda) {
    setRapatRows((cur) => cur.map((r) => (r.id === baru.id ? baru : r)));
  }

  async function konfirmasiBatal() {
    if (!batalRapat) return;
    setAksiBusy(true);
    try {
      const res = await api.patch<{ rapat: RapatAgenda }>(`/rapat/${batalRapat.id}`, { status: "dibatalkan" });
      gantiRapat(res.rapat);
      setBatalRapat(null);
    } catch (e) {
      setPesan({ tipe: "gagal", teks: e instanceof ApiError ? e.message : "Gagal membatalkan rapat." });
    } finally {
      setAksiBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapusRapat) return;
    setAksiBusy(true);
    try {
      await api.delete(`/rapat/${hapusRapat.id}`);
      setRapatRows((cur) => cur.filter((r) => r.id !== hapusRapat.id));
      setHapusRapat(null);
    } catch (e) {
      setPesan({ tipe: "gagal", teks: e instanceof ApiError ? e.message : "Gagal menghapus rapat." });
    } finally {
      setAksiBusy(false);
    }
  }

  async function handleSubmit() {
    setPesan(null);
    if (!topik.trim()) {
      setPesan({ tipe: "gagal", teks: "Topik / agenda rapat wajib diisi." });
      return;
    }
    if (!tanggal || !waktu) {
      setPesan({ tipe: "gagal", teks: "Tanggal dan waktu pelaksanaan wajib diisi." });
      return;
    }
    if (petugas.length === 0) {
      setPesan({ tipe: "gagal", teks: "Pilih minimal satu petugas rapat." });
      return;
    }
    if (!petugas.some((p) => p.peran === "notulis")) {
      setPesan({ tipe: "gagal", teks: "Minimal satu petugas berperan notulis." });
      return;
    }

    setMenyimpan(true);
    try {
      const res = await api.post<{ message: string }>("/rapat", {
        topik: topik.trim(),
        tanggal: new Date(`${tanggal}T${waktu}`).toISOString(),
        lokasi: lokasi.trim() || null,
        catatan: catatan.trim() || null,
        petugas: petugas.map((p) => ({ pegawaiId: p.pegawaiId, peran: p.peran })),
      });
      setPesan({ tipe: "sukses", teks: res.message });
      setTopik("");
      setTanggal("");
      setWaktu("");
      setLokasi("");
      setCatatan("");
      setPetugas([]);
      muatStatistik();
    } catch (e) {
      setPesan({ tipe: "gagal", teks: e instanceof ApiError ? e.message : "Gagal membuat rapat." });
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-gray-400">
        <span>Dashboard</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span>Koordinasi &amp; Kegiatan</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span className="text-gray-700 font-medium">Kelola Rapat TPID</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Kelola Jadwal &amp; Agenda Rapat TPID
          </h1>
          <p className="text-xs text-gray-500">
            Penjadwalan rapat koordinasi pengendalian inflasi daerah dan penugasan aparatur
            notulen. Pengingat WhatsApp dibuat otomatis di halaman Monitoring Rapat.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-1 lg:flex-none"
          >
            <Printer size={12} />
            <span>Cetak Jadwal</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Rapat Terjadwal", value: kini === 0 ? "—" : totalTerjadwal, sub: "Seluruh jadwal aktif", icon: <Calendar size={18} className="text-gray-400" />, accent: "" },
          { label: "Menunggu Notulensi", value: kini === 0 ? "—" : menungguResume, sub: "Notulensi belum diisi", icon: <AlertTriangle size={18} className="text-amber-500" />, accent: "border-l-2 border-l-amber-400" },
          { label: "Notulensi Diisi", value: kini === 0 ? "—" : selesaiTervalidasi, sub: "Rapat dengan notulensi lengkap", icon: <CheckCircle2 size={18} className="text-emerald-500" />, accent: "border-l-2 border-l-emerald-400" },
        ].map(({ label, value, sub, icon, accent }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${accent}`}>
            <div>
              <div className="text-sm text-gray-400 mb-0.5">{label}</div>
              <div className="text-3xl font-black text-gray-900 leading-tight">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
            <div>{icon}</div>
          </div>
        ))}
      </div>
      {statistikGagal && (
        <p className="text-xs text-amber-700 -mt-1">
          Statistik rapat gagal dimuat. Angka akan terisi otomatis saat koneksi pulih — muat ulang
          halaman bila masih kosong.
        </p>
      )}

      {/* Form: Jadwalkan Rapat Baru */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Jadwalkan Rapat Koordinasi Baru</span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
            FORM-TPID-04
          </span>
        </div>

        <div className="space-y-4">
          {pesan && (
            <div
              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${
                pesan.tipe === "sukses"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {pesan.tipe === "sukses" ? (
                <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              )}
              {pesan.teks}
            </div>
          )}

          {/* Topik */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Topik / Agenda Koordinasi{" "}
              <span className="text-red-500 font-normal">*Wajib</span>
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Rakor Mingguan Pengendalian Pasokan Sembako"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tanggal Rapat <span className="text-red-500 font-normal">*Wajib</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Waktu Pelaksanaan <span className="text-red-500 font-normal">*Wajib</span>
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                  WIB
                </span>
              </div>
            </div>
          </div>

          {/* Ruang Rapat */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ruang Rapat / Tautan Virtual
            </label>
            <div className="relative">
              <FileText size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Ruang Rapat Utama Lt. 2 Balaikota Among Tani / Zoom ID 892 109"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Petugas Rapat */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Petugas Notulis</label>
              <button
                onClick={() => setOpenPicker((v) => !v)}
                className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
              >
                <UserPlus size={12} />
                + Tambah Personil
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {petugas.map((p) => (
                  <div
                    key={p.pegawaiId}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-emerald-800 font-medium">{p.name}</span>
                    <select
                      value={p.peran}
                      onChange={(e) => ubahPeran(p.pegawaiId, e.target.value)}
                      className="text-[11px] border border-emerald-200 bg-white rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      aria-label={`Peran ${p.name}`}
                    >
                      <option value="notulis">Notulis</option>
                      <option value="peserta">Peserta</option>
                    </select>
                    <button
                      onClick={() => removePersonil(p.pegawaiId)}
                      className="ml-0.5 text-emerald-400 hover:text-emerald-700"
                      aria-label={`Hapus ${p.name}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                readOnly
                value={petugas.length === 0 ? "" : `${petugas.length} personil terpilih`}
                placeholder="Pilih aparatur penugasan notulis di sini..."
                className="w-full text-xs text-gray-500 focus:outline-none cursor-pointer"
                onClick={() => setOpenPicker((v) => !v)}
              />
            </div>

            {/* Pick daftar personil (flip card) */}
            {openPicker && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {status === "memuat" ? (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                    Memuat data pegawai…
                  </div>
                ) : status === "gagal" ? (
                  <div className="px-3 py-3 text-center space-y-2">
                    <p className="text-xs text-amber-700">
                      Gagal memuat data pegawai. Daftar personil tidak dapat ditampilkan.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setStatus("memuat");
                        setPercobaan((n) => n + 1);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : available.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                    {kader.length === 0
                      ? "Belum ada data pegawai. Tambahkan pegawai di menu Kelola Pegawai terlebih dahulu."
                      : "Semua personil sudah ditambahkan."}
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {available.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => addPersonil(k)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={12} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{k.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{k.peran}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Catatan internal untuk panitia rapat..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={menyimpan}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar size={15} />
            {menyimpan ? "Menyimpan…" : "Buat Jadwal Rapat"}
          </button>
          <p className="text-center text-xs text-gray-400">
            Pengingat WhatsApp H-1/H-0 dan notulensi terlambat dibuat otomatis di Monitoring Rapat.
          </p>
        </div>
      </div>

      {/* Agenda Rapat */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Agenda Rapat TPID</span>
          </div>
          <span className="text-xs text-gray-400">
            {rapatRows.length} rapat • {rapatRows.filter((r) => r.status === "terjadwal").length} aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Agenda", "Jadwal", "Personil", "Status", "Aksi"].map((col) => (
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
              {statistikGagal ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                    Gagal memuat agenda rapat.
                  </td>
                </tr>
              ) : kini === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                    Memuat agenda…
                  </td>
                </tr>
              ) : rapatRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                    Belum ada rapat dijadwalkan. Gunakan formulir di atas.
                  </td>
                </tr>
              ) : (
                rapatRows.map((r) => {
                  const badge = badgeStatus(r.status);
                  const notulis = r.petugas.find((p) => p.peran === "notulis");
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors align-top">
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-gray-900">{r.topik}</div>
                        {(r.lokasi || r.catatan) && (
                          <div className="text-xs text-gray-400 mt-0.5 space-y-0.5">
                            {r.lokasi && (
                              <div className="flex items-center gap-1">
                                <MapPin size={10} className="flex-shrink-0" />
                                {r.lokasi}
                              </div>
                            )}
                            {r.catatan && <div>{r.catatan}</div>}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-gray-700 whitespace-nowrap">{formatJadwal(r.tanggal)}</div>
                        {r.status !== "dibatalkan" && (
                          <div
                            className={`text-[11px] mt-0.5 flex items-center gap-1 ${
                              new Date(r.tanggal).getTime() < kini ? "text-amber-600" : "text-gray-400"
                            }`}
                          >
                            <Clock size={10} />
                            {new Date(r.tanggal).getTime() < kini ? "Sudah lewat" : "Akan datang"}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {notulis && (
                            <span className="text-xs text-gray-700">
                              <strong className="font-semibold">Notulis:</strong> {notulis.name}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-0.5 max-w-[180px]">
                            {r.petugas
                              .filter((p) => p.peran !== "notulis")
                              .map((p) => (
                                <span key={p.pegawaiId} className="text-[11px] text-gray-400">
                                  {p.name}
                                </span>
                              ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${badge.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {r.status === "terjadwal" && (
                            <>
                              <button
                                onClick={() => setEditRapat(r)}
                                className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                                title="Ubah jadwal"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => setBatalRapat(r)}
                                className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                title="Batalkan rapat"
                              >
                                <Ban size={12} />
                              </button>
                            </>
                          )}
                          {r.status === "dibatalkan" && (
                            <button
                              onClick={() => setHapusRapat(r)}
                              className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Hapus rapat"
                            >
                              <Trash2 size={12} />
                            </button>
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
      </div>

      {/* Modal ubah rapat */}
      {editRapat && (
        <EditRapatModal
          rapat={editRapat}
          kader={kader}
          onClose={() => setEditRapat(null)}
          onSaved={(baru) => {
            gantiRapat(baru);
            setEditRapat(null);
          }}
        />
      )}

      {/* Konfirmasi batalkan */}
      {batalRapat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Ban size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Batalkan Rapat?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Rapat <strong className="text-gray-700">{batalRapat.topik}</strong> akan ditandai{" "}
              dibatalkan dan pengingat WhatsApp-nya dihentikan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBatalRapat(null)}
                disabled={aksiBusy}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Tidak Jadi
              </button>
              <button
                onClick={konfirmasiBatal}
                disabled={aksiBusy}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {aksiBusy ? "Memproses…" : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {hapusRapat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Hapus Rapat?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Data rapat <strong className="text-gray-700">{hapusRapat.topik}</strong> akan dihapus
              permanen. Rapat yang sudah selesai dengan notulensi tidak bisa dihapus.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setHapusRapat(null)}
                disabled={aksiBusy}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={konfirmasiHapus}
                disabled={aksiBusy}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {aksiBusy ? "Memproses…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}