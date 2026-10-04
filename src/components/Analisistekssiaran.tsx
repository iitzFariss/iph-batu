import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  TrendingDown,
  Copy,
  Pencil,
  Clock,
  Users,
  Link2,
  Bell,
} from "lucide-react";
import { api } from "../lib/api";
import { buildPublicDashboardLink } from "../lib/publicDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Penerima {
  initials: string;
  color: string;
  name: string;
  jabatan: string;
  status: "siap" | "terhubung";
}

interface AndilItem {
  name: string;
  change: number;
}

interface PeriodeRow {
  id: string;
  tahun: number;
  bulan: number;
  mingguIndeks: number;
  periode: string;
  cutoffStart: string;
  cutoffEnd: string;
  nilaiIPH: number;
  statusIPH: string;
}

interface RekapRow extends PeriodeRow {
  deflasi: AndilItem[];
  inflasi: AndilItem[];
  fluktuasi: AndilItem | null;
}

interface Periode {
  tahun: number;
  bulan: number;
  minggu: number;
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;
const ROMAWI = ["I", "II", "III", "IV", "V"] as const;

const STATUS_IPH: Record<string, string> = {
  "deflasi-signifikan": "Deflasi Signifikan",
  "deflasi-terkendali": "Deflasi Terkendali",
  "stabil-terkendali": "Stabil Terkendali",
  "inflasi-ringan": "Inflasi Ringan",
  "perlu-intervensi": "Perlu Intervensi",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const penerimaSiaran: Penerima[] = [
  { initials: "PW", color: "bg-emerald-600", name: "Pj. Walikota Batu",  jabatan: "Akses Jalur Komando 1",    status: "siap"     },
  { initials: "SD", color: "bg-blue-600",    name: "Sekretaris Daerah",   jabatan: "Ketua Pelaksana Harian TPID", status: "siap"  },
  { initials: "KD", color: "bg-purple-600",  name: "Pusda Kemendagri",    jabatan: "Integrasi Pelaporan API",  status: "terhubung" },
];

const drafKosong = `// Belum ada data rekap untuk periode yang dipilih.
//
// Pilih Tahun Anggaran, Bulan Pelaporan, dan Pekan Evaluasi IPH
// pada toolbar di atas untuk menyusun draf.`;

function formatAndil(list: AndilItem[]): string[] {
  return list.map((d) => `   - ${d.name} (${d.change > 0 ? "+" : ""}${d.change.toFixed(2)}%)`);
}

function formatIph(nilai: number): string {
  return `${nilai > 0 ? "+" : ""}${nilai.toFixed(2)}%`;
}

function hariJam(value: Date): string {
  return value.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function urutRekap(a: PeriodeRow, b: PeriodeRow): number {
  return b.tahun - a.tahun || b.bulan - a.bulan || b.mingguIndeks - a.mingguIndeks;
}

function mingguTersediaPada(rows: PeriodeRow[], tahun: number, bulan: number): number[] {
  return [...new Set(rows.filter((r) => r.tahun === tahun && r.bulan === bulan).map((r) => r.mingguIndeks))].sort(
    (a, b) => a - b,
  );
}

function periodeCadangan(rows: PeriodeRow[], saatIni: Periode): Periode | null {
  const samaBulan = rows.filter((r) => r.tahun === saatIni.tahun && r.bulan === saatIni.bulan);
  if (samaBulan.length > 0) {
    const minggu = Math.max(...samaBulan.map((r) => r.mingguIndeks));
    return { ...saatIni, minggu };
  }
  const sameTahun = rows.filter((r) => r.tahun === saatIni.tahun);
  if (sameTahun.length > 0) {
    const akhir = sameTahun.reduce((a, b) =>
      a.bulan > b.bulan || (a.bulan === b.bulan && a.mingguIndeks >= b.mingguIndeks) ? a : b,
    );
    return { tahun: akhir.tahun, bulan: akhir.bulan, minggu: akhir.mingguIndeks };
  }
  const terbaru = rows[0];
  return terbaru ? { tahun: terbaru.tahun, bulan: terbaru.bulan, minggu: terbaru.mingguIndeks } : null;
}

function buildDraf(row: RekapRow): string {
  const minggu = `Minggu ${ROMAWI[row.mingguIndeks - 1] ?? row.mingguIndeks} ${BULAN[row.bulan - 1]} ${row.tahun}`;
  const nilai = `${row.nilaiIPH > 0 ? "+" : ""}${row.nilaiIPH.toFixed(2)}%`;
  const baris: string[] = [
    "// DOKUMEN DISPOSISI KEPALA DAERAH / SIARAN PERS KEMENDAGRI",
    "",
    "Yth. Bapak Pj. Wali Kota Batu / Sekretaris Daerah Kota Batu,",
    "Melaporkan rilis resmi Indeks Perkembangan Harga (IPH)",
    `Kota Batu pada ${minggu}:`,
    "",
    `1. Angka IPH Gabungan Kota Batu tercatat sebesar ${nilai}`,
    `   (kategori ${STATUS_IPH[row.statusIPH] ?? row.statusIPH}).`,
  ];

  if (row.deflasi.length > 0) {
    baris.push("", "2. Komoditas utama yang memberikan andil penurunan harga:", ...formatAndil(row.deflasi));
  }
  if (row.inflasi.length > 0) {
    baris.push("", "3. Komoditas yang memberikan andil kenaikan harga:", ...formatAndil(row.inflasi));
  }
  if (row.fluktuasi) {
    baris.push("", "4. Komoditas berfluktuasi:", ...formatAndil([row.fluktuasi]));
  }

  baris.push(
    "",
    "Demikian laporan Tim Pengendalian Inflasi Daerah (TPID)",
    "Kota Batu.",
  );

return baris.join("\n");
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalisisTeksSiaran() {
  const [showPenerima, setShowPenerima] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [sendingGrafik, setSendingGrafik] = useState(false);
  const [dashboardLink] = useState(() => buildPublicDashboardLink());

  const [rows, setRows] = useState<PeriodeRow[]>([]);
  const [detail, setDetail] = useState<{ key: string; row: RekapRow | null } | null>(null);
  const [detailError, setDetailError] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [menyegarkan, setMenyegarkan] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [terakhirMuat, setTerakhirMuat] = useState<Date | null>(null);
  const [infoBaru, setInfoBaru] = useState<string | null>(null);

  const rowsRef = useRef<PeriodeRow[]>([]);
  const periodeRef = useRef<Periode | null>(null);
  const memuatRef = useRef(false);

  const terapkan = useCallback((urut: PeriodeRow[], awal: boolean) => {
    const terbaru = urut[0];
    const sebelumnya = rowsRef.current[0];

    setRows(urut);
    rowsRef.current = urut;
    setTerakhirMuat(new Date());
    setLoadError(null);

    const sekarang = periodeRef.current;
    if (awal || !sekarang) {
      const dipilih = terbaru ? { tahun: terbaru.tahun, bulan: terbaru.bulan, minggu: terbaru.mingguIndeks } : null;
      periodeRef.current = dipilih;
      setPeriode(dipilih);
      return;
    }

    if (terbaru && sebelumnya && terbaru.id !== sebelumnya.id) {
      setInfoBaru(
        `Rekap baru masuk: ${terbaru.periode}, IPH ${formatIph(terbaru.nilaiIPH)}. Pilih di toolbar untuk membuka.`,
      );
    }

    const masihAda = urut.some(
      (r) => r.tahun === sekarang.tahun && r.bulan === sekarang.bulan && r.mingguIndeks === sekarang.minggu,
    );
    if (!masihAda) {
      const ganti = periodeCadangan(urut, sekarang);
      periodeRef.current = ganti;
      setPeriode(ganti);
    }
  }, []);

  const muatData = useCallback(
    async (mode: "manual" | "auto") => {
      if (memuatRef.current) return;
      memuatRef.current = true;
      if (mode === "auto") setMenyegarkan(true);
      else setLoading(true);

      try {
        const data = await api.get<{ rows: PeriodeRow[] }>("/rekap/periods");
        terapkan([...data.rows].sort(urutRekap), false);
      } catch (e) {
        setLoadError(
          mode === "auto" ? `Gagal memeriksa data baru: ${(e as Error).message}` : (e as Error).message,
        );
      } finally {
        memuatRef.current = false;
        setLoading(false);
        setMenyegarkan(false);
      }
    },
    [terapkan],
  );

  useEffect(() => {
    let batal = false;
    api
      .get<{ rows: PeriodeRow[] }>("/rekap/periods")
      .then((data) => {
        if (!batal) terapkan([...data.rows].sort(urutRekap), true);
      })
      .catch((e: Error) => {
        if (!batal) setLoadError(e.message);
      })
      .finally(() => {
        if (!batal) setLoading(false);
      });
    return () => {
      batal = true;
    };
  }, [terapkan]);

  const detailKey = periode ? `${periode.tahun}-${periode.bulan}-${periode.minggu}` : null;
  const detailQuery = periode
    ? `/rekap?tahun=${periode.tahun}&bulan=${periode.bulan}&minggu=${periode.minggu}&perPage=1`
    : null;

  useEffect(() => {
    if (!detailKey || !detailQuery) return;
    let batal = false;
    api
      .get<{ rows: RekapRow[] }>(detailQuery)
      .then((data) => {
        if (!batal) {
          setDetail({ key: detailKey, row: data.rows[0] ?? null });
          setDetailError(false);
        }
      })
      .catch(() => {
        if (!batal) {
          setDetail({ key: detailKey, row: null });
          setDetailError(true);
        }
      });
    return () => {
      batal = true;
    };
  }, [detailKey, detailQuery]);

  const detailLoading = detailKey !== null && detail?.key !== detailKey;

  useEffect(() => {
    let timer: number | undefined;
    const saatTerlihat = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void muatData("auto"), 2000);
    };

    window.addEventListener("focus", saatTerlihat);
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", saatTerlihat);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [muatData]);

  function simpanPeriode(next: Periode) {
    periodeRef.current = next;
    setPeriode(next);
  }

  function handleTahunChange(next: number) {
    const bulanTersedia = [...new Set(rows.filter((r) => r.tahun === next).map((r) => r.bulan))].sort((a, b) => a - b);
    const bulanBaru =
      periode && bulanTersedia.includes(periode.bulan) ? periode.bulan : bulanTersedia[bulanTersedia.length - 1] ?? 0;
    const mingguTersedia = bulanBaru ? mingguTersediaPada(rows, next, bulanBaru) : [];
    const mingguBaru =
      periode && mingguTersedia.includes(periode.minggu) ? periode.minggu : mingguTersedia[mingguTersedia.length - 1] ?? 0;
    simpanPeriode({ tahun: next, bulan: bulanBaru, minggu: mingguBaru });
  }

  function handleBulanChange(next: number) {
    const mingguTersedia = mingguTersediaPada(rows, periode?.tahun ?? 0, next);
    const mingguBaru =
      periode && mingguTersedia.includes(periode.minggu) ? periode.minggu : mingguTersedia[mingguTersedia.length - 1] ?? 0;
    simpanPeriode({ tahun: periode?.tahun ?? 0, bulan: next, minggu: mingguBaru });
  }

  function handleReload() {
    setInfoBaru(null);
    void muatData("manual");
  }

  const tahunOptions = useMemo(
    () => [...new Set(rows.map((r) => r.tahun))].sort((a, b) => b - a),
    [rows],
  );
  const bulanOptions = useMemo(
    () => [...new Set(rows.filter((r) => r.tahun === periode?.tahun).map((r) => r.bulan))].sort((a, b) => a - b),
    [rows, periode],
  );
  const mingguOptions = useMemo(() => {
    if (!periode) return [];
    return mingguTersediaPada(rows, periode.tahun, periode.bulan);
  }, [rows, periode]);
  const selectedRow = detail?.row ?? null;

  const currentDraf = selectedRow ? buildDraf(selectedRow) : detailError ? "Gagal memuat detail rekap." : drafKosong;

  function handleCopyTeksLink() {
    navigator.clipboard?.writeText(`${currentDraf}\n\nLink Dashboard Publik: ${dashboardLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendGrafik() {
    setSendingGrafik(true);
    setTimeout(() => setSendingGrafik(false), 2500);
  }

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {/* Breadcrumb + badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Modul Otomasi Siaran V4
        </span>
        <span className="text-gray-300">•</span>
        <span className="text-sm text-gray-400 font-mono">KEMENDAGRI-IPH-BATU-2026-W16</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-0.5">
            Generator Siaran Pers &amp; Ringkasan Eksekutif TPID
          </h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Sintesis otomatis matriks IPH dan fluktuasi komoditas pangan menjadi draf laporan
            resmi pimpinan daerah dan siaran pers Kemendagri.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-wrap items-end gap-3">
        {loading && rows.length === 0 ? (
          <span className="text-xs text-gray-400 py-1.5">Memuat data rekap...</span>
        ) : rows.length === 0 ? (
          <span className="text-xs text-gray-400 py-1.5">Belum ada data rekap IPH.</span>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <label htmlFor="filterTahun" className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Tahun Anggaran</label>
              <div className="relative">
                <select
                  id="filterTahun"
                  value={periode?.tahun ?? ""}
                  onChange={(e) => handleTahunChange(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {tahunOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label htmlFor="filterBulan" className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Bulan Pelaporan</label>
              <div className="relative">
                <select
                  id="filterBulan"
                  value={periode?.bulan ?? ""}
                  onChange={(e) => handleBulanChange(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {bulanOptions.map((b) => (
                    <option key={b} value={b}>{BULAN[b - 1]}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <label htmlFor="filterMinggu" className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Pekan Evaluasi IPH</label>
              <div className="relative">
                <select
                  id="filterMinggu"
                  value={periode?.minggu ?? ""}
                  onChange={(e) => simpanPeriode({ tahun: periode!.tahun, bulan: periode!.bulan, minggu: Number(e.target.value) })}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  {mingguOptions.map((m) => {
                    const row = rows.find(
                      (r) => r.tahun === periode?.tahun && r.bulan === periode?.bulan && r.mingguIndeks === m,
                    );
                    return (
                      <option key={m} value={m}>
                        {`Minggu ${ROMAWI[m - 1] ?? m} (${row ? `${row.cutoffStart} – ${row.cutoffEnd}` : ""})`}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {loadError && <span className="text-xs text-red-600">{loadError}</span>}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={10} />
            {menyegarkan
              ? "Memeriksa data baru..."
              : terakhirMuat
                ? `Terakhir dimuat ${hariJam(terakhirMuat)}`
                : "Belum dimuat"}
          </span>
          <button
            onClick={handleReload}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Memuat Data..." : "Sinkronkan Ulang Data IPH"}
          </button>
        </div>
      </div>

      {infoBaru && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-3 py-2">
          <Bell size={12} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{infoBaru}</span>
          <button onClick={() => setInfoBaru(null)} className="text-amber-700 hover:text-amber-900 font-semibold">
            Tutup
          </button>
        </div>
      )}

      {/* Main 2-col */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 items-start">

        {/* Left: draf */}
        <div className="space-y-3">
          {/* Draf header */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <FileIconSVG />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Draf Siaran Resmi &amp; Notulensi Otomatis</div>
                  <div className="text-xs text-gray-400">Dokumen Terenkripsi • Standar Format Ditjen Bina Bangda</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <TrendingDown size={9} />
                  {detailLoading
                    ? "Memuat..."
                    : selectedRow
                      ? `IPH: ${selectedRow.nilaiIPH > 0 ? "+" : ""}${selectedRow.nilaiIPH.toFixed(2)}% (${STATUS_IPH[selectedRow.statusIPH] ?? selectedRow.statusIPH})`
                      : "Belum ada data"}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={9} />
                  {(() => {
                    const baris = rows.find(
                      (r) =>
                        periode &&
                        r.tahun === periode.tahun &&
                        r.bulan === periode.bulan &&
                        r.mingguIndeks === periode.minggu,
                    );
                    return baris ? `Periode ${baris.cutoffStart} – ${baris.cutoffEnd}` : "—";
                  })()}
                </span>
              </div>
            </div>

            {/* Tab nav */}
            <div className="flex items-center gap-0 border-b border-gray-100 px-4" />

            {/* Draf content */}
            <div className="p-4">
              <pre className="text-sm text-gray-700 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-72 overflow-y-auto">
                {currentDraf}
              </pre>
            </div>

            {/* Action bar */}
            <div className="px-4 pb-4 space-y-2">
              {/* Row 1: kirim via WA + salin */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSendGrafik}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sendingGrafik
                      ? "bg-purple-400 text-white cursor-wait"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <Link2 size={12} />
                  {sendingGrafik
                    ? "Membuat Link..."
                    : "Kirim Link Dashboard + Teks via WA"}
                </button>
                <button
                  onClick={handleCopyTeksLink}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Copy size={12} />
                  {copied ? "Teks & Link Tersalin!" : "Salin Teks & Link"}
                </button>
              </div>

              {/* Row 2: edit manual */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <Pencil size={11} />
                  Edit Manual
                </button>
              </div>

              {/* Hint */}
              <p className="text-xs text-gray-400">
                "Salin Teks &amp; Link" menyalin draf{" "}
                <strong>Bahasa Resmi</strong> beserta link{" "}
                <span className="font-mono text-gray-500 break-all">{dashboardLink}</span> ke
                clipboard. Link dibuka sebagai dashboard publik — tampilannya sama
                seperti yang dilihat masyarakat.
              </p>
            </div>

            {/* Footer note */}
            <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-gray-50 pt-3">
              <span className="text-xs text-gray-400">
                Draf, belum dikirim
              </span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Daftar Penerima — collapsible */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPenerima((p) => !p)}
              className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-900">Daftar Penerima Siaran Cepat</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${showPenerima ? "rotate-180" : ""}`}
              />
            </button>
            {showPenerima && (
              <div className="border-t border-gray-100">
                {penerimaSiaran.map((p) => (
                  <div key={p.name} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${p.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.jabatan}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.status === "siap" ? "bg-emerald-500" : "bg-purple-500"}`} />
                      <span className={`text-xs font-semibold ${p.status === "siap" ? "text-emerald-600" : "text-purple-600"}`}>
                        {p.status === "siap" ? "Siap" : "Terhubung"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Tiny SVG icon ────────────────────────────────────────────────────────────

function FileIconSVG() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1H2C1.45 1 1 1.45 1 2v10c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V5L7 1z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 1v4h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}