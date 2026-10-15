import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  Clock,
  Bell,
} from "lucide-react";
import { api } from "../lib/api";
import { buildPublicDashboardLink } from "../lib/publicDashboard";
import RapatMessageSender from "./RapatMessageSender";
import { useAuth } from "../context/AuthContext";
import PageHeading from "./PageHeading";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const drafKosong = "Belum ada rekap untuk periode ini. Pilih tahun, bulan, dan minggu yang memiliki data untuk menyusun draf.";

function formatAndil(list: AndilItem[]): string[] {
  return list.map((d) => `   - ${d.name} (${d.change > 0 ? "+" : ""}${d.change.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} persen poin)`);
}

function formatIph(nilai: number): string {
  return `${nilai > 0 ? "+" : ""}${nilai.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
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
  const nilai = formatIph(row.nilaiIPH);
  const baris: string[] = [
    "Ringkasan perkembangan harga Kota Batu",
    "",
    "Yth. Bapak/Ibu peserta rapat TPID Kota Batu,",
    "Berikut ringkasan Indeks Perkembangan Harga (IPH)",
    `Kota Batu pada ${minggu}:`,
    "",
    `1. Angka IPH Gabungan Kota Batu tercatat sebesar ${nilai}`,
    `   (kategori ${STATUS_IPH[row.statusIPH] ?? row.statusIPH}).`,
  ];

  let nomor = 2;
  if (row.deflasi.length > 0) {
    baris.push("", `${nomor++}. Komoditas utama yang memberikan andil penurunan harga:`, ...formatAndil(row.deflasi));
  }
  if (row.inflasi.length > 0) {
    baris.push("", `${nomor++}. Komoditas yang memberikan andil kenaikan harga:`, ...formatAndil(row.inflasi));
  }
  if (row.fluktuasi) {
    baris.push("", `${nomor}. Komoditas berfluktuasi:`, ...formatAndil([row.fluktuasi]));
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
  const [copied, setCopied]             = useState(false);
  const [copyError, setCopyError] = useState("");
  const { user } = useAuth();

  // Penyuntingan manual draf. drafKustom === null → pakai draf otomatis.
  const [drafKustom, setDrafKustom] = useState<string | null>(null);
  const [mengedit, setMengedit] = useState(false);
  const [drafEdit, setDrafEdit] = useState("");

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
          setDrafKustom(null);
          setMengedit(false);
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
  const dashboardLink = buildPublicDashboardLink(periode ?? undefined);

  const currentDraf = selectedRow ? buildDraf(selectedRow) : detailError ? "Gagal memuat detail rekap." : drafKosong;
  const drafEfektif = drafKustom ?? currentDraf;

  const pesanSiaran = useMemo(
    () => `${drafEfektif}\n\nLink Dashboard Publik: ${dashboardLink}`,
    [drafEfektif, dashboardLink],
  );

  // Tanpa baris rekap terpilih, isinya cuma placeholder atau pesan error.
  // Mengirimnya ke kontak WhatsApp akan menyakitkan.
  const drafSiap = selectedRow !== null && !detailLoading && !detailError && !mengedit;

  function mulaiEdit() {
    setDrafEdit(drafKustom ?? currentDraf);
    setMengedit(true);
  }

  function simpanEdit() {
    setDrafKustom(drafEdit);
    setMengedit(false);
  }

  function batalEdit() {
    setMengedit(false);
  }

  function resetKustom() {
    setDrafKustom(null);
    setMengedit(false);
  }

  async function handleCopyTeksLink() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(pesanSiaran);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError("Teks belum tersalin. Izinkan akses clipboard atau pilih dan salin draf secara manual.");
    }
  }

  return (
    <div className="siaran-layout space-y-6 w-full">
      <PageHeading title="Analisis teks siaran" description="Susun ringkasan harga mingguan dan kirim bersama dashboard kepada peserta rapat." />

      {/* Filter toolbar */}
      <div className="period-toolbar">
        {loading && rows.length === 0 ? (
          <span className="text-xs text-gray-400 py-1.5">Memuat data rekap...</span>
        ) : rows.length === 0 ? (
          <span className="text-xs text-gray-400 py-1.5">Belum ada data rekap IPH.</span>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              <label htmlFor="filterTahun">Tahun data</label>
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
              <label htmlFor="filterBulan">Bulan</label>
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
              <label htmlFor="filterMinggu">Minggu</label>
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

        <div className="ml-auto flex flex-wrap items-center gap-3">
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
            {loading ? "Memuat data…" : "Muat ulang data"}
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

      <div className={user?.role === "admin" ? "siaran-workbench" : ""}>
        {user?.role === "admin" && <RapatMessageSender broadcast={{ rekapId: selectedRow?.id ?? "", text: drafEfektif, periodLabel: selectedRow?.periode ?? "periode terpilih", ready: drafSiap }} />}

        {/* Left: draf */}
        <div className="space-y-3">
          {/* Draf header */}
          <div className="siaran-draft">
            <header className="siaran-draft-heading">
              <div className="flex items-center gap-2">
                <div>
                  <h2 className="text-base font-medium text-gray-900">Draf ringkasan harga</h2>
                  <p className="text-xs text-gray-500 mt-1">{selectedRow?.periode ?? "Pilih periode data"}</p>
                </div>
              </div>
              <div className="siaran-draft-meta">
                <span className="text-xs font-medium text-gray-600">
                  {detailLoading
                    ? "Memuat..."
                    : selectedRow
                      ? `IPH ${selectedRow.nilaiIPH > 0 ? "+" : ""}${selectedRow.nilaiIPH.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% · ${STATUS_IPH[selectedRow.statusIPH] ?? selectedRow.statusIPH}`
                      : "Belum ada data"}
                </span>
                {mengedit && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Menyunting…
                  </span>
                )}
                {drafKustom !== null && !mengedit && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Disunting manual
                  </span>
                )}
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
                    return baris ? `Periode ${baris.cutoffStart} sampai ${baris.cutoffEnd}` : "Periode belum tersedia";
                  })()}
                </span>
              </div>
            </header>
            <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
              {mengedit ? <><button onClick={simpanEdit} className="primary-action">Simpan Perubahan</button><button onClick={batalEdit} className="secondary-action">Batal</button></> : <><button onClick={mulaiEdit} disabled={!drafSiap} className="secondary-action disabled:opacity-50">Edit Draf</button><button onClick={() => void handleCopyTeksLink()} disabled={!drafSiap} className="text-action disabled:opacity-50">{copied ? "Teks & Link Tersalin!" : "Salin Teks & Link"}</button>{drafKustom !== null && <button onClick={resetKustom} className="text-action">Reset Draf Otomatis</button>}</>}
            </div>
            {copyError && <p role="alert" className="px-5 pt-4 text-xs text-red-600">{copyError}</p>}

            {/* Draf content */}
            <div>
              {mengedit ? (
                <div className="p-5 space-y-2">
                  <textarea
                    value={drafEdit}
                    onChange={(e) => setDrafEdit(e.target.value)}
                    aria-label="Sunting draf siaran"
                    className="w-full min-h-48 resize-y font-mono text-sm leading-relaxed text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <span>Draf masih bisa disesuaikan sampai tombol Simpan ditekan.</span>
                    <span>{drafEdit.length} karakter</span>
                  </div>
                </div>
              ) : (
                <pre>
                  {drafEfektif}
                </pre>
              )}
            </div>

            <div className="px-5 pb-5">
              <p className="text-xs text-gray-400">
                Salin draf beserta <a href={dashboardLink} target="_blank" rel="noopener noreferrer" className="underline text-emerald-700">link dashboard periode ini</a>, atau edit teksnya sebelum dikirim. Perubahan draf tidak disimpan jika periode diganti.
              </p>
            </div>

            {/* Footer note */}
            <footer>
              <span className="text-xs text-gray-400">
                Status pengiriman dapat dilihat di Monitoring Rapat.
              </span>
            </footer>
          </div>
      </div>
      </div>
    </div>
  );
}
