import { useState } from "react";
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
  Pencil,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RapatStatus = "selesai" | "mendatang" | "belum-diisi";

interface PersonilTag {
  initials: string;
  color: string;
}

interface AgendaItem {
  id: string;
  rapat_id: string;
  tanggal: string;
  waktu: string;
  terlambat?: number;
  title: string;
  status: RapatStatus;
  personil: PersonilTag[];
  personilLabel: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const agendaList: AgendaItem[] = [
  {
    id: "1",
    rapat_id: "RAPAT-ID-18",
    tanggal: "26 April 2026",
    waktu: "09:00 WIB",
    title: "Rakor Pengendalian Inflasi Daerah M–IV Kemendagri",
    status: "selesai",
    personil: [
      { initials: "E",  color: "bg-teal-500"   },
      { initials: "SI", color: "bg-emerald-500" },
      { initials: "BS", color: "bg-blue-500"    },
    ],
    personilLabel: "3 Personil Ditugaskan",
  },
  {
    id: "2",
    rapat_id: "RAPAT-ID-19",
    tanggal: "03 Mei 2026",
    waktu: "10:00 WIB",
    title: "Evaluasi Pasokan Pangan Menjelang Hari Besar",
    status: "mendatang",
    personil: [
      { initials: "B",  color: "bg-amber-500"   },
      { initials: "S",  color: "bg-emerald-500" },
    ],
    personilLabel: "2 Personil Ditugaskan",
  },
  {
    id: "3",
    rapat_id: "RAPAT-ID-17",
    tanggal: "19 April 2026",
    waktu: "",
    terlambat: 7,
    title: "Rakor Teknis TPID & Bulog Ketersediaan Beras SPHP",
    status: "belum-diisi",
    personil: [],
    personilLabel: "Petugas: Drs. Eko Prasetyo (Belum Menyerahkan Resume)",
  },
];

const statusConfig: Record<RapatStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  "selesai":     { label: "Selesai",     cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 size={10} /> },
  "mendatang":   { label: "Mendatang",   cls: "bg-amber-50 text-amber-600 border border-amber-200",       icon: <Clock size={10} />        },
  "belum-diisi": { label: "Belum Diisi", cls: "bg-red-50 text-red-600 border border-red-200",             icon: <AlertCircle size={10} />  },
};

type FilterTab = "semua" | "mendatang" | "menunggu" | "selesai";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonitoringResume() {
  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftResume, setDraftResume] = useState("");

  function toggleRincian(id: string) {
    setExpandedId((cur) => (cur === id ? null : id));
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "semua",     label: "Semua Rapat",     count: 18 },
    { key: "mendatang", label: "Mendatang",        count: 3  },
    { key: "menunggu",  label: "Menunggu Resume",  count: 2  },
    { key: "selesai",   label: "Selesai",          count: 13 },
  ];

  const doneCount = agendaList.filter((a) => a.status === "selesai").length;
  const pendingCount = agendaList.filter((a) => a.status === "belum-diisi").length;

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
          dan distribusi hasil rapat. Notulis bertugas mengisi resume yang menunggu input.
        </p>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2 inline-block">
          Data contoh. Modul rapat belum terhubung ke database.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Agenda Terjadwal", value: agendaList.length, icon: <Calendar size={16} className="text-gray-400" />, cls: "" },
          { label: "Menunggu Resume Notulis", value: pendingCount, icon: <AlertCircle size={16} className="text-red-500" />, cls: "border-l-2 border-l-red-400" },
          { label: "Selesai", value: doneCount, icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
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
              onClick={() => setFilterTab(key)}
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
        <div className="space-y-3">
          {agendaList.map((item) => {
            const cfg = statusConfig[item.status];
            return (
              <div
                key={item.id}
                className={`border rounded-xl p-4 ${
                  item.status === "belum-diisi"
                    ? "border-red-100 bg-red-50/30"
                    : "border-gray-100 hover:border-gray-200"
                } transition-colors`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* ID + date + time */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded min-w-0 ${
                          item.status === "belum-diisi"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.rapat_id}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={9} />
                        {item.tanggal}
                      </div>
                      {item.waktu && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={9} />
                          {item.waktu}
                        </div>
                      )}
                      {item.terlambat && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <AlertTriangle size={9} />
                          Terlambat {item.terlambat} Hari
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="text-sm font-bold text-gray-900 mb-2">{item.title}</div>

                    {/* Personil */}
                    <div className="flex items-center gap-2">
                      {item.personil.length > 0 ? (
                        <>
                          <div className="flex -space-x-1">
                            {item.personil.map((p, i) => (
                              <div
                                key={i}
                                className={`w-6 h-6 rounded-full ${p.color} text-white text-[11px] font-bold flex items-center justify-center border-2 border-white`}
                              >
                                {p.initials}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{item.personilLabel}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Users size={11} />
                          {item.personilLabel}
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
                      {item.status !== "belum-diisi" && (
                        <>
                          <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                            <FileText size={9} />
                            Radiogram
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                            <FileText size={9} />
                            Materi
                          </button>
                        </>
                      )}

                      {item.status === "selesai" && (
                        <button
                          onClick={() => toggleRincian(item.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            expandedId === item.id
                              ? "bg-gray-900 text-white"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          <FileText size={9} />
                          {expandedId === item.id ? "Tutup Notulensi" : "Lihat Notulensi"}
                        </button>
                      )}
                      {item.status === "mendatang" && (
                        <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">
                          <Pencil size={9} />
                          Ubah Agenda
                        </button>
                      )}
                      {item.status === "belum-diisi" && (
                        <button
                          onClick={() => { toggleRincian(item.id); setDraftResume(""); }}
                          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            expandedId === item.id
                              ? "bg-gray-900 text-white"
                              : "bg-red-500 text-white hover:bg-red-600"
                          }`}
                        >
                          <FileText size={9} />
                          {expandedId === item.id ? "Tutup Form" : "Input Notulensi"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Flip card: notulensi / input resume */}
                {expandedId === item.id && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {item.status === "selesai" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-emerald-600" />
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                            Notulensi Risalah Rapat
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                            <div className="text-xs font-bold text-emerald-800 mb-1">Keputusan Pokok</div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Disepakati pelaksanaan gerakan pasar murah setiap Minggu II di 5 kelurahan;
                              koordinasi pasokan beras SPHP diperpanjang hingga akhir kuartal; pembentukan
                              tim pemantau harga pasar harian beranggotakan petugas BPS dan Disperindag.
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <div className="text-xs font-bold text-gray-700 mb-1">Rekomendasi &amp; Tindak Lanjut</div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Nota dinas ke Dinas Pertanian untuk percepatan panen komoditas cabai rawit;
                              laporan evaluasi diserahkan paling lambat 2 hari sebelum rakor berikutnya.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2">
                          <span className="text-xs text-gray-400">
                            Disusun: Siti Rahmawati, S.E. • Disahkan: Drs. Eko Prasetyo, M.Si. (Sekretaris TPID)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText size={12} className="text-red-500" />
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                            Input Notulensi / Resume Rapat
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">
                            Batas Penyerahan: H+1 pukul 12:00 WIB
                          </span>
                        </div>
                        <textarea
                          value={draftResume}
                          onChange={(e) => setDraftResume(e.target.value)}
                          rows={4}
                          placeholder="Tuliskan poin-poin keputusan, rekomendasi, dan tindak lanjut rapat ini..."
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
                        />
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-gray-400">{draftResume.trim().length} karakter</span>
                          <button
                            onClick={() => { setExpandedId(null); setDraftResume(""); }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Batal
                          </button>
                          <button
                            disabled={!draftResume.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 size={11} />
                            Simpan Resume &amp; Tandai Selesai
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
          <span className="text-xs sm:text-sm text-gray-400">Menampilkan 3 dari 18 agenda rapat</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100">
              <ChevronLeft size={12} />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center ${
                  currentPage === p ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}