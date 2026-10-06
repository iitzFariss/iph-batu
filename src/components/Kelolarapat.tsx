import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

// ─── Types (cermin respons rapat API) ─────────────────────────────────────────

interface PetugasRow {
  id: string;
  pegawaiId: string;
  name: string;
  instansi: string | null;
  peran: string;
}

interface NotulensiRow {
  submittedAt: string;
  by: string;
}

interface Rapat {
  id: string;
  topik: string;
  tanggal: string;
  lokasi: string | null;
  catatan: string | null;
  status: string;
  petugas: PetugasRow[];
  notulensi: NotulensiRow | null;
  dapatNotulensi: boolean;
}

interface ReminderItem {
  id: string;
  tipe: "rapat" | "notulensi";
  rapatId: string;
  topik: string;
  tanggal: string;
  jatuhTempo: string;
  untuk: string;
  phone: string | null;
  pesan: string;
  waLink: string;
}

interface PegawaiRow {
  id: string;
  name: string;
  peran: string;
  status: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusMeta(status: string) {
  switch (status) {
    case "terjadwal":
      return { label: "Terjadwal", cls: "bg-amber-50 text-amber-700 border border-amber-200", icon: <Clock size={10} /> };
    case "selesai":
      return { label: "Selesai", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 size={10} /> };
    case "dibatalkan":
      return { label: "Dibatalkan", cls: "bg-red-50 text-red-600 border border-red-200", icon: <X size={10} /> };
    default:
      return { label: status, cls: "bg-gray-100 text-gray-600 border border-gray-200", icon: <AlertCircle size={10} /> };
  }
}

function formatWaktu(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Form modal rapat (admin) ─────────────────────────────────────────────────

interface FormPetugas {
  pegawaiId: string;
  peran: string;
}

interface RapatModalProps {
  mode: "buat" | "ubah";
  initial: Rapat | null;
  pegawaiList: PegawaiRow[];
  onClose: () => void;
  onSaved: () => void;
}

function RapatModal({ mode, initial, pegawaiList, onClose, onSaved }: RapatModalProps) {
  const [topik, setTopik] = useState(initial?.topik ?? "");
  const [tanggal, setTanggal] = useState(initial ? toDatetimeLocal(initial.tanggal) : "");
  const [lokasi, setLokasi] = useState(initial?.lokasi ?? "");
  const [catatan, setCatatan] = useState(initial?.catatan ?? "");
  const [petugas, setPetugas] = useState<FormPetugas[]>(
    initial ? initial.petugas.map((p) => ({ pegawaiId: p.pegawaiId, peran: p.peran })) : []
  );
  const [bukaPicker, setBukaPicker] = useState(false);
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const terpilih = (id: string) => petugas.some((p) => p.pegawaiId === id);
  const tersedia = pegawaiList.filter((p) => !terpilih(p.id) && p.status !== "nonaktif");

  function tambah(p: PegawaiRow) {
    setPetugas((cur) => [...cur, { pegawaiId: p.id, peran: "peserta" }]);
    setBukaPicker(false);
  }

  function ubahPeran(pegawaiId: string, peran: string) {
    setPetugas((cur) => cur.map((p) => (p.pegawaiId === pegawaiId ? { ...p, peran } : p)));
  }

  function hapus(pegawaiId: string) {
    setPetugas((cur) => cur.filter((p) => p.pegawaiId !== pegawaiId));
  }

  async function simpan() {
    setError("");
    if (!topik.trim()) { setError("Topik rapat wajib diisi."); return; }
    if (!tanggal) { setError("Tanggal dan waktu rapat wajib diisi."); return; }
    if (petugas.length === 0) { setError("Minimal satu petugas rapat wajib dipilih."); return; }
    if (!petugas.some((p) => p.peran === "notulis")) { setError("Minimal satu petugas berperan notulis."); return; }

    const body = {
      topik: topik.trim(),
      tanggal: new Date(tanggal).toISOString(),
      lokasi: lokasi.trim() || null,
      catatan: catatan.trim() || null,
      petugas,
    };

    setMenyimpan(true);
    try {
      if (mode === "buat") {
        await api.post("/rapat", body);
      } else if (initial) {
        await api.patch(`/rapat/${initial.id}`, body);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan rapat.");
      setMenyimpan(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">
            {mode === "buat" ? "Jadwalkan Rapat Koordinasi" : "Ubah Rapat"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Topik / Agenda Koordinasi <span className="text-red-500 font-normal">*Wajib</span>
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Rakor Mingguan Pengendalian Pasokan Sembako"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal &amp; Waktu</label>
              <input
                type="datetime-local"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lokasi / Ruang Rapat</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="Contoh: Ruang Rapat Utama Lt. 2 Balaikota Among Tani"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan (opsional)</label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Catatan internal untuk panitia rapat..."
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Petugas Rapat</label>
              <button
                onClick={() => setBukaPicker((v) => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Plus size={12} />
                Tambah Petugas
              </button>
            </div>

            <div className="space-y-2">
              {petugas.map((p) => {
                const peg = pegawaiList.find((x) => x.id === p.pegawaiId);
                return (
                  <div key={p.pegawaiId} className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{peg?.name ?? "Pegawai tidak ditemukan"}</div>
                      <div className="text-xs text-gray-400">{peg?.peran}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select
                        value={p.peran}
                        onChange={(e) => ubahPeran(p.pegawaiId, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="notulis">Notulis</option>
                        <option value="peserta">Peserta</option>
                      </select>
                      <button onClick={() => hapus(p.pegawaiId)} className="text-gray-400 hover:text-red-500">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {bukaPicker && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {tersedia.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                    {pegawaiList.length === 0
                      ? "Belum ada data pegawai. Tambahkan pegawai di menu Kelola Pegawai terlebih dahulu."
                      : "Semua pegawai sudah ditambahkan ke rapat ini."}
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
                    {tersedia.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => tambah(p)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700 truncate">{p.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{p.peran}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={simpan}
              disabled={menyimpan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {menyimpan ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
              {mode === "buat" ? "Buat Jadwal Rapat" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "jadwal" | "pengingat";

export default function KelolaRapat() {
  const { user } = useAuth();
  const role = user?.role ?? "petugas";
  const isAdmin = role === "admin";
  const [tab, setTab] = useState<Tab>("jadwal");

  // Data rapat + pegawai + reminder, dimuat sekali dan di-refresh saat berubah.
  const [rapatList, setRapatList] = useState<Rapat[]>([]);
  const [pegawaiList, setPegawaiList] = useState<PegawaiRow[]>([]);
  const [reminderList, setReminderList] = useState<ReminderItem[]>([]);

  const [statusRapat, setStatusRapat] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [statusReminder, setStatusReminder] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [percobaan, setPercobaan] = useState(0);
  const [kini, setKini] = useState(0);
  const [pesan, setPesan] = useState("");
  const [modal, setModal] = useState<{ mode: "buat" | "ubah"; rapat: Rapat | null } | null>(null);
  const [bukaNotulensi, setBukaNotulensi] = useState<string | null>(null);
  const [notulensiIsi, setNotulensiIsi] = useState<Record<string, string>>({});

  const muatRapat = useCallback(() => {
    api
      .get<{ rows: Rapat[] }>("/rapat")
      .then(({ rows }) => {
        setRapatList(rows);
        setKini(Date.now());
        setStatusRapat("siap");
      })
      .catch(() => {
        setRapatList([]);
        setStatusRapat("gagal");
      });
  }, []);

  const muatReminder = useCallback(() => {
    if (!isAdmin) return;
    api
      .get<{ rows: ReminderItem[] }>("/rapat/reminders")
      .then(({ rows }) => {
        setReminderList(rows);
        setStatusReminder("siap");
      })
      .catch(() => {
        setReminderList([]);
        setStatusReminder("gagal");
      });
  }, [isAdmin]);

  useEffect(() => {
    muatRapat();
  }, [muatRapat, percobaan]);

  useEffect(() => {
    if (isAdmin) {
      muatReminder();
    }
  }, [isAdmin, muatReminder, percobaan]);

  useEffect(() => {
    if (isAdmin) {
      api
        .get<{ rows: PegawaiRow[] }>("/pegawai")
        .then(({ rows }) => setPegawaiList(rows))
        .catch(() => setPegawaiList([]));
    }
  }, [isAdmin]);

  async function hapusRapat(r: Rapat) {
    if (!window.confirm(`Hapus rapat "${r.topik}"?`)) return;
    try {
      await api.delete(`/rapat/${r.id}`);
      muatRapat();
    } catch (e) {
      setPesan(e instanceof ApiError ? e.message : "Gagal menghapus rapat.");
    }
  }

  async function simpanNotulensi(r: Rapat) {
    const isi = (notulensiIsi[r.id] ?? "").trim();
    if (!isi) return;
    setPesan("");
    try {
      const res = await api.post<{ rapat: Rapat }>(`/rapat/${r.id}/notulensi`, { isi });
      setRapatList((cur) => cur.map((x) => (x.id === r.id ? res.rapat : x)));
      setBukaNotulensi(null);
    } catch (e) {
      setPesan(e instanceof ApiError ? e.message : "Gagal menyimpan notulensi.");
    }
  }

  const totalTerjadwal = rapatList.filter((r) => r.status === "terjadwal").length;
  const menungguNotulensi = rapatList.filter((r) => r.status !== "dibatalkan" && !r.notulensi && new Date(r.tanggal).getTime() < kini).length;
  const punyaNotulensi = rapatList.filter((r) => r.notulensi).length;

  const tabs: { key: Tab; label: string }[] = isAdmin
    ? [
        { key: "jadwal", label: "Jadwal Rapat" },
        { key: "pengingat", label: "Pengingat WhatsApp" },
      ]
    : [{ key: "jadwal", label: "Rapat Saya" }];

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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Kelola Jadwal &amp; Agenda Rapat TPID</h1>
          <p className="text-xs text-gray-500">
            Penjadwalan rapat koordinasi pengendalian inflasi daerah dan penugasan aparatur notulen.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal({ mode: "buat", rapat: null })}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex-shrink-0"
          >
            <Plus size={13} />
            Jadwalkan Rapat Baru
          </button>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1.5 w-max">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              tab === key ? "bg-gray-900 text-white" : "text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {pesan && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          {pesan}
        </div>
      )}

      {tab === "pengingat" ? (
        // ─── Tab Pengingat WhatsApp (admin) ────────────────────────────────
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-2">
            <Bell size={15} className="text-emerald-600 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pengirim Pengingat WhatsApp</h2>
              <p className="text-xs text-gray-400">
                Pengingat jatuh tempo untuk rapat H-1/H-0 dan notulensi yang belum diisi sejak H+1. Pengiriman dilakukan
                manual melalui tombol Buka WhatsApp; nomor petugas diambil dari Profil Saya masing-masing.
              </p>
            </div>
          </div>

          {statusReminder === "memuat" && (
            <div className="py-6 flex items-center justify-center text-xs text-gray-400">Memuat pengingat…</div>
          )}
          {statusReminder === "gagal" && (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-amber-700">Gagal memuat pengingat.</p>
              <button onClick={() => { setStatusReminder("memuat"); setPercobaan((n) => n + 1); }} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                Coba lagi
              </button>
            </div>
          )}
          {statusReminder === "siap" && reminderList.length === 0 && (
            <div className="py-6 text-center text-xs text-gray-400">
              Tidak ada pengingat yang jatuh tempo hari ini.
            </div>
          )}
          {statusReminder === "siap" && reminderList.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.tipe === "rapat"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {item.tipe === "rapat" ? <Clock size={9} /> : <FileText size={9} />}
                      {item.tipe === "rapat" ? "Rapat" : "Notulensi"}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">{item.jatuhTempo}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mb-1">{item.topik}</div>
                  <div className="text-xs text-gray-500">Kepada: {item.untuk}</div>
                  <div className="text-xs text-gray-400">{item.phone ? `Nomor: ${item.phone}` : "Tanpa nomor WhatsApp — teks dibuka sebagai pilih kontak."}</div>
                  <pre className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px] text-gray-600 whitespace-pre-wrap font-sans">{item.pesan}</pre>
                </div>
                <a
                  href={item.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex-shrink-0"
                >
                  <MessageCircle size={12} />
                  Buka WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ─── Tab Jadwal Rapat ──────────────────────────────────────────────
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Rapat Terjadwal", value: totalTerjadwal, icon: <Calendar size={16} className="text-gray-400" />, cls: "" },
              { label: "Menunggu Notulensi", value: menungguNotulensi, icon: <AlertCircle size={16} className="text-red-500" />, cls: "border-l-2 border-l-red-400" },
              { label: "Notulensi Diisi", value: punyaNotulensi, icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
            ].map(({ label, value, icon, cls }) => (
              <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${cls}`}>
                <div>
                  <div className="text-sm text-gray-400 mb-0.5">{label}</div>
                  <div className="text-3xl font-black text-gray-900 leading-tight">{value}</div>
                </div>
                {icon}
              </div>
            ))}
          </div>

          {statusRapat === "memuat" && (
            <div className="py-10 flex items-center justify-center text-xs text-gray-400">Memuat jadwal rapat…</div>
          )}
          {statusRapat === "gagal" && (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-amber-700">Gagal memuat data rapat.</p>
              <button onClick={() => { setStatusRapat("memuat"); setPercobaan((n) => n + 1); }} className="flex items-center gap-1 mx-auto text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                <RefreshCw size={11} />
                Coba lagi
              </button>
            </div>
          )}
          {statusRapat === "siap" && rapatList.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-xs text-gray-400">
              Belum ada rapat terjadwal.
            </div>
          )}

          {statusRapat === "siap" &&
            rapatList.map((r) => {
              const st = statusMeta(r.status);
              const buka = bukaNotulensi === r.id;
              const draft = notulensiIsi[r.id] ?? "";
              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                          {st.icon}
                          {st.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={9} />
                          {formatWaktu(r.tanggal)}
                        </div>
                        {r.lokasi && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Users size={9} />
                            {r.lokasi}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-gray-900 mb-2">{r.topik}</div>

                      <div className="flex flex-wrap gap-1.5">
                        {r.petugas.map((p) => (
                          <span
                            key={p.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              p.peran === "notulis"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {p.peran === "notulis" ? <FileText size={9} /> : <Users size={9} />}
                            {p.name}
                          </span>
                        ))}
                      </div>

                      {r.catatan && <p className="mt-2 text-xs text-gray-400">{r.catatan}</p>}

                      {r.notulensi && (
                        <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                          <CheckCircle2 size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs text-gray-500">
                              Notulensi diisi oleh <span className="font-semibold text-gray-700">{r.notulensi.by}</span> pada{" "}
                              {new Date(r.notulensi.submittedAt).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => setModal({ mode: "ubah", rapat: r })}
                            className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                          >
                            <Pencil size={10} />
                            Ubah
                          </button>
                          <button
                            onClick={() => hapusRapat(r)}
                            className="flex items-center gap-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={10} />
                            Hapus
                          </button>
                        </>
                      )}
                      {r.dapatNotulensi && (
                        <button
                          onClick={() => {
                            setBukaNotulensi(buka ? null : r.id);
                            setNotulensiIsi((cur) => ({ ...cur, [r.id]: cur[r.id] ?? "" }));
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            buka
                              ? "bg-gray-900 text-white"
                              : r.notulensi
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                        >
                          <FileText size={10} />
                          {buka ? "Tutup" : r.notulensi ? "Ubah Notulensi" : "Input Notulensi"}
                        </button>
                      )}
                    </div>
                  </div>

                  {buka && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-red-500" />
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Input Notulensi / Resume Rapat</span>
                      </div>
                      <textarea
                        value={draft}
                        onChange={(e) => setNotulensiIsi((cur) => ({ ...cur, [r.id]: e.target.value }))}
                        rows={4}
                        placeholder="Tuliskan poin-poin keputusan, rekomendasi, dan tindak lanjut rapat ini..."
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-400">{draft.trim().length} karakter</span>
                        <button
                          onClick={() => setBukaNotulensi(null)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => simpanNotulensi(r)}
                          disabled={!draft.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <CheckCircle2 size={11} />
                          Simpan Notulensi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {modal && (
        <RapatModal
          mode={modal.mode}
          initial={modal.rapat}
          pegawaiList={pegawaiList}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setPesan("");
            muatRapat();
          }}
        />
      )}
    </div>
  );
}