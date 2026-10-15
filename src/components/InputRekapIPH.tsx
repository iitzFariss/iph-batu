import { useCallback, useEffect, useState } from "react";
import { useDialogFocus } from "../lib/useDialogFocus";
import PageHeading from "./PageHeading";
import { Plus, X, TrendingDown, TrendingUp } from "lucide-react";
import { api, ApiError } from "../lib/api";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
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

const monthIndex = (name: string) => Math.max(0, BULAN.indexOf(name))

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const parseNum = (val: string) => {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
};

const formatNumber = (value: number | null) => {
  if (value === null) return "Belum diisi";
  const pos = value > 0;
  const sign = pos ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const formatPct = (value: number | null, unit: string) => value === null ? formatNumber(value) : `${formatNumber(value)}${unit === "%" ? "%" : ` ${unit}`}`;

function PctCell({ value, unit = "%" }: { value: number | null; unit?: string }) {
  if (value === null) {
    return <span className="text-xs text-gray-400">Belum diisi</span>;
  }
  if (value === 0) {
    return <span className="text-xs font-semibold text-gray-500">{formatPct(value, unit)}</span>;
  }
  const pos = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${
      pos ? "text-red-600" : "text-blue-600"
    }`}>
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {formatPct(value, unit)}
    </span>
  );
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InputRekapIPH() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  const [komoditasList, setKomoditasList] = useState<string[]>([]);
  const [komoditasIds, setKomoditasIds] = useState<Record<string, string>>({});
  const [komoditasError, setKomoditasError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKomoditas, setNewKomoditas] = useState("");
  const [addError, setAddError] = useState("");
  const dialogRef = useDialogFocus(() => setShowAddModal(false), showAddModal);

  // Daftar commodities harus berasal dari database. Fallback ke daftar hardcoded
  // akan membuat pengguna memilih komoditas yang tidak ada, lalu POST /rekap
  // ditolak karena nama tidak ditemukan.
  const loadKomoditas = useCallback(() => {
    api
      .get<{ rows: { id: string; nama: string }[] }>("/komoditas")
      .then(({ rows }) => {
        setKomoditasList(rows.map((k) => k.nama));
        setKomoditasIds(Object.fromEntries(rows.map((k) => [k.nama, k.id])));
        setKomoditasError("");
      })
      .catch(() => setKomoditasError("Gagal memuat daftar komoditas. Periksa koneksi lalu muat ulang."));
  }, []);

  useEffect(() => {
    loadKomoditas();
  }, [loadKomoditas]);

  const updateField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const updateAndil = (idx: number, field: keyof KomoditasNilai, val: string) =>
    setForm((prev) => ({
      ...prev,
      andil: prev.andil.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));

  const updateFluktuasi = (field: keyof KomoditasNilai, val: string) =>
    setForm((prev) => ({ ...prev, fluktuasi: { ...prev.fluktuasi, [field]: val } }));

  const addKomoditas = async () => {
    const nama = newKomoditas.trim();
    if (!nama) {
      setAddError("Nama komoditas wajib diisi.");
      return;
    }
    if (komoditasList.some((k) => k.toLowerCase() === nama.toLowerCase())) {
      setAddError("Komoditas dengan nama tersebut sudah terdaftar.");
      return;
    }
    try {
      const res = await api.post<{ komoditas: { id: string; nama: string } }>("/komoditas", { nama });
      setKomoditasList((prev) => [...prev, res.komoditas.nama]);
      setKomoditasIds((prev) => ({ ...prev, [res.komoditas.nama]: res.komoditas.id }));
      setShowAddModal(false);
      setNewKomoditas("");
      setAddError("");
    } catch (e) {
      setAddError(e instanceof ApiError ? e.message : "Gagal menambahkan komoditas.");
    }
  };

  const removeKomoditas = async (nama: string) => {
    const id = komoditasIds[nama];
    if (!id) {
      setKomoditasList((prev) => prev.filter((k) => k !== nama));
      return;
    }
    try {
      await api.delete(`/komoditas/${id}`);
      setKomoditasError("");
    } catch (error) {
      setKomoditasError(error instanceof ApiError ? error.message : "Komoditas belum dapat dihapus. Coba lagi setelah koneksi pulih.");
      return;
    }
    setKomoditasList((prev) => prev.filter((k) => k !== nama));
    setKomoditasIds((prev) => {
      const rest = { ...prev };
      delete rest[nama];
      return rest;
    });
  };

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
    if (filledCount === 0) e.andil = "Isi minimal satu komoditas beserta nilai andilnya.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setBusy(true);
    setSubmitError("");
    const payload = {
      tahun: parseInt(form.tahun, 10),
      bulan: monthIndex(form.bulan) + 1,
      mingguKe: parseInt(form.mingguKe, 10),
      indikator: parseNum(form.indikator),
      andil: form.andil.filter(isCommodityValid).map((r) => ({
        nama: r.nama.trim(),
        nilai: parseNum(r.nilai),
      })),
      fluktuasi: isCommodityValid(form.fluktuasi)
        ? { nama: form.fluktuasi.nama.trim(), nilai: parseNum(form.fluktuasi.nilai) }
        : null,
    };
    try {
      await api.post("/rekap", payload);
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Gagal menyimpan rekap.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setForm(emptyForm());
    setErrors({});
    setSubmitted(false);
    setSubmitError("");
  };

  // â”€â”€ Success screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (submitted) {
    const indikator = parseNum(form.indikator);
    return (
      <div className="flex items-center justify-center min-h-full bg-gray-50 p-4 sm:p-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-8 text-center max-w-md w-full shadow-sm">
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
                <PctCell value={parseNum(r.nilai)} unit="persen poin" />
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

          <div className="flex flex-col sm:flex-row justify-center gap-3">
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

  // â”€â”€ Main form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="rekap-entry space-y-6 w-full">

      {/* Page header */}
      <PageHeading title="Input rekap IPH" description="Catat nilai IPH dan andil komoditas pada periode mingguan yang dipilih."><span className="text-xs text-gray-500">{filledCount} dari {form.andil.length} andil terisi</span></PageHeading>

      <div className="entry-sheet"><div className="entry-fields">
      {/* Informasi periode */}
      <section className="form-surface entry-period">
        <h2 className="form-section-title mb-5">
          Periode pelaporan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Tahun</label>
            <input
              type="text"
              inputMode="numeric"
              aria-label="Tahun rekap"
              value={form.tahun}
              onChange={(e) => updateField("tahun", e.target.value)}
              className={nilaiInputCls(!!errors.tahun)}
            />
            {errors.tahun && <p className="text-xs text-red-500">{errors.tahun}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Bulan</label>
            <select
              aria-label="Bulan rekap"
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
              aria-label="Minggu rekap"
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
      </section>

      {/* Indikator */}
      <section className="form-surface entry-indicator">
        <h2 className="form-section-title">
          Indeks Perkembangan Harga
        </h2>
        <label htmlFor="rekap-iph-value" className="block text-xs font-medium text-gray-500 mb-1">Nilai IPH (%)</label>
        <div className="flex items-center gap-2 w-full">
          <input
            id="rekap-iph-value"
            type="text"
            inputMode="decimal"
            placeholder="Contoh: -0,42"
            aria-label="Nilai IPH"
            value={form.indikator}
            onChange={(e) => updateField("indikator", e.target.value)}
            className={nilaiInputCls(!!errors.indikator)}
          />
          <span className="text-sm text-gray-400 flex-shrink-0">%</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">Negatif berarti harga turun; positif berarti harga naik.</p>
        {errors.indikator && <p className="text-xs text-red-500 mt-1">{errors.indikator}</p>}
      </section>

      {/* Komoditas andil */}
      <section className="form-surface entry-andil">
        <h2 className="form-section-title">
          Andil komoditas
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Komoditas dengan kenaikan dan penurunan tertinggi minggu ini (maksimal 3). Nilai dalam persen poin,
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
                  aria-label={`Komoditas andil ${idx + 1}`}
                  value={row.nama}
                  onChange={(e) => updateAndil(idx, "nama", e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Andil (persen poin)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Contoh: +0,82"
                    aria-label={`Nilai andil ${idx + 1}`}
                    value={row.nilai}
                    onChange={(e) => updateAndil(idx, "nilai", e.target.value)}
                    className="min-w-0 flex-1 w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
                  />
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {parseNum(row.nilai) !== null && (
                      <span className={`font-semibold ${(parseNum(row.nilai) ?? 0) > 0 ? "text-red-600" : (parseNum(row.nilai) ?? 0) < 0 ? "text-blue-600" : "text-gray-500"}`}>
                        {formatNumber(parseNum(row.nilai))}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Komoditas fluktuasi */}
      <section className="form-surface entry-fluctuation">
        <h2 className="form-section-title">
          Komoditas fluktuasi
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Komoditas dengan gejolak harga paling signifikan minggu ini (opsional).
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Komoditas</label>
            <input
              type="text"
              list="daftar-komoditas"
              placeholder="Nama komoditas"
              aria-label="Komoditas fluktuasi"
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
              placeholder="Contoh: -1,20"
              aria-label="Nilai fluktuasi"
              value={form.fluktuasi.nilai}
              onChange={(e) => updateFluktuasi("nilai", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 tabular-nums"
            />
          </div>
        </div>
      </section>

      </div><div className="entry-reference">
      {komoditasError && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <span className="text-xs text-red-600">{komoditasError}</span>
          <button
            type="button"
            onClick={loadKomoditas}
            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            Muat Ulang
          </button>
        </div>
      )}

      <datalist id="daftar-komoditas">
        {komoditasList.map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>

      {/* Daftar komoditas master */}
      <details className="entry-catalog">
        <summary>Daftar komoditas <span>{komoditasList.length} jenis terdaftar</span></summary>
        <div className="entry-catalog-body">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="form-section-title">
              Daftar komoditas
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {komoditasList.length} jenis komoditas. Pilih nama yang sama saat mengisi rekap.
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

        <div className="commodity-catalog mt-4" role="region" aria-label="Daftar komoditas terdaftar">
          {komoditasList.map((k) => (
            <div
              key={k}
              className="flex items-center justify-between gap-3 py-1 border-b border-gray-100 text-sm text-gray-700"
            >
              {k}
              <button
                type="button"
                onClick={() => removeKomoditas(k)}
                aria-label={`Hapus komoditas ${k}`}
                title={`Hapus ${k}`}
                className="p-0.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        </div>
      </details>
      </div>
      <div className="entry-submit">
        {submitError && <div role="alert" className="text-sm text-red-600 mb-3">{submitError}</div>}
        <div className="form-actions">
          <button type="button" onClick={handleReset} className="secondary-action">Reset Form</button>
          <button type="button" onClick={handleSubmit} disabled={busy} className="primary-action">{busy ? "Menyimpan…" : "Simpan rekap"}</button>
        </div>
      </div>
      </div>
      {/* Modal: Tambah Komoditas */}
      {showAddModal && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Tambah komoditas" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Tambah Komoditas Baru</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Daftarkan jenis komoditas baru ke pemantauan IPH TPID Kota Batu
                </p>
              </div>
              <button
                aria-label="Tutup dialog komoditas"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto">
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
                  aria-label="Nama komoditas"
                  onChange={(e) => { setNewKomoditas(e.target.value); setAddError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKomoditas(); } }}
                  placeholder="Contoh: Kentang"
                  autoFocus
                  className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="dialog-actions px-5 py-4 border-t border-gray-100 bg-gray-50/50">
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

    </div>
  );
}
