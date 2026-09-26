import { useState } from "react";
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
  Share2,
  ChevronDown,
  BarChart2,
  AlertCircle,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendPoint {
  label: string;
  iph: number;
  penutupan?: boolean;
}

interface WeeklyRow {
  minggu: string;
  iph: number;
  status: "waspada" | "stabil" | "deflasi" | "proyeksi";
  pemicu: string;
  highlighted?: boolean;
  penutupan?: boolean;
}

interface CommodityShare {
  name: string;
  count: number;
  color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

type YearTabValue = "2024" | "2025" | "2026";

const trendData: TrendPoint[] = [
  { label: "M1 Mar", iph: 0.0   },
  { label: "M2 Mar", iph: 0.88  },
  { label: "M3 Mar", iph: 1.28  },
  { label: "M4 Mar", iph: 0.62, penutupan: true   },
  { label: "M1 Apr", iph: 0.48  },
  { label: "M2 Apr", iph: 0.15  },
  { label: "M3 Apr", iph: -0.42 },
];

const trendData2024: TrendPoint[] = [
  { label: "M1 Mar", iph: 0.25  },
  { label: "M2 Mar", iph: 0.55  },
  { label: "M3 Mar", iph: 0.85  },
  { label: "M4 Mar", iph: 0.40, penutupan: true   },
  { label: "M1 Apr", iph: 0.30  },
  { label: "M2 Apr", iph: 0.10  },
  { label: "M3 Apr", iph: 0.02  },
];

const trendData2025: TrendPoint[] = [
  { label: "M1 Mar", iph: 0.10  },
  { label: "M2 Mar", iph: 0.68  },
  { label: "M3 Mar", iph: 1.05  },
  { label: "M4 Mar", iph: 0.38, penutupan: true   },
  { label: "M1 Apr", iph: 0.29  },
  { label: "M2 Apr", iph: 0.17  },
  { label: "M3 Apr", iph: 0.08  },
];

const trendDataByYear: Record<YearTabValue, TrendPoint[]> = {
  "2024": trendData2024,
  "2025": trendData2025,
  "2026": trendData,
};

const yearColors: Record<YearTabValue, string> = {
  "2024": "#8b5cf6",
  "2025": "#f59e0b",
  "2026": "#10b981",
};

const weeklyRows: WeeklyRow[] = [
  { minggu: "Minggu I Apr",         iph:  0.48,  status: "waspada",  pemicu: "Daging Ayam Ras, Cabai Rawit"   },
  { minggu: "Minggu II Apr",        iph:  0.05,  status: "stabil",   pemicu: "Beras Medium, Minyakita"        },
  { minggu: "Minggu III Apr",       iph: -0.42,  status: "deflasi",  pemicu: "Bawang Merah, Telur Ayam", highlighted: true },
  { minggu: "Minggu IV Apr (Est)",  iph: -0.28,  status: "proyeksi", pemicu: "Panen Raya Hortikultura", penutupan: true  },
];

const commodityShares: CommodityShare[] = [
  { name: "Cabai Rawit Merah",           count: 11, color: "#ef4444" },
  { name: "Beras Medium (SPHP & Lokal)", count: 8,  color: "#f97316" },
  { name: "Minyak Goreng Kemasan",       count: 6,  color: "#eab308" },
  { name: "Telur Ayam Ras",              count: 5,  color: "#22c55e" },
  { name: "Bawang Merah",                count: 4,  color: "#8b5cf6" },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
// Define props manually so we don't depend on recharts internal type paths.

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

// ─── Sub-components ───────────────────────────────────────────────────────────

type WeeklyStatus = WeeklyRow["status"];

interface StatusChipConfig {
  label: string;
  cls: string;
}

const weeklyStatusMap: Record<WeeklyStatus, StatusChipConfig> = {
  waspada:  { label: "Waspada Naik",  cls: "bg-amber-100 text-amber-700"    },
  stabil:   { label: "Stabil Netral", cls: "bg-gray-100 text-gray-600"      },
  deflasi:  { label: "Deflasi Sehat", cls: "bg-emerald-100 text-emerald-700" },
  proyeksi: { label: "Proyeksi",      cls: "bg-gray-100 text-gray-400"      },
};

function WeeklyStatusBadge({ status }: { status: WeeklyStatus }) {
  const { label, cls } = weeklyStatusMap[status];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type YearTab = "2024" | "2025" | "2026";

export default function VisualisasiTren() {
  const [selectedYears, setSelectedYears] = useState<YearTab[]>(["2026"]);
  const [showOnlyPenutupan, setShowOnlyPenutupan] = useState(false);

  const years: YearTab[] = ["2024", "2025", "2026"];

  const toggleYear = (y: YearTab) => {
    setSelectedYears((prev) => {
      if (prev.includes(y)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== y);
      }
      return [...prev, y];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Page header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-1">
          <span className="text-emerald-600 font-semibold">Periode Evaluasi 2026</span>
          <span className="text-gray-300">•</span>
          <span>Terakhir diperbarui: Minggu IV April 2026, 08:30 WIB</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-0.5">
              Visualisasi Tren &amp; Analitik IPH Kota Batu
            </h1>
            <p className="text-xs text-gray-500">
              Grafik interaktif pemantauan stabilitas harga dan andil komoditas pangan Kota Batu
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex-shrink-0 md:self-start">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                Status Regional
              </div>
              <div className="text-sm font-bold text-emerald-700">Terkendali &amp; Waspada Cabai</div>
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
              {y === "2026" ? `${y} Aktif` : y}
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

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-100">
            <Share2 size={12} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-100">
            Opsi Ekspor &amp; Data
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mx-4 sm:mx-6 mt-4 flex flex-wrap items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          <strong>Catatan Pantauan:</strong> Deviasi Cabai Rawit (+7.8%) di Pasar Batu termonitor
          menjelang panen raya Pujon. Kondisi terkendali.
        </span>
        <button className="ml-auto text-sm text-amber-700 font-semibold hover:text-amber-800 flex items-center gap-0.5 flex-shrink-0">
          Detail Pantauan <ChevronRight size={11} />
        </button>
      </div>

      {/* Chart card */}
      <div className="mx-4 sm:mx-6 mt-4 bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900 mb-0.5">
              Tren Indikator Perubahan Harga (IPH) Sepanjang Periode
            </h2>
            <p className="text-sm text-gray-500">
              Pergerakan kumulatif 20 komoditas strategis Kota Batu per minggu (Baseline 0.00%)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-shrink-0 flex-wrap">
            {selectedYears.map((y) => (
              <div key={y} className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded" style={{ backgroundColor: yearColors[y] }} />
                <span>Tahun {y}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t-2 border-dashed border-red-400" />
              <span>Batas Waspada (+1.50%)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Zona Aman Terkendali</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                type="category"
                allowDuplicatedCategory={false}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
                domain={[-1.2, 2.0]}
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
                  dataKey="iph"
                  name={`${y} IPH`}
                  data={showOnlyPenutupan
                    ? trendDataByYear[y].filter((p) => p.penutupan)
                    : trendDataByYear[y]}
                  stroke={yearColors[y]}
                  strokeWidth={2.5}
                  dot={{ fill: yearColors[y], r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-100">
          {(
            [
              { label: "IPH Minggu III April", value: "-0.42%",     sub: "Deflasi Ringan",  color: "text-emerald-600" },
              { label: "Rata-rata Kuartal",    value: "+0.48%",     sub: undefined,         color: "text-gray-900"   },
              { label: "Puncak Tertinggi",     value: "+1.28%",     sub: "(M3 Mar)",        color: "text-amber-600"  },
              { label: "Stabilitas Pasar",     value: "Terkendali", sub: "(0.31)",          color: "text-emerald-600" },
            ] as const
          ).map(({ label, value, sub, color }) => (
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
                Pergerakan IPH April 2026 dan komoditas pemicu
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              April 2026
            </span>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
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
              {weeklyRows
                .filter((r) => (showOnlyPenutupan ? r.penutupan : true))
                .map((row: WeeklyRow) => (
                <tr
                  key={row.minggu}
                  className={`${row.highlighted ? "bg-emerald-50" : ""} ${
                    row.status === "proyeksi" ? "opacity-60" : ""
                  }`}
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
            <span className="text-xs text-gray-500">20 komoditas terverifikasi</span>
            <button className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:text-emerald-700">
              Buka Rincian Lengkap <ChevronRight size={10} />
            </button>
          </div>
        </div>

        {/* Andil Komoditas */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Andil Komoditas Terhadap Fluktuasi</h3>
              <p className="text-xs text-gray-500">
                Jumlah kemunculan sebagai pemicu utama fluktuasi harga (2026)
              </p>
            </div>
            <BarChart3 size={16} className="text-gray-500" />
          </div>

          <div className="space-y-3">
            {commodityShares.map(({ name, count, color }: CommodityShare) => (
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
                    style={{ width: `${(count / Math.max(...commodityShares.map((c) => c.count))) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Sumber: SP2KP Kemendag &amp; BPS</span>
            <button className="flex items-center gap-1 text-xs text-gray-500 font-semibold hover:text-gray-800">
              <BarChart2 size={10} />
              Bobot Andil
            </button>
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