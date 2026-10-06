import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Users,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  isi: string;
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

type RapatStatus = "selesai" | "mendatang" | "belum-diisi" | "dibatalkan";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const HARI = 86_400_000;

function selisihHari(iso: string, kini: number) {
  const d = new Date(iso);
  const mulai = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const n = new Date(kini);
  const hariIni = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  return Math.round((mulai - hariIni) / HARI);
}

function statusRapat(r: Rapat, kini: number): RapatStatus {
  if (r.status === "dibatalkan") return "dibatalkan";
  if (r.notulensi) return "selesai";
  if (selisihHari(r.tanggal, kini) < 0) return "belum-diisi";
  return "mendatang";
}

const statusConfig: Record<RapatStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  selesai: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 size={10} /> },
  mendatang: { label: "Mendatang", cls: "bg-amber-50 text-amber-600 border border-amber-200", icon: <Clock size={10} /> },
  "belum-diisi": { label: "Belum Diisi", cls: "bg-red-50 text-red-600 border border-red-200", icon: <AlertCircle size={10} /> },
  dibatalkan: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-500 border border-gray-200", icon: <AlertCircle size={10} /> },
};

const WARNA = ["bg-teal-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500", "bg-rose-500", "bg-gray-700"];

function warnaNama(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return WARNA[sum % WARNA.length];
}

function inisial(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type FilterTab = "semua" | "mendatang" | "menunggu" | "selesai";

const PER_HAL = 5;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonitoringResume() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rapatList, setRapatList] = useState<Rapat[]>([]);
  const [reminderList, setReminderList] = useState<ReminderItem[]>([]);
  const [statusData, setStatusData] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [statusReminder, setStatusReminder] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [percobaan, setPercobaan] = useState(0);
  const [kini, setKini] = useState(0);

  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [cari, setCari] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pesan, setPesan] = useState("");

  const muat = useCallback(() => {
    api
      .get<{ rows: Rapat[] }>("/rapat")
      .then(({ rows }) => {
        setRapatList(rows);
        setKini(Date.now());
        setStatusData("siap");
      })
      .catch(() => {
        setRapatList([]);
        setStatusData("gagal");
      });
  }, []);

  useEffect(() => {
    muat();
  }, [muat, percobaan]);

  useEffect(() => {
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
  }, [isAdmin, percobaan]);

  async function simpanNotulensi(r: Rapat) {
    const isi = draft.trim();
    if (!isi) return;
    setPesan("");
    try {
      const res = await api.post<{ rapat: Rapat }>(`/rapat/${r.id}/notulensi`, { isi });
      setRapatList((cur) => cur.map((x) => (x.id === r.id ? res.rapat : x)));
      setExpandedId(null);
      setDraft("");
    } catch (e) {
      setPesan(e instanceof ApiError ? e.message : "Gagal menyimpan notulensi.");
    }
  }

  function pilihFilter(tab: FilterTab) {
    setFilterTab(tab);
    setHalaman(1);
  }

  const denganStatus = rapatList.map((r) => ({ rapat: r, st: statusRapat(r, kini) }));

  const tersaring = denganStatus.filter(({ rapat, st }) => {
    const cocokTab =
      filterTab === "semua"
        ? true
        : filterTab === "mendatang"
        ? st === "mendatang"
        : filterTab === "menunggu"
        ? st === "belum-diisi"
        : st === "selesai";
    const cocokCari = rapat.topik.toLowerCase().includes(cari.trim().toLowerCase());
    return cocokTab && cocokCari;
  });

  const totalPages = Math.max(1, Math.ceil(tersaring.length / PER_HAL));
  const halAman = Math.min(halaman, totalPages);
  const tampil = tersaring.slice((halAman - 1) * PER_HAL, halAman * PER_HAL);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "semua", label: "Semua Rapat", count: denganStatus.length },
    { key: "mendatang", label: "Mendatang", count: denganStatus.filter((x) => x.st === "mendatang").length },
    { key: "menunggu", label: "Menunggu Resume", count: denganStatus.filter((x) => x.st === "belum-diisi").length },
    { key: "selesai", label: "Selesai", count: denganStatus.filter((x) => x.st === "selesai").length },
  ];

  const doneCount = denganStatus.filter((x) => x.st === "selesai").length;
  const pendingCount = denganStatus.filter((x) => x.st === "belum-diisi").length;

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={14} className="text-emerald-600" />
        <span className="text-sm text-gray-500 font-medium">
          Pusat Tata Kelola Notulensi &amp; Dokumentasi Koordinasi
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          Monitoring Resume &amp; Risalah Rapat TPID
        </h1>
        <p className="text-xs text-gray-500">
          Monitoring jadwal rapat koordinasi pengendalian inflasi, kepatuhan notulensi resume,
          dan pengingat WhatsApp untuk petugas. Notulis bertugas mengisi resume yang menunggu input.
        </p>
      </div>

      {pesan && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          {pesan}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Agenda Terjadwal", value: statusData === "memuat" ? "—" : rapatList.filter((r) => r.status !== "dibatalkan").length, icon: <Calendar size={16} className="text-gray-400" />, cls: "" },
          { label: "Menunggu Resume Notulis", value: statusData === "memuat" ? "—" : pendingCount, icon: <AlertCircle size={16} className="text-red-500" />, cls: "border-l-2 border-l-red-400" },
          { label: "Selesai", value: statusData === "memuat" ? "—" : doneCount, icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
        ].map(({ label, value, icon, cls }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${cls}`}>
            <div>
              <div className="text-sm text-gray-400 mb-0.5">{label}</div>
              <div className="text-3xl font-black text-gray-900">{value}</div>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Pengingat WhatsApp (admin) */}
      {isAdmin && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-gray-900">Pengingat WhatsApp Jatuh Tempo</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Pengingat rapat H-1/H-0 dan notulensi terlambat. Kirim manual lewat tombol Buka
                WhatsApp — nomor diambil dari Profil Saya masing-masing petugas.
              </p>
            </div>
            <button
              onClick={() => {
                setStatusReminder("memuat");
                setPercobaan((n) => n + 1);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-shrink-0"
            >
              <RefreshCw size={12} />
              Muat Ulang
            </button>
          </div>

          {statusReminder === "memuat" && (
            <div className="py-5 text-center text-xs text-gray-400">Memuat pengingat…</div>
          )}
          {statusReminder === "gagal" && (
            <div className="py-5 text-center text-xs text-amber-700">
              Gagal memuat pengingat. Tekan Muat Ulang untuk mencoba lagi.
            </div>
          )}
          {statusReminder === "siap" && reminderList.length === 0 && (
            <div className="py-5 text-center text-xs text-gray-400">
              Tidak ada pengingat yang jatuh tempo.
            </div>
          )}

          <div className="space-y-2">
            {statusReminder === "siap" &&
              reminderList.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.tipe === "rapat"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                        }`}
                      >
                        {item.tipe === "rapat" ? <Clock size={9} /> : <FileText size={9} />}
                        {item.tipe === "rapat" ? "Rapat" : "Notulensi"}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">{item.jatuhTempo}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 truncate">{item.topik}</div>
                    <div className="text-xs text-gray-400">
                      Kepada: {item.untuk}
                      {item.phone ? ` · ${item.phone}` : " · tanpa nomor (pilih kontak)"}
                    </div>
                  </div>
                  <a
                    href={item.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex-shrink-0"
                  >
                    <MessageCircle size={11} />
                    Buka WhatsApp
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Daftar Agenda */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Daftar Agenda Rapat Terjadwal</h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Monitoring jadwal berkala, notulensi resume, dan distribusi hasil rapat koordinasi.
            </p>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={cari}
              onChange={(e) => {
                setCari(e.target.value);
                setHalaman(1);
              }}
              placeholder="Filter topik rapat..."
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full sm:w-44"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto -mx-5 px-5">
          <div className="flex items-center gap-1.5 mb-4 w-max">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => pilihFilter(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filterTab === key
                    ? "bg-gray-900 text-white"
                    : key === "menunggu"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    : "text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Agenda cards */}
        {statusData === "memuat" && (
          <div className="py-10 text-center text-xs text-gray-400">Memuat agenda rapat…</div>
        )}
        {statusData === "gagal" && (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-amber-700">Gagal memuat data rapat.</p>
            <button
              onClick={() => {
                setStatusData("memuat");
                setPercobaan((n) => n + 1);
              }}
              className="flex items-center gap-1 mx-auto text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <RefreshCw size={11} />
              Coba lagi
            </button>
          </div>
        )}
        {statusData === "siap" && tampil.length === 0 && (
          <div className="py-10 text-center text-xs text-gray-400">
            {cari.trim() || filterTab !== "semua"
              ? "Tidak ada agenda pada filter ini. Ubah kata kunci atau pilih tab Semua."
              : "Belum ada agenda rapat terjadwal. Jadwal muncul setelah admin membuat rapat di menu Kelola Rapat."}
          </div>
        )}

        <div className="space-y-3">
          {tampil.map(({ rapat: r, st }) => {
            const cfg = statusConfig[st];
            const telat = st === "belum-diisi" ? -selisihHari(r.tanggal, kini) : 0;
            const buka = expandedId === r.id;
            return (
              <div
                key={r.id}
                className={`border rounded-xl p-4 ${
                  st === "belum-diisi" ? "border-red-100 bg-red-50/30" : "border-gray-100 hover:border-gray-200"
                } transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* ID + date + time */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded min-w-0 ${
                          st === "belum-diisi" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        RAPAT-{r.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={9} />
                        {formatTanggal(r.tanggal)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={9} />
                        {new Date(r.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </div>
                      {telat > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <AlertTriangle size={9} />
                          Terlambat {telat} Hari
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="text-sm font-bold text-gray-900 mb-2">{r.topik}</div>

                    {/* Personil */}
                    <div className="flex flex-wrap items-center gap-2">
                      {r.petugas.length > 0 ? (
                        <>
                          <div className="flex -space-x-1">
                            {r.petugas.map((p) => (
                              <div
                                key={p.id}
                                title={`${p.name} (${p.peran})`}
                                className={`w-6 h-6 rounded-full ${warnaNama(p.name)} text-white text-[11px] font-bold flex items-center justify-center border-2 border-white`}
                              >
                                {inisial(p.name)}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {r.petugas.length} Personil Ditugaskan
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Users size={11} />
                          Belum ada petugas terdaftar
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex flex-row sm:flex-col sm:items-end items-center justify-between gap-2 flex-shrink-0 w-full sm:w-auto">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {r.notulensi && !buka && (
                        <button
                          onClick={() => setExpandedId(r.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <FileText size={9} />
                          Lihat Notulensi
                        </button>
                      )}
                      {st === "belum-diisi" && r.dapatNotulensi && !buka && (
                        <button
                          onClick={() => {
                            setExpandedId(r.id);
                            setDraft("");
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                        >
                          <FileText size={9} />
                          Input Notulensi
                        </button>
                      )}
                      {st === "belum-diisi" && !r.dapatNotulensi && (
                        <span className="text-[11px] text-gray-400">Menunggu notulis</span>
                      )}
                      {r.dapatNotulensi && r.notulensi && buka && (
                        <button
                          onClick={() => {
                            setExpandedId(r.id);
                            setDraft(r.notulensi?.isi ?? "");
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-gray-900 text-white"
                        >
                          <FileText size={9} />
                          Ubah
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flip card: notulensi / input resume */}
                {buka && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {r.notulensi && draft === "" ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileText size={12} className="text-emerald-600" />
                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                              Notulensi Risalah Rapat
                            </span>
                          </div>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                          >
                            Tutup
                          </button>
                        </div>
                        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {r.notulensi.isi}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          Disusun oleh {r.notulensi.by} ·{" "}
                          {new Date(r.notulensi.submittedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-red-500" />
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                            {r.notulensi ? "Ubah Notulensi / Resume Rapat" : "Input Notulensi / Resume Rapat"}
                          </span>
                          <button
                            onClick={() => setExpandedId(null)}
                            className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-800"
                          >
                            Batal
                          </button>
                        </div>
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={4}
                          placeholder="Tuliskan poin-poin keputusan, rekomendasi, dan tindak lanjut rapat ini..."
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">{draft.trim().length} karakter</span>
                          <button
                            onClick={() => simpanNotulensi(r)}
                            disabled={!draft.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={11} />
                            Simpan Resume
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-50">
          <span className="text-xs sm:text-sm text-gray-400">
            Menampilkan {tampil.length} dari {tersaring.length} agenda rapat
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHalaman((p) => Math.max(1, p - 1))}
                disabled={halAman === 1}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setHalaman(p)}
                  className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center ${
                    halAman === p ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setHalaman((p) => Math.min(totalPages, p + 1))}
                disabled={halAman === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}