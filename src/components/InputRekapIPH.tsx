import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ── Types ────────────────────────────────────────────────────────────────────

type Kategori = "pangan-pokok" | "bumbu" | "protein" | "sayuran" | "lainnya";

type Komoditas = {
  id: string;
  nama: string;
  satuan: string;
  kategori: Kategori;
};

type RekapRow = {
  komoditasId: string;
  hargaMin: string;
  hargaMax: string;
  hargaRata: string;
  stok: string;
  pasar: string;
  keterangan: string;
};

type FormMeta = {
  tanggal: string;
  mingguKe: string;
  bulan: string;
  tahun: string;
  petugas: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_KOMODITAS: Komoditas[] = [
  { id: "beras-medium",   nama: "Beras Medium",          satuan: "kg",    kategori: "pangan-pokok" },
  { id: "beras-premium",  nama: "Beras Premium",          satuan: "kg",    kategori: "pangan-pokok" },
  { id: "jagung",         nama: "Jagung",                 satuan: "kg",    kategori: "pangan-pokok" },
  { id: "kedelai",        nama: "Kedelai",                satuan: "kg",    kategori: "pangan-pokok" },
  { id: "bawang-merah",   nama: "Bawang Merah",           satuan: "kg",    kategori: "bumbu" },
  { id: "bawang-putih",   nama: "Bawang Putih",           satuan: "kg",    kategori: "bumbu" },
  { id: "cabai-merah",    nama: "Cabai Merah Keriting",   satuan: "kg",    kategori: "bumbu" },
  { id: "cabai-rawit",    nama: "Cabai Rawit Merah",      satuan: "kg",    kategori: "bumbu" },
  { id: "daging-sapi",    nama: "Daging Sapi Murni",      satuan: "kg",    kategori: "protein" },
  { id: "daging-ayam",    nama: "Daging Ayam Ras",        satuan: "kg",    kategori: "protein" },
  { id: "telur-ayam",     nama: "Telur Ayam Ras",         satuan: "kg",    kategori: "protein" },
  { id: "ikan-tongkol",   nama: "Ikan Tongkol",           satuan: "kg",    kategori: "protein" },
  { id: "gula-pasir",     nama: "Gula Pasir",             satuan: "kg",    kategori: "lainnya" },
  { id: "minyak-goreng",  nama: "Minyak Goreng Kemasan",  satuan: "liter", kategori: "lainnya" },
  { id: "tepung-terigu",  nama: "Tepung Terigu",          satuan: "kg",    kategori: "lainnya" },
];

const PASAR_LIST = [
  "Pasar Besar Kota Batu",
  "Pasar Sayur Batu",
  "Pasar Songgoriti",
  "Pasar Oro-oro Ombo",
  "Pasar Punten",
];

const KATEGORI_TABS: { id: Kategori | "semua"; label: string }[] = [
  { id: "semua",        label: "Semua" },
  { id: "pangan-pokok", label: "Pangan Pokok" },
  { id: "bumbu",        label: "Bumbu & Rempah" },
  { id: "protein",      label: "Protein Hewani" },
  { id: "lainnya",      label: "Lainnya" },
];

const KATEGORI_BADGE: Record<Kategori, string> = {
  "pangan-pokok": "bg-blue-50 text-blue-600",
  bumbu:          "bg-orange-50 text-orange-600",
  protein:        "bg-red-50 text-red-600",
  sayuran:        "bg-green-50 text-green-600",
  lainnya:        "bg-gray-100 text-gray-500",
};

const KATEGORI_LABEL: Record<Kategori, string> = {
  "pangan-pokok": "Pangan Pokok",
  bumbu:          "Bumbu",
  protein:        "Protein",
  sayuran:        "Sayuran",
  lainnya:        "Lainnya",
};

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const now = new Date();

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyRow = (id: string): RekapRow => ({
  komoditasId: id,
  hargaMin: "", hargaMax: "", hargaRata: "",
  stok: "", pasar: "", keterangan: "",
});

const toRupiah = (val: string) => {
  const n = parseInt(val.replace(/\D/g, ""), 10);
  return isNaN(n) ? "" : n.toLocaleString("id-ID");
};

const fromRupiah = (val: string) => val.replace(/\D/g, "");

// ── Component ─────────────────────────────────────────────────────────────────

export default function InputRekapIPH() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [komoditas, setKomoditas] = useState<Komoditas[]>(DEFAULT_KOMODITAS);

  const [meta, setMeta] = useState<FormMeta>({
    tanggal:  now.toISOString().split("T")[0],
    mingguKe: "1",
    bulan:    String(now.getMonth() + 1),
    tahun:    String(now.getFullYear()),
    petugas:  "",
  });

  const [rows, setRows] = useState<RekapRow[]>(
    DEFAULT_KOMODITAS.map((k) => emptyRow(k.id))
  );

  const [activeTab, setActiveTab] = useState<Kategori | "semua">("semua");
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // state modal tambah komoditas (khusus admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKomoditas, setNewKomoditas] = useState<{ nama: string; satuan: string; kategori: Kategori }>({
    nama: "",
    satuan: "kg",
    kategori: "pangan-pokok",
  });
  const [addError, setAddError] = useState("");

  // derived
  const visibleKomoditas =
    activeTab === "semua"
      ? komoditas
      : komoditas.filter((k) => k.kategori === activeTab);

  const getRow = (id: string) => rows.find((r) => r.komoditasId === id)!;

  const filledCount = rows.filter(
    (r) => r.hargaMin || r.hargaMax || r.hargaRata
  ).length;

  // handlers
  const updateMeta = (field: keyof FormMeta, val: string) =>
    setMeta((p) => ({ ...p, [field]: val }));

  const updateRow = (id: string, field: keyof RekapRow, raw: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.komoditasId !== id) return r;
        const updated = { ...r, [field]: raw };
        // auto rata-rata
        if (field === "hargaMin" || field === "hargaMax") {
          const min = parseFloat(field === "hargaMin" ? raw : r.hargaMin);
          const max = parseFloat(field === "hargaMax" ? raw : r.hargaMax);
          if (!isNaN(min) && !isNaN(max))
            updated.hargaRata = String(Math.round((min + max) / 2));
        }
        return updated;
      })
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!meta.petugas.trim()) e.petugas = "Nama petugas wajib diisi";
    if (!meta.tanggal)        e.tanggal = "Tanggal wajib diisi";
    if (filledCount === 0)    e.rows    = "Isi minimal satu data harga komoditas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    console.log("Submit rekap IPH:", { meta, rows });
    setSubmitted(true);
  };

  const handleReset = () => {
    setMeta({
      tanggal: now.toISOString().split("T")[0],
      mingguKe: "1", bulan: String(now.getMonth() + 1),
      tahun: String(now.getFullYear()), petugas: "",
    });
    setKomoditas(DEFAULT_KOMODITAS);
    setRows(DEFAULT_KOMODITAS.map((k) => emptyRow(k.id)));
    setErrors({});
    setSubmitted(false);
  };

  // ── Handler tambah komoditas baru (admin) ─────────────────────────────────

  const kategoriOptions = Object.keys(KATEGORI_LABEL) as Kategori[];

  function openAddModal() {
    setNewKomoditas({ nama: "", satuan: "kg", kategori: "pangan-pokok" });
    setAddError("");
    setShowAddModal(true);
  }

  function handleAddKomoditas() {
    const nama = newKomoditas.nama.trim();
    if (!nama) {
      setAddError("Nama komoditas wajib diisi.");
      return;
    }
    if (komoditas.some((k) => k.nama.toLowerCase() === nama.toLowerCase())) {
      setAddError("Komoditas dengan nama tersebut sudah terdaftar.");
      return;
    }
    const id = nama.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (komoditas.some((k) => k.id === id)) {
      setAddError("Komoditas dengan nama mirip sudah terdaftar.");
      return;
    }
    const kom: Komoditas = {
      id,
      nama,
      satuan: newKomoditas.satuan.trim() || "kg",
      kategori: newKomoditas.kategori,
    };
    setKomoditas((prev) => [...prev, kom]);
    setRows((prev) => [...prev, emptyRow(kom.id)]);
    setShowAddModal(false);
  }

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Rekap IPH Berhasil Disimpan</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Data rekap minggu ke-{meta.mingguKe} {BULAN[parseInt(meta.bulan) - 1]} {meta.tahun} telah
            tersimpan. <span className="font-medium text-gray-700">{filledCount} komoditas</span> tercatat.
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-3 mb-6">
            <span>📅 {new Date(meta.tanggal).toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
            <span>👤 {meta.petugas}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Input Data Baru
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Cetak Rekap
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 bg-gray-50 min-h-full">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Input Rekap IPH</h1>
          <p className="text-xs text-gray-400 mt-0.5">Indeks Perkembangan Harga — TPID Kota Batu</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs text-gray-500 font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {filledCount} / {komoditas.length} komoditas terisi
          </div>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={12} />
              Tambah Komoditas
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Informasi Rekap
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Tanggal</label>
            <input
              type="date"
              value={meta.tanggal}
              onChange={(e) => updateMeta("tanggal", e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.tanggal ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.tanggal && <p className="text-xs text-red-500">{errors.tanggal}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Minggu Ke</label>
            <select
              value={meta.mingguKe}
              onChange={(e) => updateMeta("mingguKe", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {["1","2","3","4","5"].map((w) => (
                <option key={w} value={w}>Minggu ke-{w}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Bulan</label>
            <select
              value={meta.bulan}
              onChange={(e) => updateMeta("bulan", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {BULAN.map((b, i) => (
                <option key={b} value={String(i + 1)}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Tahun</label>
            <select
              value={meta.tahun}
              onChange={(e) => updateMeta("tahun", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {["2023","2024","2025","2026"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 md:col-span-4 space-y-1">
            <label className="text-xs font-medium text-gray-500">Nama Petugas</label>
            <input
              type="text"
              placeholder="Masukkan nama petugas survei..."
              value={meta.petugas}
              onChange={(e) => updateMeta("petugas", e.target.value)}
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                errors.petugas ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            {errors.petugas && <p className="text-xs text-red-500">{errors.petugas}</p>}
          </div>
        </div>
      </div>

      {/* Kategori tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {KATEGORI_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeTab === id
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Row error */}
      {errors.rows && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {errors.rows}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-400 font-normal w-8">#</th>
                <th className="text-left px-4 py-3 text-gray-400 font-normal min-w-[160px]">Komoditas</th>
                <th className="text-center px-3 py-3 text-gray-400 font-normal w-16">Satuan</th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[130px]">Harga Min (Rp)</th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[130px]">Harga Maks (Rp)</th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[130px]">
                  Harga Rata
                  <span className="ml-1 text-emerald-500 font-normal">(auto)</span>
                </th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[100px]">Stok</th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[170px]">Pasar</th>
                <th className="text-left px-3 py-3 text-gray-400 font-normal min-w-[150px]">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {visibleKomoditas.map((kom, idx) => {
                const row = getRow(kom.id);
                const isFilled = !!(row.hargaMin || row.hargaMax || row.hargaRata);
                return (
                  <tr
                    key={kom.id}
                    className={`transition-colors ${isFilled ? "bg-emerald-50/40" : "hover:bg-gray-50/60"}`}
                  >
                    <td className="px-4 py-2.5 text-gray-300 text-center">{idx + 1}</td>

                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-800 block">{kom.nama}</span>
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 font-medium ${KATEGORI_BADGE[kom.kategori]}`}>
                        {KATEGORI_LABEL[kom.kategori]}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-center text-gray-400">{kom.satuan}</td>

                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={toRupiah(row.hargaMin)}
                        onChange={(e) => updateRow(kom.id, "hargaMin", fromRupiah(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 bg-white"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={toRupiah(row.hargaMax)}
                        onChange={(e) => updateRow(kom.id, "hargaMax", fromRupiah(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 bg-white"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="—"
                        value={toRupiah(row.hargaRata)}
                        onChange={(e) => updateRow(kom.id, "hargaRata", fromRupiah(e.target.value))}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-700 bg-emerald-50/60 font-medium"
                      />
                    </td>

                    <td className="px-3 py-2.5">
                      <select
                        value={row.stok}
                        onChange={(e) => updateRow(kom.id, "stok", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 bg-white"
                      >
                        <option value="">-</option>
                        <option value="aman">Aman</option>
                        <option value="cukup">Cukup</option>
                        <option value="terbatas">Terbatas</option>
                        <option value="langka">Langka</option>
                      </select>
                    </td>

                    <td className="px-3 py-2.5">
                      <select
                        value={row.pasar}
                        onChange={(e) => updateRow(kom.id, "pasar", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 bg-white"
                      >
                        <option value="">Pilih pasar...</option>
                        {PASAR_LIST.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        placeholder="Opsional..."
                        value={row.keterangan}
                        onChange={(e) => updateRow(kom.id, "keterangan", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 pb-6">
        <button
          onClick={handleReset}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Reset Form
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => console.log("Draft disimpan", { meta, rows })}
            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Simpan Draft
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Simpan &amp; Kirim Rekap
          </button>
        </div>
      </div>

      {/* Modal: Tambah Komoditas (admin only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tambah Komoditas Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daftarkan komoditas baru ke form rekap IPH TPID Kota Batu
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {addError && (
                <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <X size={11} className="text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600">{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nama Komoditas <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newKomoditas.nama}
                  onChange={(e) => { setNewKomoditas((f) => ({ ...f, nama: e.target.value })); setAddError(""); }}
                  placeholder="Contoh: Kentang"
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Satuan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newKomoditas.satuan}
                  onChange={(e) => setNewKomoditas((f) => ({ ...f, satuan: e.target.value }))}
                  placeholder="kg / liter / ekor / ikat"
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Kategori <span className="text-red-400">*</span>
                </label>
                <select
                  value={newKomoditas.kategori}
                  onChange={(e) => setNewKomoditas((f) => ({ ...f, kategori: e.target.value as Kategori }))}
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-700"
                >
                  {kategoriOptions.map((k) => (
                    <option key={k} value={k}>{KATEGORI_LABEL[k]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddKomoditas}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Plus size={12} />
                Tambahkan Komoditas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}