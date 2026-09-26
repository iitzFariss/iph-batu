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
  Pencil,
  Plus,
  X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type IPHStatus =
  | "deflasi-terkendali"
  | "inflasi-ringan"
  | "perlu-intervensi"
  | "stabil-terkendali"
  | "deflasi-signifikan";

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
    <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${cfg.bg}`}>
      <div className={`flex items-center gap-1 text-sm font-black ${cfg.text}`}>
        {cfg.icon}
        {sign}{value.toFixed(2)}%
      </div>
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

type FilterTab = "semua" | "deflasi" | "inflasi" | "intervensi";

// ─── Modal Edit ───────────────────────────────────────────────────────────────

function EditRekapModal({ row, onSave, onClose }: {
  row: RekapRow;
  onSave: (updated: RekapRow) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<RekapRow>(row);
  const [error, setError] = useState("");

  const setPeriode = (val: string) => setDraft((p) => ({ ...p, periode: val }));
  const setCutoffStart = (val: string) => setDraft((p) => ({ ...p, cutoffStart: val }));
  const setCutoffEnd = (val: string) => setDraft((p) => ({ ...p, cutoffEnd: val }));
  const setNilaiIPH = (val: string) => {
    const n = val.replace(",", ".");
    const num = parseFloat(n);
    setDraft((p) => ({
      ...p,
      nilaiIPH: isNaN(num) ? p.nilaiIPH : num,
      statusIPH: num < 0 ? "deflasi-terkendali" : num >= 1 ? "perlu-intervensi" : "inflasi-ringan",
    }));
  };

  const setTag = (
    group: "deflasi" | "inflasi",
    idx: number,
    field: keyof CommodityTag,
    val: string
  ) => {
    setDraft((p) => ({
      ...p,
      [group]: p[group].map((t, i) => {
        if (i !== idx) return t;
        if (field === "name") return { ...t, name: val };
        const num = parseFloat(val.replace(",", "."));
        return { ...t, change: isNaN(num) ? t.change : num };
      }),
    }));
  };

  const addTag = (group: "deflasi" | "inflasi") =>
    setDraft((p) => ({ ...p, [group]: [...p[group], { name: "", change: 0 }] }));

  const removeTag = (group: "deflasi" | "inflasi", idx: number) =>
    setDraft((p) => ({ ...p, [group]: p[group].filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!draft.periode.trim()) {
      setError("Periode tidak boleh kosong");
      return;
    }
    onSave(draft);
  };

  const numCls = "w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Edit Rekapan Periode</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Perbaiki data rekap yang telah dimasukkan sebelumnya
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              <AlertTriangle size={12} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Periode</label>
              <input
                type="text"
                value={draft.periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cutoff Awal</label>
              <input
                type="text"
                value={draft.cutoffStart}
                onChange={(e) => setCutoffStart(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Cutoff Akhir</label>
              <input
                type="text"
                value={draft.cutoffEnd}
                onChange={(e) => setCutoffEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                Nilai IPH Gabungan (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={draft.nilaiIPH}
                onChange={(e) => setNilaiIPH(e.target.value)}
                className={numCls}
              />
            </div>
          </div>

          {(["deflasi", "inflasi"] as const).map((group) => (
            <div key={group} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {group === "deflasi" ? "Andil Penurunan (Deflasi)" : "Andil Kenaikan (Inflasi)"}
                </label>
                <button
                  type="button"
                  onClick={() => addTag(group)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                >
                  <Plus size={11} />
                  Tambah
                </button>
              </div>
              <div className="space-y-2">
                {draft[group].map((tag, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama komoditas"
                      value={tag.name}
                      onChange={(e) => setTag(group, idx, "name", e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="%"
                        value={tag.change}
                        onChange={(e) => setTag(group, idx, "change", e.target.value)}
                        className="w-24 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => removeTag(group, idx)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RekapanData() {
  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<RekapRow[]>(rekapData);
  const [editingRow, setEditingRow] = useState<RekapRow | null>(null);

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

  const handleSaveEdit = (updated: RekapRow) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRow(null);
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
                "",
              ].map((col, i) => (
                <th
                  key={i}
                  className={`text-left text-xs font-normal text-gray-500 uppercase tracking-wide px-3 py-3 ${
                    i === 4 ? "w-16 text-right" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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

                {/* Aksi */}
                <td className="px-3 py-4 text-right">
                  <button
                    onClick={() => setEditingRow(row)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    <Pencil size={11} />
                    Ubah
                  </button>
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

      {editingRow && (
        <EditRekapModal
          row={editingRow}
          onSave={handleSaveEdit}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}
