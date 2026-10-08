import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart2,
  AlertCircle,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendPoint {
  label: string;
  iph: number;
  penutupan?: boolean;
}

interface WeeklyRow {
  minggu: string;
  iph: number;
  status: "waspada" | "stabil" | "deflasi";
  pemicu: string;
  highlighted?: boolean;
}

interface CommodityShare {
  name: string;
  count: number;
  color: string;
}

interface SummaryTrendPoint {
  tahun: number;
  bulan: number;
  mingguIndeks: number;
  iph: number;
  status: string;
  pemicu: string | null;
  penutupan: boolean;
}

interface SummaryResp {
  trend: SummaryTrendPoint[];
  weekly: { tahun: number; data: Record<string, number | null> }[];
  frequency: { tahun: number; items: { name: string; count: number }[] }[];
  latest: SummaryTrendPoint | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const ROMAWI = ["I", "II", "III", "IV", "V"];
const PALETTE = ["#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value?: number | string | null;
  name?: string | number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white text-gray-900 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-200 space-y-0.5">
      <div className="font-bold text-gray-500 mb-0.5">{label}</div>
      {payload.map((item, i) => {
        const raw = item.value;
        const val = typeof raw === "number" ? raw : 0;
        const isDeflasi = val < 0;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-0.5 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">
              {typeof item.name === "string" ? item.name.replace(" IPH", "") : item.name}
            </span>
            <span className={`font-black ${isDeflasi ? "text-emerald-600" : "text-amber-600"}`}>
              {val > 0 ? "+" : ""}
              {val.toFixed(2)}% {isDeflasi ? "Deflasi" : "Inflasi"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status badging ───────────────────────────────────────────────────────────

type WeeklyStatus = WeeklyRow["status"];

interface StatusChipConfig {
  label: string;
  cls: string;
}

const weeklyStatusMap: Record<WeeklyStatus, StatusChipConfig> = {
  waspada:  { label: "Waspada Naik",  cls: "bg-amber-100 text-amber-700"    },
  stabil:   { label: "Stabil Netral", cls: "bg-gray-100 text-gray-600"      },
  deflasi:  { label: "Deflasi Sehat", cls: "bg-emerald-100 text-emerald-700" },
};

function WeeklyStatusBadge({ status }: { status: WeeklyStatus }) {
  const { label, cls } = weeklyStatusMap[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  );
}

function statusFromIph(iph: number): WeeklyStatus {
  if (iph < 0) return "deflasi";
  if (iph > 0.5) return "waspada";
  return "stabil";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VisualisasiTren() {
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [error, setError] = useState("");
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [showOnlyPenutupan, setShowOnlyPenutupan] = useState(false);
  const [showRincianMingguan, setShowRincianMingguan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SummaryResp>("/rekap/summary")
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        const years = [...new Set(data.trend.map((t) => t.tahun))].sort((a, b) => b - a).map(String);
        if (years.length) setSelectedYears([String(data.latest?.tahun ?? years[0])]);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat data visualisasi.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = summary?.latest ?? null;
  const latestYear = latest?.tahun ?? null;

  const years = useMemo<string[]>(
    () =>
      [...new Set((summary?.trend ?? []).map((t) => t.tahun))].sort((a, b) => b - a).map(String),
    [summary]
  );

  const trendByYear: Record<string, TrendPoint[]> = {};
  for (const t of summary?.trend ?? []) {
    (trendByYear[String(t.tahun)] ??= []).push({
      label: `M${t.mingguIndeks} ${BULAN_SINGKAT[t.bulan - 1]}`,
      iph: t.iph,
      penutupan: t.penutupan,
    });
  }

  const colorOf = (y: string) => PALETTE[Math.max(0, years.indexOf(y)) % PALETTE.length];

  // Satu datasetmerged dengan satu kategori X bersama, supaya tiap tahun
  // duduk di posisi yang sama dan tidak saling geser.
  const mergedData = useMemo(() => {
    const perYear: Record<string, Map<string, number>> = {};
    for (const t of summary?.trend ?? []) {
      const key = String(t.tahun);
      const label = `M${t.mingguIndeks} ${BULAN_SINGKAT[t.bulan - 1]}`;
      if (showOnlyPenutupan && !t.penutupan) continue;
      (perYear[key] ??= new Map()).set(label, t.iph);
    }

    const order = new Map<string, number>();
    for (const t of summary?.trend ?? []) {
      if (showOnlyPenutupan && !t.penutupan) continue;
      order.set(`M${t.mingguIndeks} ${BULAN_SINGKAT[t.bulan - 1]}`, t.bulan * 10 + t.mingguIndeks);
    }

    return [...order.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([label]) => {
        const row: Record<string, string | number | null> = { label };
        for (const y of years) row[y] = perYear[y]?.get(label) ?? null;
        return row;
      });
  }, [summary, years, showOnlyPenutupan]);

  // Sumbu Y mengikuti data tahun yang dipilih, selalu menyertakan garis 0 dan
  // ambang +1.50% supaya tidak ada garis yang terpotong.
  const yDomain = useMemo<[number, number]>(() => {
    const values = mergedData.flatMap((row) =>
      selectedYears.map((y) => row[y]).filter((v): v is number => typeof v === "number")
    );
    if (values.length === 0) return [-1, 1];
    const max = Math.max(...values, 1.5);
    const min = Math.min(...values, 0);
    const pad = (max - min) * 0.12 || 0.25;
    return [Number((min - pad).toFixed(2)), Number((max + pad).toFixed(2))];
  }, [mergedData, selectedYears]);

  const toggleYear = (y: string) => {
    setSelectedYears((prev) => {
      if (prev.includes(y)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== y);
      }
      return [...prev, y];
    });
  };

  const latestLabel = latest
    ? `M${latest.mingguIndeks} ${BULAN_SINGKAT[latest.bulan - 1]}`
    : "Belum tersedia";

  const matrixRows: WeeklyRow[] = (summary?.trend ?? [])
    .filter((t) => latest && t.tahun === latest.tahun && t.bulan === latest.bulan)
    .map((t) => ({
      minggu: `Minggu ${ROMAWI[t.mingguIndeks - 1]} ${BULAN[t.bulan - 1]}`,
      iph: t.iph,
      status: statusFromIph(t.iph),
      pemicu: t.pemicu ?? "Belum tersedia",
      highlighted: t.mingguIndeks === latest?.mingguIndeks,
    }));

  const latestYearItems = summary?.frequency.find((f) => String(f.tahun) === String(latestYear))?.items ?? [];
  const shares: CommodityShare[] = latestYearItems.slice(0, 6).map((it, i) => ({
    name: it.name,
    count: it.count,
    color: PALETTE[i % PALETTE.length],
  }));

  const yearPoints = latestYear ? trendByYear[String(latestYear)] ?? [] : [];
  const avg4 = yearPoints.slice(-4).length
    ? yearPoints.slice(-4).reduce((s, p) => s + p.iph, 0) / Math.min(4, yearPoints.slice(-4).length)
    : 0;
  const maxPt = yearPoints.length ? yearPoints.reduce((a, b) => (b.iph > a.iph ? b : a), yearPoints[0]) : null;
  const peak = maxPt?.iph ?? 0;

  const stats: { label: string; value: string; sub?: string; color: string }[] = [
    {
      label: `IPH ${latestLabel}`,
      value: `${latest && latest.iph > 0 ? "+" : ""}${(latest?.iph ?? 0).toFixed(2)}%`,
      sub: latest ? (latest.iph < 0 ? "Deflasi" : latest.iph >= 1 ? "Perlu Intervensi" : "Inflasi Ringan") : undefined,
      color: latest && latest.iph < 0 ? "text-emerald-600" : latest && latest.iph >= 1 ? "text-red-600" : "text-gray-900",
    },
    { label: "Rata-rata 4 Minggu Terakhir", value: `${avg4 > 0 ? "+" : ""}${avg4.toFixed(2)}%`, color: "text-gray-900" },
    { label: "Puncak Tertinggi", value: `${peak > 0 ? "+" : ""}${peak.toFixed(2)}%`, sub: maxPt ? `(${maxPt.label})` : undefined, color: "text-amber-600" },
    { label: "Stabilitas Pasar", value: peak < 1 ? "Terkendali" : "Waspada", sub: `(${yearPoints.length} pekan)`, color: peak < 1 ? "text-emerald-600" : "text-red-600" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-8 text-sm text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Page header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
          <span className="text-emerald-600 font-semibold">Periode Evaluasi {latestYear ?? "belum tersedia"}</span>
          <span className="text-gray-300">•</span>
          <span>
            Periode terbaru:{" "}
            {latest
              ? `Minggu ${ROMAWI[latest.mingguIndeks - 1]} ${BULAN[latest.bulan - 1]} ${latest.tahun}`
              : "Belum tersedia"}
          </span>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-0.5">
              Tren IPH Kota Batu
            </h1>
            <p className="text-xs text-gray-500">
              Bandingkan perkembangan IPH antarperiode dan lihat komoditas pemicunya.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex-shrink-0 md:self-start">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                Status IPH terbaru
              </div>
              <div className="text-sm font-bold text-emerald-700">
                {latest ? (latest.iph < 0 ? "Deflasi Terkendali" : latest.iph < 1 ? "Terkendali" : "Waspada") : "Belum tersedia"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => toggleYear(y)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                selectedYears.includes(y)
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {y === String(latestYear) ? `${y} Aktif` : y}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">Pilih tahun (boleh lebih dari satu)</span>

        <button
          type="button"
          role="switch"
          aria-checked={showOnlyPenutupan}
          onClick={() => setShowOnlyPenutupan((p) => !p)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span
            className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 flex-shrink-0 ${
              showOnlyPenutupan ? "bg-emerald-600 justify-end" : "bg-gray-300 justify-start"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow transition-transform" />
          </span>
          <span className="text-xs text-gray-500">Tampilkan hanya minggu penutupan</span>
        </button>

      </div>

      {/* Info banner */}
      <div className="mx-4 sm:mx-6 mt-4 flex flex-wrap items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          <strong>Catatan Pantauan:</strong>
          {latest
            ? ` IPH terakhir tercatat ${latest.iph > 0 ? "+" : ""}${latest.iph.toFixed(2)}% (${latest.pemicu ? "pemicu utama " + latest.pemicu : "tanpa pemicu utama"}).`
            : " Belum ada data pemantauan."}
        </span>
      </div>

      {/* Chart card */}
      <div className="mx-4 sm:mx-6 mt-4 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900 mb-0.5">
              Perkembangan IPH mingguan
            </h2>
            <p className="text-sm text-gray-500">
              Bandingkan nilai IPH mingguan pada tahun yang dipilih. Garis nol menandai tidak adanya perubahan.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0 flex-wrap">
            {selectedYears.map((y) => (
              <div key={y} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor: colorOf(y) }} />
                <span>Tahun {y}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t-2 border-dashed border-red-400" />
              <span>Batas waspada pada grafik (+1,50%)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Zona Aman Terkendali</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="overflow-x-auto pb-1">
        <div className="min-w-[820px] h-96 sm:h-[28rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                type="category"
                allowDuplicatedCategory={false}
                interval="preserveStartEnd"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
                domain={yDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={0}
                stroke="#d1d5db"
                strokeWidth={1}
                label={
                  window.innerWidth < 640
                    ? { value: "0.00%", fill: "#6b7280", fontSize: 9, position: "insideBottomLeft" }
                    : {
                        value: "0.00% Titik Keseimbangan Normal",
                        fill: "#6b7280",
                        fontSize: 10,
                        position: "insideBottomLeft",
                      }
                }
              />
              <ReferenceLine
                y={1.5}
                stroke="#ef4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={
                  window.innerWidth < 640
                    ? { value: "+1.50%", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }
                    : {
                        value: "Ambang Waspada Kemendagri (+1.50%)",
                        fill: "#ef4444",
                        fontSize: 9,
                        position: "insideTopRight",
                      }
                }
              />
              {selectedYears.map((y) => (
                <Line
                  key={y}
                  type="monotone"
                  dataKey={y}
                  name={`${y} IPH`}
                  connectNulls
                  stroke={colorOf(y)}
                  strokeWidth={2.5}
                  dot={{ fill: colorOf(y), r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-100">
          {stats.map(({ label, value, sub, color }) => (
            <div key={label} className="text-center min-w-0">
              <div className="text-[11px] sm:text-xs text-gray-500 mb-1 uppercase tracking-wide leading-tight">{label}</div>
              <div className={`text-base sm:text-lg font-black leading-tight ${color}`}>
                {value}
                {sub && <span className="text-[10px] sm:text-xs font-normal text-gray-400 ml-1">{sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-4 sm:mx-6 mt-4 mb-6">
        {/* Matriks Evaluasi Mingguan */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Matriks Evaluasi Mingguan</h3>
              <p className="text-xs text-gray-500">
                Pergerakan IPH{" "}
                {latest ? `${BULAN[latest.bulan - 1]} ${latest.tahun}` : "periode yang tersedia"} dan komoditas pemicu
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              {latest ? `${BULAN_SINGKAT[latest.bulan - 1]} ${latest.tahun}` : "Belum tersedia"}
            </span>
          </div>

          <div className="overflow-x-auto -mx-4 px-4" tabIndex={0} role="region" aria-label="Tabel evaluasi IPH mingguan, geser untuk melihat kolom lainnya">
            <table className="w-full min-w-[520px]">
              <thead>
              <tr className="border-b border-gray-200">
                {(["Minggu", "IPH", "Status", "Pemicu Utama"] as const).map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-normal text-gray-500 uppercase pb-2 pr-3"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row: WeeklyRow) => (
                <tr
                  key={row.minggu}
                  className={`${row.highlighted ? "bg-emerald-50" : ""}`}
                >
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      {row.highlighted && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs font-semibold ${
                          row.highlighted ? "text-emerald-700" : "text-gray-700"
                        }`}
                      >
                        {row.minggu}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`text-xs font-black ${
                        row.iph < 0
                          ? "text-emerald-600"
                          : row.iph > 0.5
                          ? "text-amber-600"
                          : "text-gray-800"
                      }`}
                    >
                      {row.iph > 0 ? "+" : ""}
                      {row.iph.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <WeeklyStatusBadge status={row.status} />
                  </td>
                  <td className="py-2">
                    <span className="text-xs text-gray-500">{row.pemicu}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {summary ? `${summary.trend.length} pekan tercatat` : "Belum tersedia"} • {summary?.weekly.length ?? 0} tahun
            </span>
            <button
              onClick={() => setShowRincianMingguan((v) => !v)}
              className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700"
            >
              {showRincianMingguan ? "Tutup Rincian" : "Buka Rincian Lengkap"}
              <ChevronRight size={10} className={`transition-transform ${showRincianMingguan ? "rotate-90" : ""}`} />
            </button>
          </div>

          {/* Flip card: rincian lengkap */}
          {showRincianMingguan && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={12} className="text-emerald-600" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Rincian Matriks Evaluasi Mingguan
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-gray-700 mb-2">
                    Andil Komoditas Pemicu ({matrixRows.length} minggu)
                  </div>
                  <div className="space-y-2.5">
                    {shares.length === 0 ? (
                      <p className="text-xs text-gray-400">Belum ada komoditas tercatat.</p>
                    ) : (
                      shares.map(({ name, count, color }) => (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 font-medium">{name}</span>
                            <span className="text-sm font-black" style={{ color }}>{count} kali</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(count / Math.max(1, ...shares.map((c) => c.count))) * 100}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-700 mb-2">Catatan Evaluasi</div>
                  <ul className="space-y-1.5">
                    {matrixRows.length === 0 ? (
                      <li className="text-xs text-gray-400">Belum ada pekan tercatat.</li>
                    ) : (
                      matrixRows.map((r) => (
                        <li key={r.minggu} className="flex items-start gap-1.5 text-xs text-gray-600 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          <span>
                            {r.minggu}: IPH {r.iph > 0 ? "+" : ""}
                            {r.iph.toFixed(2)}% (pemicu {r.pemicu || "belum tersedia"}).
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Andil Komoditas */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Andil Komoditas Terhadap Fluktuasi</h3>
              <p className="text-xs text-gray-500">
                Jumlah kemunculan sebagai pemicu utama fluktuasi harga ({latestYear ?? "periode belum tersedia"})
              </p>
            </div>
            <BarChart3 size={16} className="text-gray-500" />
          </div>

          <div className="space-y-3">
            {shares.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada komoditas tercatat.</p>
            ) : (
              shares.map(({ name, count, color }: CommodityShare) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 font-medium">{name}</span>
                    <span className="text-sm font-black" style={{ color }}>
                      {count} kali
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / Math.max(1, ...shares.map((c) => c.count))) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Sumber: Rekap IPH Kota Batu (CSV)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mx-4 sm:mx-6 mb-6 py-3 border-t border-gray-200 text-center">
        <span className="text-xs text-gray-500">
          © 2026 Tim Pengendali Inflasi Daerah (TPID) Kota Batu • Badan Pusat Statistik Kota Batu
          • Dinas Koperasi, Usaha Mikro, Perindustrian dan Perdagangan Kota Batu
        </span>
      </div>
    </div>
  );
}
