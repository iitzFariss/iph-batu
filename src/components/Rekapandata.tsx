import { useState } from "react";
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  FileDown,
  Sheet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type IPHStatus =
  | "deflasi-terkendali"
  | "inflasi-ringan"
  | "perlu-intervensi"
  | "stabil-terkendali"
  | "deflasi-signifikan";

type RilisStatus = "rilis-kemendagri" | "gtt-dispatched";

interface CommodityTag {
  name: string;
  change: number;
}

interface RekapRow {
  id: string;
  periode: string;
  cutoffStart: string;
  cutoffEnd: string;
  nilaiIPH: number;
  statusIPH: IPHStatus;
  deflasi: CommodityTag[];
  inflasi: CommodityTag[];
  verifikator: { initials: string; name: string; instansi: string };
  statusRilis: RilisStatus;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const rekapData: RekapRow[] = [
  {
    id: "1",
    periode: "Minggu III – April 2026",
    cutoffStart: "14 Apr",
    cutoffEnd: "20 Apr 2026",
    nilaiIPH: -0.42,
    statusIPH: "deflasi-terkendali",
    deflasi: [
      { name: "Beras Medium", change: -0.25 },
      { name: "Daging Ayam",  change: -0.12 },
    ],
    inflasi: [{ name: "Cabai Rawit", change: 0.18 }],
    verifikator: { initials: "SR", name: "Siti Rahmawati, S.E.", instansi: "BPS Kota Batu" },
    statusRilis: "rilis-kemendagri",
  },
  {
    id: "2",
    periode: "Minggu II – April 2026",
    cutoffStart: "07 Apr",
    cutoffEnd: "13 Apr 2026",
    nilaiIPH: 0.15,
    statusIPH: "inflasi-ringan",
    deflasi: [{ name: "Minyak Goreng", change: -0.08 }],
    inflasi: [
      { name: "Bawang Merah", change: 0.14 },
      { name: "Telur Ayam",   change: 0.09 },
    ],
    verifikator: { initials: "BW", name: "Bambang Wijaya", instansi: "Diskumperindag" },
    statusRilis: "rilis-kemendagri",
  },
  {
    id: "3",
    periode: "Minggu I – April 2026",
    cutoffStart: "31 Mar",
    cutoffEnd: "06 Apr 2026",
    nilaiIPH: 0.88,
    statusIPH: "perlu-intervensi",
    deflasi: [],
    inflasi: [
      { name: "Cabai Rawit", change: 0.54 },
      { name: "Daging Sapi", change: 0.22 },
    ],
    verifikator: { initials: "SR", name: "Siti Rahmawati, S.E.", instansi: "BPS Kota Batu" },
    statusRilis: "gtt-dispatched",
  },
  {
    id: "4",
    periode: "Minggu IV – Maret 2026",
    cutoffStart: "24 Mar",
    cutoffEnd: "30 Mar 2026",
    nilaiIPH: -0.11,
    statusIPH: "stabil-terkendali",
    deflasi: [
      { name: "Beras Premium", change: -0.10 },
      { name: "Gula Pasir",    change: -0.05 },
    ],
    inflasi: [{ name: "Bawang Putih", change: 0.04 }],
    verifikator: { initials: "AN", name: "Achmad Nur, S.T.", instansi: "Bagian Perekonomian" },
    statusRilis: "rilis-kemendagri",
  },
  {
    id: "5",
    periode: "Minggu III – Maret 2026",
    cutoffStart: "17 Mar",
    cutoffEnd: "23 Mar 2026",
    nilaiIPH: -0.65,
    statusIPH: "deflasi-signifikan",
    deflasi: [
      { name: "Cabai Merah",   change: -0.38 },
      { name: "Beras Medium",  change: -0.24 },
    ],
    inflasi: [],
    verifikator: { initials: "SR", name: "Siti Rahmawati, S.E.", instansi: "BPS Kota Batu" },
    statusRilis: "rilis-kemendagri",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface IPHConfig {
  label: string;
  bg: string;
  text: string;
  icon: React.ReactNode;
}

const iphConfigMap: Record<IPHStatus, IPHConfig> = {
  "deflasi-terkendali":  { label: "Deflasi Terkendali",  bg: "bg-emerald-50", text: "text-emerald-700", icon: <TrendingDown size={12} /> },
  "inflasi-ringan":      { label: "Inflasi Ringan",       bg: "bg-amber-50",   text: "text-amber-700",   icon: <TrendingUp size={12} />   },
  "perlu-intervensi":    { label: "Perlu Intervensi",     bg: "bg-red-50",     text: "text-red-600",     icon: <AlertTriangle size={12} />},
  "stabil-terkendali":   { label: "Stabil Terkendali",    bg: "bg-teal-50",    text: "text-teal-700",    icon: <TrendingDown size={12} /> },
  "deflasi-signifikan":  { label: "Deflasi Signifikan",   bg: "bg-blue-50",    text: "text-blue-700",    icon: <TrendingDown size={12} /> },
};

function IPHBadge({ value, status }: { value: number; status: IPHStatus }) {
  const cfg = iphConfigMap[status];
  const sign = value > 0 ? "+" : "";
  return (
    <div className={`inline-flex flex-col items-center px-3 py-1.5 rounded-lg ${cfg.bg}`}>
      <div className={`flex items-center gap-1 text-sm font-black ${cfg.text}`}>
        {cfg.icon}
        {sign}{value.toFixed(2)}%
      </div>
      <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function CommodityChip({ name, change, type }: { name: string; change: number; type: "deflasi" | "inflasi" }) {
  const isDeflasi = type === "deflasi";
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
      isDeflasi ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-700"
    }`}>
      <span>{name}</span>
      <span className={`font-bold ${isDeflasi ? "text-blue-600" : "text-red-600"}`}>
        {change > 0 ? "+" : ""}{change.toFixed(2)}%
      </span>
    </div>
  );
}

function RilisBadge({ status }: { status: RilisStatus }) {
  if (status === "gtt-dispatched") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs font-bold text-red-600">GTT Dispatched</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-xs font-semibold text-gray-600">Rilis Kemendagri</span>
    </div>
  );
}

type FilterTab = "semua" | "deflasi" | "inflasi" | "intervensi";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RekapanData() {
  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "semua",      label: "Semua Periode",      count: 52 },
    { key: "deflasi",    label: "IPH Deflasi (< 0%)"             },
    { key: "inflasi",    label: "IPH Inflasi (> 0%)"             },
    { key: "intervensi", label: "Perlu Intervensi",   count: 2   },
  ];

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="hover:text-gray-600 cursor-pointer">TPID Terpadu</span>
        <ChevronRight size={10} />
        <span className="hover:text-gray-600 cursor-pointer">Basis Data Inflasi</span>
        <ChevronRight size={10} />
        <span className="text-gray-700 font-medium">Rekapan Data IPH</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Rekapan Data Indeks Perkembangan Harga (IPH)
          </h1>
          <p className="text-xs text-gray-500">
            Arsip digital pencatatan mingguan fluktuasi harga komoditas pangan pokok Kota Batu
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-0.5">Posisi Terkini M–IV</div>
            <div className="flex items-center gap-1 justify-center">
              <TrendingDown size={14} className="text-emerald-600" />
              <span className="text-xl font-black text-emerald-600">-0.38%</span>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-0.5">Status IPH Wilayah</div>
            <div className="flex items-center gap-1 justify-center">
              <TrendingDown size={12} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-600">Terkendali</span>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-100" />
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-0.5">Entri Tersinkron</div>
            <div className="text-sm font-bold text-gray-900">52 Minggu</div>
            <div className="text-xs text-gray-400">(100%)</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan komoditas, periode, atau petugas..."
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-400"
            />
          </div>

          {/* Year filter */}
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Tahun 2026 (Aktif)
            <ChevronDown size={12} />
          </button>

          {/* Advanced filter */}
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <SlidersHorizontal size={12} />
            Filter Lanjutan
          </button>

          <div className="flex-1" />

          {/* Export */}
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
            <FileDown size={13} className="text-red-500" />
            Export PDF Resmi
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <Sheet size={13} />
            Download CSV / Excel
          </button>
        </div>

        {/* Filter tabs */}
        <div className="overflow-x-auto">
        <div className="flex flex-wrap items-center gap-2 min-w-[620px]">
          <span className="text-sm text-gray-400 font-medium">Filter Kategori:</span>
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterTab === key
                  ? "bg-gray-900 text-white"
                  : key === "intervensi"
                  ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {key === "intervensi" && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {label}
              {count !== undefined && (
                <span className={`ml-0.5 ${filterTab === key ? "opacity-70" : "text-gray-400"}`}>
                  ({count})
                </span>
              )}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" readOnly />
              </th>
              {[
                "Periode & Cutoff Data",
                "Nilai IPH Gabungan",
                "Komoditas Andil Penurunan (Deflasi)",
                "Komoditas Andil Kenaikan (Inflasi)",
                "Petugas Verifikator",
                "Status Rilis",
              ].map((col) => (
                <th
                  key={col}
                  className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-3 py-3"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rekapData.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50/50 transition-colors ${
                  selectedRows.includes(row.id) ? "bg-emerald-50/30" : ""
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedRows.includes(row.id)}
                    onChange={() => toggleRow(row.id)}
                  />
                </td>

                {/* Periode */}
                <td className="px-3 py-4">
                  <div className="text-sm font-bold text-gray-900 mb-0.5">{row.periode}</div>
                  <div className="text-xs text-gray-400">
                    Cutoff: {row.cutoffStart} – {row.cutoffEnd}
                  </div>
                </td>

                {/* Nilai IPH */}
                <td className="px-3 py-4">
                  <IPHBadge value={row.nilaiIPH} status={row.statusIPH} />
                </td>

                {/* Deflasi */}
                <td className="px-3 py-4">
                  {row.deflasi.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">Nihil komoditas dominan</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {row.deflasi.map((c) => (
                        <CommodityChip key={c.name} name={c.name} change={c.change} type="deflasi" />
                      ))}
                    </div>
                  )}
                </td>

                {/* Inflasi */}
                <td className="px-3 py-4">
                  {row.inflasi.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">Tidak ada komoditas naik</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {row.inflasi.map((c) => (
                        <CommodityChip key={c.name} name={c.name} change={c.change} type="inflasi" />
                      ))}
                    </div>
                  )}
                </td>

                {/* Verifikator */}
                <td className="px-3 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {row.verifikator.initials}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{row.verifikator.name}</div>
                      <div className="text-xs text-gray-400">{row.verifikator.instansi}</div>
                    </div>
                  </div>
                </td>

                {/* Status Rilis */}
                <td className="px-3 py-4">
                  <RilisBadge status={row.statusRilis} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-500">
            Menampilkan <strong>1–5</strong> dari <strong>52</strong> data rekapan
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Baris per halaman:</span>
            <select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={13} />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentPage === p
                    ? "bg-emerald-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <span className="text-gray-400 text-sm px-1">…</span>
            <button className="w-7 h-7 rounded text-sm font-semibold text-gray-500 hover:bg-gray-100 flex items-center justify-center">
              6
            </button>
            <button className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100">
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Koreksi section */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 mb-0.5">
              Koreksi &amp; Hapus Rekapan Data Periode Tertentu
            </div>
            <p className="text-xs text-gray-500 max-w-lg">
              Setiap modifikasi data IPH yang telah terbit memerlukan otentikasi PIN Berjangka
              Pengawas TPID dan akan dicatat secara permanen di lembar log audit Kemendagri RI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-400 tracking-[0.3em]">• • • • •</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800">
            <Lock size={12} />
            Buka Akses Koreksi
          </button>
        </div>
      </div>
    </div>
  );
}