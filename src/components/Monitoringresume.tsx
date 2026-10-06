import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  MessageCircle,
  RefreshCw,
  Users,
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatHari(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusNotulensi(r: Rapat, kini: number): { label: string; cls: string; overdue: boolean } {
  const sudahLewat = new Date(r.tanggal).getTime() < kini;
  if (r.notulensi) return { label: "Notulensi Diisi", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", overdue: false };
  if (r.status === "dibatalkan") return { label: "Dibatalkan", cls: "bg-gray-100 text-gray-500 border border-gray-200", overdue: false };
  if (sudahLewat) return { label: "Belum Diisi", cls: "bg-red-50 text-red-600 border border-red-200", overdue: true };
  return { label: "Menunggu Rapat", cls: "bg-amber-50 text-amber-700 border border-amber-200", overdue: false };
}

// ─── Main Component ───────────────────────────────────────────────────────────

type FilterTab = "semua" | "mendatang" | "rawat" | "diisi";

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
        setReminderList(rows.filter((r) => r.tipe === "notulensi"));
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

  const denganStatus = rapatList.map((r) => ({ rapat: r, status: statusNotulensi(r, kini) }));
  const tersaring =
    filterTab === "semua"
      ? denganStatus
      : filterTab === "mendatang"
      ? denganStatus.filter((x) => x.rapat.status === "terjadwal" && new Date(x.rapat.tanggal).getTime() >= kini)
      : filterTab === "rawat"
      ? denganStatus.filter((x) => x.status.overdue)
      : denganStatus.filter((x) => !x.status.overdue && (x.rapat.notulensi || x.rapat.status === "dibatalkan"));

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "semua", label: "Semua Rapat", count: rapatList.length },
    { key: "mendatang", label: "Mendatang", count: denganStatus.filter((x) => x.rapat.status === "terjadwal" && new Date(x.rapat.tanggal).getTime() >= kini).length },
    { key: "rawat", label: "Menunggu Notulensi", count: denganStatus.filter((x) => x.status.overdue).length },
    { key: "diisi", label: "Selesai", count: denganStatus.filter((x) => x.rapat.notulensi || x.rapat.status === "dibatalkan").length },
  ];

  const pendingCount = denganStatus.filter((x) => x.status.overdue).length;
  const doneCount = rapatList.filter((r) => r.notulensi).length;

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-gray-400">
        <span>Dashboard</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span>Koordinasi &amp; Kegiatan</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span className="text-gray-700 font-medium">Monitoring Resume &amp; Risalah Rapat TPID</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">Monitoring Resume &amp; Risalah Rapat TPID</h1>
        <p className="text-xs text-gray-500">
          Monitoring jadwal rapat koordinasi pengendalian inflasi dan kepatuhan notulensi resume. Notulis rapat mengisi
          resume yang menunggu input.
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
          { label: "Total Agenda Terjadwal", value: rapatList.filter((r) => r.status !== "dibatalkan").length, icon: <Calendar size={16} className="text-gray-400" />, cls: "" },
          { label: "Menunggu Notulensi", value: pendingCount, icon: <AlertTriangle size={16} className="text-red-500" />, cls: "border-l-2 border-l-red-400" },
          { label: "Notulensi Diisi", value: doneCount, icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
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

      {/* Strip pengingat notulensi untuk admin */}
      {isAdmin && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-2">
          <div className="flex items-start gap-2">
            <MessageCircle size={15} className="text-emerald-600 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">Pengingat WhatsApp — Notulensi Belum Diisi</h2>
              <p className="text-xs text-gray-400">
                Pengingat dikirim manual lewat tombol Buka WhatsApp. Nomor diambil dari Profil Saya masing-masing petugas.
              </p>
            </div>
          </div>
          {statusReminder === "memuat" && (
            <div className="py-4 flex items-center justify-center text-xs text-gray-400">Memuat pengingat…</div>
          )}
          {statusReminder === "gagal" && (
            <div className="py-4 text-center text-xs text-amber-700">Gagal memuat pengingat.</div>
          )}
          {statusReminder === "siap" && reminderList.length === 0 && (
            <div className="py-4 text-center text-xs text-gray-400">Tidak ada notulensi yang menunggak.</div>
          )}
          {statusReminder === "siap" &&
            reminderList.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 py-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{item.topik}</div>
                  <div className="text-xs text-gray-400">
                    {formatHari(item.tanggal)} · {item.jatuhTempo} · Notulis: {item.untuk}
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
      )}

      {/* Daftar agenda */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Daftar Agenda Rapat Terjadwal</h2>
          <p className="text-xs text-gray-400 mb-3">Monitoring jadwal berkala dan kepatuhan notulensi rapat koordinasi.</p>
        </div>

        <div className="overflow-x-auto -mx-5 px-5">
          <div className="flex items-center gap-1.5 mb-4 w-max">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterTab(key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filterTab === key
                    ? "bg-gray-900 text-white"
                    : key === "rawat"
                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                    : "text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {statusData === "memuat" && (
          <div className="py-10 flex items-center justify-center text-xs text-gray-400">Memuat agenda rapat…</div>
        )}
        {statusData === "gagal" && (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-amber-700">Gagal memuat data rapat.</p>
            <button onClick={() => { setStatusData("memuat"); setPercobaan((n) => n + 1); }} className="flex items-center gap-1 mx-auto text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              <RefreshCw size={11} />
              Coba lagi
            </button>
          </div>
        )}
        {statusData === "siap" && tersaring.length === 0 && (
          <div className="py-10 text-center text-xs text-gray-400">Tidak ada agenda pada filter ini.</div>
        )}

        <div className="space-y-3">
          {tersaring.map(({ rapat: r, status }) => (
            <div
              key={r.id}
              className={`border rounded-xl p-4 ${
                status.overdue ? "border-red-100 bg-red-50/30" : "border-gray-100 hover:border-gray-200"
              } transition-colors`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                      {status.overdue ? <AlertTriangle size={9} /> : r.notulensi ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={9} />
                      {formatHari(r.tanggal)}
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

                  {r.notulensi && (
                    <div className="mt-3 text-xs text-gray-400">
                      Notulensi diisi {r.notulensi.by} pada{" "}
                      {new Date(r.notulensi.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-1.5 flex-shrink-0">
                  {r.dapatNotulensi && (
                    <button
                      onClick={() => {
                        setExpandedId((cur) => (cur === r.id ? null : r.id));
                        setDraft("");
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                        expandedId === r.id
                          ? "bg-gray-900 text-white"
                          : r.notulensi
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : status.overdue
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      <FileText size={9} />
                      {expandedId === r.id ? "Tutup" : r.notulensi ? "Ubah Notulensi" : "Input Notulensi"}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === r.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-red-500" />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Input Notulensi / Resume Rapat</span>
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
                      onClick={() => setExpandedId(null)}
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
          ))}
        </div>
      </div>
    </div>
  );
}