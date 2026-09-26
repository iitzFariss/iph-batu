import { useState } from "react";
import { Plus, Minus, X, TrendingDown, TrendingUp } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type KomoditasNilai = {
  nama: string;
  nilai: string;
};

type FormState = {
  tahun: string;
  bulan: string;
  mingguKe: string;
  indikator: string;
  andil: KomoditasNilai[];
  fluktuasi: KomoditasNilai;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

const DEFAULT_KOMODITAS = [
  "Beras Medium",
  "Beras Premium",
  "Jagung",
  "Kedelai",
  "Bawang Merah",
  "Bawang Putih",
  "Cabai Merah Keriting",
  "Cabai Rawit Merah",
  "Daging Sapi Murni",
  "Daging Ayam Ras",
  "Telur Ayam Ras",
  "Ikan Tongkol",
  "Gula Pasir",
  "Minyak Goreng Kemasan",
  "Tepung Terigu",
];

const now = new Date();

const emptyAndil = (): KomoditasNilai => ({ nama: "", nilai: "" });

const emptyForm = (): FormState => ({
  tahun:   String(now.getFullYear()),
  bulan:   BULAN[now.getMonth()],
  mingguKe: "1",
  indikator: "",
  andil: [emptyAndil(), emptyAndil(), emptyAndil()],
  fluktuasi: emptyAndil(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseNum = (val: string) => {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
};

const formatPct = (value: number | null) => {
  if (value === null) return "—";
  const pos = value > 0;
  const sign = pos ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(2)}%`;
};

function PctCell({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (value === 0) {
    return <span className="text-xs font-semibold text-gray-500">0.00%</span>;
  }
  const pos = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
      pos ? "text-red-600" : "text-blue-600"
    }`}>
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {formatPct(value)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InputRekapIPH() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [komoditasList, setKomoditasList] = useState<string[]>(DEFAULT_KOMODITAS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKomoditas, setNewKomoditas] = useState("");
  const [addError, setAddError] = useState("");

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const updateAndil = (idx: number, field: keyof KomoditasNilai, val: string) =>
    setForm((prev) => ({
      ...prev,
      andil: prev.andil.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));

  const updateFluktuasi = (field: keyof KomoditasNilai, val: string) =>
    setForm((prev) => ({ ...prev, fluktuasi: { ...prev.fluktuasi, [field]: val } }));

  const addKomoditas = () => {
    const nama = newKomoditas.trim();
    if (!nama) {
      setAddError("Nama komoditas wajib diisi.");
      return;
    }
    if (komoditasList.some((k) => k.toLowerCase() === nama.toLowerCase())) {
      setAddError("Komoditas dengan nama tersebut sudah terdaftar.");
      return;
    }
    setKomoditasList((prev) => [...prev, nama]);
    setShowAddModal(false);
    setNewKomoditas("");
    setAddError("");
  };

  const removeKomoditas = (nama: string) =>
    setKomoditasList((prev) => prev.filter((k) => k !== nama));

  const isCommodityValid = (r: KomoditasNilai) =>
    r.nama.trim() !== "" && parseNum(r.nilai) !== null;

  const filledCount = form.andil.filter(isCommodityValid).length;

  const nilaiInputCls = (hasError: boolean) =>
    `w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  const validate = () => {
    const e: Record<string, string> = {};
    const tahun = parseInt(form.tahun, 10);
    if (!form.tahun || isNaN(tahun)) e.tahun = "Tahun wajib diisi angka";
    if (!form.bulan.trim()) e.bulan = "Bulan wajib diisi";
    if (!form.mingguKe) e.mingguKe = "Minggu ke wajib dipilih";
    if (parseNum(form.indikator) === null) e.indikator = "Isi angka persen, misal -0.42 atau +0.15";
    if (filledCount === 0) e.andil = "Isi minimal satu komoditas beserta nilainya (%)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    console.log("Submit rekap IPH:", form);
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(emptyForm());
    setErrors({});
    setSubmitted(false);
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (submitted) {
    const indikator = parseNum(form.indikator);
    return (
      <div className="flex items-center justify-center min-h-full bg-gray-50 p-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Rekap IPH Berhasil Disimpan</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Data rekap minggu ke-{form.mingguKe} {form.bulan} {form.tahun}
            telah tersimpan.
            <span className="font-medium text-gray-700"> {filledCount} komoditas</span> tercatat.
          </p>

          <div className="text-sm font-black text-gray-900 mb-5">
            Indikator Perubahan Harga: <PctCell value={indikator} />
          </div>

          <div className="space-y-2 text-left bg-gray-50 rounded-lg px-4 py-3 mb-6">
            {form.andil.filter(isCommodityValid).map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-600">{r.nama}</span>
                <PctCell value={parseNum(r.nilai)} />
              </div>
            ))}
            {isCommodityValid(form.fluktuasi) && (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-700">
                  Komoditas fluktuasi: {form.fluktuasi.nama}
                </span>
                <PctCell value={parseNum(form.fluktuasi.nilai)} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
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
    <div className="p-4 sm:p-6 space-y-5 bg-gray-50 min-h-full">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Input Rekap IPH</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Indeks Perkembangan Harga Mingguan — TPID Kota Batu
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs text-gray-500 font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {filledCount} / {form.andil.length} komoditas andil terisi
        </div>
      </div>

      {/* Informasi periode */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Informasi Periode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Tahun</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.tahun}
              onChange={(e) => updateField("tahun", e.target.value)}
              className={nilaiInputCls(!!errors.tahun)}
            />
            {errors.tahun && <p className="text-xs text-red-500">{errors.tahun}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Bulan</label>
            <select
              value={form.bulan}
              onChange={(e) => updateField("bulan", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              {BULAN.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Minggu Ke</label>
            <select
              value={form.mingguKe}
              onChange={(e) => updateField("mingguKe", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              {["1","2","3","4","5"].map((w) => (
                <option key={w} value={w}>Minggu ke-{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Indikator */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Indikator Perubahan Harga
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Tulis angka persen — nilai negatif (<Minus size={10} className="inline" />) berarti turun
          (deflasi), positif berarti naik (inflasi).
        </p>
        <div className="flex items-center gap-2 w-full sm:max-w-xs">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Contoh: -0.42"
            value={form.indikator}
            onChange={(e) => updateField("indikator", e.target.value)}
            className={nilaiInputCls(!!errors.indikator)}
          />
          <span className="text-sm text-gray-400 flex-shrink-0">%</span>
        </div>
        {errors.indikator && <p className="text-xs text-red-500 mt-1">{errors.indikator}</p>}
      </div>

      {/* Komoditas andil */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Komoditas Andil Pergerakan Harga
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Komoditas dengan kenaikan &amp; penurunan tertinggi minggu ini (maks. 3). Nilai dalam persen —
          negatif turun, positif naik.
        </p>

        {errors.andil && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {errors.andil}
          </div>
        )}

        <div className="space-y-3">
          {form.andil.map((row, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Komoditas {idx + 1}</label>
                <input
                  type="text"
                  list="daftar-komoditas"
                  placeholder="Nama komoditas (mis. Cabai Rawit)"
                  value={row.nama}
                  onChange={(e) => updateAndil(idx, "nama", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Nilai (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Contoh: +0.82"
                    value={row.nilai}
                    onChange={(e) => updateAndil(idx, "nilai", e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                  />
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {parseNum(row.nilai) !== null && (
                      <span className={`font-semibold ${(parseNum(row.nilai) ?? 0) > 0 ? "text-red-600" : (parseNum(row.nilai) ?? 0) < 0 ? "text-blue-600" : "text-gray-500"}`}>
                        {formatPct(parseNum(row.nilai))}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Komoditas fluktuasi */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Komoditas Fluktuasi
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Komoditas dengan gejolak harga paling signifikan minggu ini (opsional).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Komoditas</label>
            <input
              type="text"
              list="daftar-komoditas"
              placeholder="Nama komoditas"
              value={form.fluktuasi.nama}
              onChange={(e) => updateFluktuasi("nama", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Nilai Fluktuasi (%)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Contoh: -1.20"
              value={form.fluktuasi.nilai}
              onChange={(e) => updateFluktuasi("nilai", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
            />
          </div>
        </div>
      </div>

      <datalist id="daftar-komoditas">
        {komoditasList.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>

      {/* Daftar komoditas master */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Daftar Komoditas ({komoditasList.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Jenis komoditas yang dipantau — bisa ditambah atau dihapus sesuai kebutuhan survei.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setNewKomoditas(""); setAddError(""); setShowAddModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex-shrink-0"
          >
            <Plus size={12} />
            Tambah Komoditas
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {komoditasList.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700"
            >
              {k}
              <button
                type="button"
                onClick={() => removeKomoditas(k)}
                title={`Hapus ${k}`}
                className="p-0.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Modal: Tambah Komoditas */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tambah Komoditas Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daftarkan jenis komoditas baru ke pemantauan IPH TPID Kota Batu
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
                  value={newKomoditas}
                  onChange={(e) => { setNewKomoditas(e.target.value); setAddError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKomoditas(); } }}
                  placeholder="Contoh: Kentang"
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
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
                onClick={addKomoditas}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                <Plus size={12} />
                Tambahkan Komoditas
              </button>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => console.log("Draft disimpan", form)}
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
    </div>
  );
}