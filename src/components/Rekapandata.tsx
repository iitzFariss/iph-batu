import { useEffect, useState } from "react";
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
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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
  fluktuasi: CommodityTag | null;
}

interface Periode {
  tahun: number;
  bulan: number;
  mingguIndeks: number;
  periode: string;
  nilaiIPH: number;
}

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

const BULAN_FE = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

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

  const setFluktuasi = (field: "name" | "change", val: string) =>
    setDraft((p) => {
      const change = p.fluktuasi?.change ?? 0;
      const name = p.fluktuasi?.name ?? "";
      if (field === "name") return { ...p, fluktuasi: { name: val, change } };
      const num = parseFloat(val.replace(",", "."));
      return { ...p, fluktuasi: { name, change: isNaN(num) ? change : num } };
    });

  const clearFluktuasi = () => setDraft((p) => ({ ...p, fluktuasi: null }));
  const addFluktuasi = () => setDraft((p) => ({ ...p, fluktuasi: { name: "", change: 0 } }));

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

          {/* Fluktuasi harga tertinggi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Fluktuasi Harga Tertinggi
              </label>
              {draft.fluktuasi ? (
                <button
                  type="button"
                  onClick={clearFluktuasi}
                  className="px-2 py-1 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                >
                  Hapus
                </button>
              ) : (
                <button
                  type="button"
                  onClick={addFluktuasi}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50"
                >
                  <Plus size={11} />
                  Tambah
                </button>
              )}
            </div>
            {draft.fluktuasi && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nama komoditas fluktuasi"
                  value={draft.fluktuasi.name}
                  onChange={(e) => setFluktuasi("name", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="%"
                  value={draft.fluktuasi.change}
                  onChange={(e) => setFluktuasi("change", e.target.value)}
                  className="w-24 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                />
              </div>
            )}
          </div>
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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filterTab, setFilterTab] = useState<FilterTab>("semua");
  const [openYear, setOpenYear] = useState(false);
  const [year, setYear] = useState<string | null>(null);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [openAdvanced, setOpenAdvanced] = useState(false);
  const [bulan, setBulan] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [rows, setRows] = useState<RekapRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<RekapRow | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      const params = new URLSearchParams({ tab: filterTab, page: String(currentPage), perPage: String(perPage) });
      if (search.trim()) params.set("q", search.trim());
      if (year) params.set("tahun", year);
      if (bulan !== null) params.set("bulan", String(bulan));
      try {
        const data = await api.get<{ rows: RekapRow[]; total: number; totalPages: number }>(`/rekap?${params.toString()}`);
        if (cancelled) return;
        setRows(data.rows);
        setTotal(data.total);
        setTotalPages(Math.max(1, data.totalPages));
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof ApiError ? e.message : "Gagal memuat data rekapan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [filterTab, currentPage, perPage, search, year, bulan, reloadKey]);

  // Daftar tahun dan IPH periode terakhir disimpulkan dari data yang benar-benar
  // ada, bukan dari daftar tahun atau angka yang ditulis manual.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ rows: Periode[] }>("/rekap/periods")
      .then(({ rows }) => { if (!cancelled) setPeriodeList(rows); })
      .catch(() => { if (!cancelled) setPeriodeList([]); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const tahunTersedia = [...new Set(periodeList.map((p) => p.tahun))].sort((a, b) => b - a);
  const tahunTerbaru = tahunTersedia[0];
  const periodeTerakhir = periodeList[0] ?? null;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "semua",      label: "Semua Periode" },
    { key: "deflasi",    label: "IPH Deflasi (< 0%)" },
    { key: "inflasi",    label: "IPH Inflasi (> 0%)" },
    { key: "intervensi", label: "Perlu Intervensi" },
  ];

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSaveEdit = async (updated: RekapRow) => {
    try {
      await api.patch(`/rekap/${updated.id}`, {
        periode: updated.periode,
        nilaiIPH: updated.nilaiIPH,
        deflasi: updated.deflasi.filter((t) => t.name.trim()),
        inflasi: updated.inflasi.filter((t) => t.name.trim()),
        fluktuasi:
          updated.fluktuasi && updated.fluktuasi.name.trim()
            ? { nama: updated.fluktuasi.name.trim(), nilai: updated.fluktuasi.change }
            : null,
      });
      setEditingRow(null);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Gagal menyimpan perubahan.");
    }
  };

  const handleDeleteRow = async (id: string) => {
    await api.delete(`/rekap/${id}`).catch(() => null);
    setSelectedRows((prev) => prev.filter((r) => r !== id));
    setReloadKey((k) => k + 1);
  };

  const handleExport = async () => {
    const token = localStorage.getItem("tpid_access_token") ?? "";
    const res = await fetch("/api/rekap/export", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setLoadError("Gagal mengekspor data.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rekap-iph.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pageStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const pageEnd = Math.min(currentPage * perPage, total);
  const pageNumbers: number[] = [];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages, start + 2);
  for (let p = start; p <= end; p += 1) pageNumbers.push(p);

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
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
        <div className="flex flex-wrap items-center gap-4 flex-shrink-0">
          {periodeTerakhir && (
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-0.5">IPH Periode Terakhir</div>
              <div className="flex items-center gap-1 justify-center">
                {periodeTerakhir.nilaiIPH < 0 ? (
                  <TrendingDown size={14} className="text-emerald-600" />
                ) : (
                  <TrendingUp size={14} className="text-rose-600" />
                )}
                <span
                  className={`text-xl font-black ${
                    periodeTerakhir.nilaiIPH < 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {periodeTerakhir.nilaiIPH > 0 ? "+" : ""}
                  {periodeTerakhir.nilaiIPH.toFixed(2)}%
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{periodeTerakhir.periode}</div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        {/* Row 1: search + export */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan komoditas, periode, atau petugas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-400"
            />
          </div>

          {/* Export */}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 flex-1 sm:flex-none justify-center">
              <FileDown size={13} className="text-red-500" />
              Export PDF Resmi
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex-1 sm:flex-none justify-center">
              <Sheet size={13} />
              Download CSV / Excel
            </button>
          </div>
        </div>

        {/* Row 2: year + advanced + category tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year filter */}
          <button
            onClick={() => { setOpenYear((v) => !v); setOpenAdvanced(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors ${
              openYear ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Tahun {year ?? "Semua"}{year && Number(year) === tahunTerbaru ? " · Terbaru" : ""}
            <ChevronDown size={12} className={`transition-transform ${openYear ? "rotate-180" : ""}`} />
          </button>

          {/* Advanced filter */}
          <button
            onClick={() => { setOpenAdvanced((v) => !v); setOpenYear(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              openAdvanced
                ? "bg-gray-900 text-white border-gray-900"
                : bulan !== null
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filter Lanjutan
            {bulan !== null && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">{BULAN_FE[bulan - 1]}</span>
            )}
          </button>

          {/* Filter tabs */}
          <div className="overflow-x-auto flex-1">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-sm text-gray-400 font-medium pl-1">Filter Kategori:</span>
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setFilterTab(key); setCurrentPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                    filterTab === key
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {key === "intervensi" && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {label}
            </button>
          ))}
          </div>
          </div>
        </div>

        {/* Panel filter (flip card) */}
        {openYear && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Pilih Tahun Data</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setYear(null); setCurrentPage(1); setOpenYear(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  year === null
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Semua Tahun
              </button>
              {tahunTersedia.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(String(y)); setCurrentPage(1); setOpenYear(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    year === String(y)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {y} {y === tahunTerbaru ? "· Terbaru" : ""}
                </button>
              ))}
              {tahunTersedia.length === 0 && (
                <p className="px-3 py-1.5 text-xs text-gray-400">Belum ada data IPH tersimpan.</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Menampilkan data per tahun pencatatan IPH; aktifkan sesuai periode yang ingin ditinjau.
            </p>
          </div>
        )}

        {openAdvanced && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Filter Bulan</div>
            <div className="flex flex-wrap gap-2">
              {BULAN_FE.map((nama, i) => {
                const num = i + 1;
                const active = bulan === num;
                return (
                  <button
                    key={nama}
                    onClick={() => { setBulan(active ? null : num); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {active ? "✓ " : ""}{nama}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => { setBulan(null); setCurrentPage(1); }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Reset Bulan
              </button>
              <button
                onClick={() => setOpenAdvanced(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gray-900 hover:bg-gray-800"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" readOnly />
              </th>
              {[
                "Periode & Rentang Data",
                "Nilai IPH Gabungan",
                "Komoditas Andil Penurunan (Deflasi)",
                "Komoditas Andil Kenaikan (Inflasi)",
                "Fluktuasi Harga Tertinggi",
                "",
              ].map((col, i) => (
                <th
                  key={i}
                  className={`text-left text-xs font-normal text-gray-500 uppercase tracking-wide px-3 py-3 ${
                    i === 5 ? "w-16 text-right" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  Memuat data rekapan…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  {loadError || "Belum ada data rekapan untuk filter ini."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
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
                    Rentang: {row.cutoffStart} – {row.cutoffEnd}
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

                {/* Fluktuasi harga tertinggi */}
                <td className="px-3 py-4">
                  {!row.fluktuasi ? (
                    <span className="text-sm text-gray-400 italic">Nihil</span>
                  ) : (
                    <CommodityChip
                      name={row.fluktuasi.name}
                      change={row.fluktuasi.change}
                      type={row.fluktuasi.change < 0 ? "deflasi" : "inflasi"}
                    />
                  )}
                </td>

                {/* Aksi */}
                <td className="px-3 py-4 text-right">
                  {isAdmin && (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingRow(row)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                      >
                        <Pencil size={11} />
                        Ubah
                      </button>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        title="Hapus rekap"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-500">
            Menampilkan <strong>{pageStart}–{pageEnd}</strong> dari <strong>{total}</strong> data rekapan
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Baris per halaman:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>
            {pageNumbers.map((p) => (
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
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>
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
