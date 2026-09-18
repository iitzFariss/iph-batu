import { useState } from "react";
import {
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Presentation,
  Upload,
  Users,
  X,
  Search,
  Printer,
  RefreshCw,
  ChevronLeft,
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

export default function KelolaRapat() {
  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [currentPage, setCurrentPage] = useState(1);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "semua",     label: "Semua Rapat",     count: 18 },
    { key: "mendatang", label: "Mendatang",        count: 3  },
    { key: "menunggu",  label: "Menunggu Resume",  count: 2  },
    { key: "selesai",   label: "Selesai",          count: 13 },
  ];

  return (
    <div className="p-5 space-y-5 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
        <span className="hover:text-gray-600 cursor-pointer">Dashboard</span>
        <ChevronRight size={10} />
        <span className="hover:text-gray-600 cursor-pointer">Koordinasi &amp; Kegiatan</span>
        <ChevronRight size={10} />
        <span className="text-gray-700 font-medium">Kelola Rapat TPID</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Kelola Jadwal &amp; Agenda Rapat TPID
          </h1>
          <p className="text-xs text-gray-500">
            Penjadwalan rapat koordinasi pengendalian inflasi daerah, penugasan aparatur
            resume, dan distribusi radiogram.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
            <RefreshCw size={12} className="text-emerald-600" />
            Sinkron Google Calendar
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Printer size={12} />
            Cetak Jadwal Mingguan
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Rapat Terjadwal", value: "18", sub: "Siklus TA 2026",        icon: <Calendar size={18} className="text-gray-400" />, accent: "" },
          { label: "Menunggu Resume",       value: "2",  sub: "Perlu Tindakan Cepat",  icon: <AlertTriangle size={18} className="text-amber-500" />, accent: "border-l-2 border-l-amber-400" },
          { label: "Selesai Tervalidasi",   value: "16", sub: "88.8% Kepatuhan",       icon: <CheckCircle2 size={18} className="text-emerald-500" />, accent: "border-l-2 border-l-emerald-400" },
        ].map(({ label, value, sub, icon, accent }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${accent}`}>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">{label}</div>
              <div className="text-3xl font-black text-gray-900 leading-tight">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
            </div>
            <div>{icon}</div>
          </div>
        ))}
      </div>

      {/* Form: Jadwalkan Rapat Baru */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Jadwalkan Rapat Koordinasi Baru</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
            FORM-TPID-04
          </span>
        </div>

        <div className="space-y-4">
          {/* Topik */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Topik / Agenda Koordinasi{" "}
              <span className="text-red-500 font-normal">*Wajib</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Rakor Mingguan Pengendalian Pasokan Sembako"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Rapat</label>
              <input
                type="date"
                defaultValue="2026-10-05"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Waktu Pelaksanaan</label>
              <div className="relative">
                <input
                  type="time"
                  defaultValue="09:30"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">
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
                defaultValue="Ruang Rapat Utama Lt. 2 Balaikota Among Tani / Zoom ID 892 109"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Petugas Notulis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Petugas Notulis / Resume</label>
              <button className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-700">
                + Tambah Personil
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {["Drs. Eko Prasetyo", "Siti Rahmawati, S.E.", "Budi Santoso M.Si."].map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] text-emerald-800 font-medium">{name}</span>
                    <button className="ml-0.5 text-emerald-400 hover:text-emerald-700">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Pilih aparatur penugasan resume tambahan..."
                className="w-full text-xs text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Links */}
          {[
            { icon: <FileText size={12} />,        label: "Link Surat Radiogram / Undangan Resmi", placeholder: "https://tpid.batukota.go.id/arsip/radiogram-2026-05.pdf" },
            { icon: <Presentation size={12} />,    label: "Link Bahan Tayang / Materi Paparan",    placeholder: "https://drive.google.com/drive/folders/materi-rakor-inflasi" },
            { icon: <FileText size={12} />,        label: "Link / Upload Berkas Dokumentasi",      placeholder: "Tautan penyimpanan berkas dokumentasi foto/rekaman", hasUpload: true },
          ].map(({ icon, label, placeholder, hasUpload }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                </div>
                {hasUpload && (
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-shrink-0">
                    <Upload size={12} />
                    Upload
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Submit */}
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
            <Calendar size={15} />
            Buat Jadwal Rapat
          </button>
          <p className="text-center text-[10px] text-gray-400">
            Radiogram akan secara otomatis diteruskan ke WhatsApp Group TPID Kota Batu.
          </p>
        </div>
      </div>

      {/* Daftar Agenda */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Daftar Agenda Rapat Terjadwal</h2>
            <p className="text-[11px] text-gray-400">
              Monitoring jadwal berkala, notulensi resume, dan distribusi hasil rapat koordinasi.
            </p>
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter topik rapat..."
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-4">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* ID + date + time */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === "belum-diisi"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.rapat_id}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Calendar size={9} />
                        {item.tanggal}
                      </div>
                      {item.waktu && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock size={9} />
                          {item.waktu}
                        </div>
                      )}
                      {item.terlambat && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
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
                                className={`w-6 h-6 rounded-full ${p.color} text-white text-[9px] font-bold flex items-center justify-center border-2 border-white`}
                              >
                                {p.initials}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-500">{item.personilLabel}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Users size={11} />
                          {item.personilLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
                      {cfg.icon}
                      {cfg.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.status !== "belum-diisi" && (
                        <>
                          <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-50">
                            <FileText size={9} />
                            Radiogram
                          </button>
                          <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-50">
                            <FileText size={9} />
                            Materi
                          </button>
                        </>
                      )}

                      {item.status === "selesai" && (
                        <button className="flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-700">
                          <FileText size={9} />
                          Lihat Notulensi
                        </button>
                      )}
                      {item.status === "mendatang" && (
                        <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-50">
                          <Pencil size={9} />
                          Ubah Agenda
                        </button>
                      )}
                      {item.status === "belum-diisi" && (
                        <button className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-[10px] font-semibold hover:bg-red-600">
                          <FileText size={9} />
                          Input Notulensi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="text-[11px] text-gray-400">Menampilkan 3 dari 18 agenda rapat</span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:bg-gray-100">
              <ChevronLeft size={12} />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-[11px] font-semibold flex items-center justify-center ${
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

      {/* Status Pengiriman Radiogram */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Status Pengiriman Radiogram Terakhir</span>
          </div>
          <button className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-700">
            Lihat Log Transmisi
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              title: "Surat Undangan No. 005/142/TPID/2026",
              sub: "Terkirim ke 14 OPD Teknis & Forkopimda Kota Batu.",
              status: "DELIVERED (100%)",
              statusCls: "text-emerald-600",
              icon: <CheckCircle2 size={14} className="text-emerald-500" />,
            },
            {
              title: "Disposisi Bahan Paparan Komoditas",
              sub: "Menunggu konfirmasi penerimaan Dinas Koperasi & UMKM",
              status: "PENDING ACK (1 OPD)",
              statusCls: "text-amber-600",
              icon: <AlertCircle size={14} className="text-amber-500" />,
            },
          ].map(({ title, sub, status, statusCls, icon }) => (
            <div key={title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div>
                <div className="text-xs font-semibold text-gray-900 mb-0.5">{title}</div>
                <div className="text-[10px] text-gray-400 mb-1.5">{sub}</div>
                <div className={`text-[10px] font-bold ${statusCls}`}>Status: {status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}