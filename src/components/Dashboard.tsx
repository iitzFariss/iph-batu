import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
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
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
} from "lucide-react";
import { weeklyColumns, type WeeklyRow } from "../data/weeklyData";
import WeeklyDataTable from "./WeeklyDataTable";
import { api } from "../lib/api";

// ─── types ───────────────────────────────────────────────────────────────────

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"] as const;
const ROMAWI = ["I", "II", "III", "IV", "V"] as const;

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
  latestDetails: { name: string; nilai: number; isFluktuasi: boolean }[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

type CommodityStatus = "deflasi" | "waspada" | "terkendali" | "stabil";

interface StatusConfig {
  label: string;
  cls: string;
}

const statusMap: Record<CommodityStatus, StatusConfig> = {
  deflasi:    { label: "Deflasi",    cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  waspada:    { label: "Waspada",    cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  terkendali: { label: "Terkendali", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  stabil:     { label: "Stabil",     cls: "bg-gray-100 text-gray-600 border border-gray-200" },
};

function StatusBadge({ status }: { status: CommodityStatus }) {
  const { label, cls } = statusMap[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {status === "terkendali" && <TrendingDown size={9} className="mr-1" />}
      {status === "waspada"    && <TrendingUp   size={9} className="mr-1" />}
      {label}
    </span>
  );
}

// ─── sub-sections ────────────────────────────────────────────────────────────

function HeroMetrics({ latest }: { latest: SummaryTrendPoint | null }) {
  const periodeLabel = latest
    ? `Minggu ${ROMAWI[latest.mingguIndeks - 1] ?? latest.mingguIndeks} ${BULAN_SINGKAT[latest.bulan - 1]} ${latest.tahun}`
    : "Belum ada data";
  return (
    <div className="dashboard-overview bg-white border border-gray-100 rounded-xl p-5 mb-4">
      <div className="overview-period">
        <span>Periode data</span>
        <strong>{periodeLabel}</strong>
      </div>
      <div className="overview-heading">
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
          Ringkasan harga Kota Batu
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xl">
          Rekap perubahan harga mingguan dan andil komoditas Pasar Besar Kota Batu.
        </p>

      </div>
      <div className="overview-value">
        <p>IPH pekan terbaru</p>
        <strong>{latest ? `${latest.iph > 0 ? "+" : ""}${latest.iph.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "Belum tersedia"}</strong>
      </div>
    </div>
  );
}

function TrendChart({ points, year }: { points: { label: string; iph: number }[]; year: number | null }) {
  const maxAbs = Math.max(1, ...points.map((p) => Math.abs(p.iph))) * 1.2;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Perkembangan IPH mingguan
          </h2>
          <p className="text-sm text-gray-400">
            Indeks Perkembangan Harga Kota Batu. Garis nol menandai tidak adanya perubahan.
          </p>
        </div>
        {year !== null && (
          <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1 flex-shrink-0">
            {year}
          </span>
        )}
      </div>

      <div className="overflow-x-auto mt-3 pb-1">
        <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              minTickGap={40}
              interval="preserveStartEnd"
              tick={{ fill: "#9ca3af", fontSize: 15 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`}
              domain={[-maxAbs, maxAbs]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value) => [
                `${(value as number) > 0 ? "+" : ""}${(value as number).toFixed(2)}%`,
                "IPH",
              ]}
            />
            <ReferenceLine
              y={0}
              stroke="#d1d5db"
              strokeWidth={1}
              label={{
                value: "0.00%",
                fill: "#6b7280",
                fontSize: 10,
                position: "insideTopLeft",
              }}
            />
            <Line
              type="monotone"
              dataKey="iph"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ fill: "#10b981", r: 3, strokeWidth: 1, stroke: "#fff" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function FrequencyChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Frekuensi kemunculan komoditas</h2>
          <p className="text-sm text-gray-400">
            Jumlah kemunculan komoditas dalam catatan andil dan fluktuasi harga pada tahun berjalan.
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1 flex-shrink-0">
          Tahun berjalan
        </span>
      </div>

      <div className="h-64 mt-3">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Belum ada komoditas tercatat.
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 9 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={46}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "#f9fafb" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value) => [`${value} kali`, "Kemunculan"]}
            />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

interface CommodityRow {
  id: string;
  name: string;
  andil: number;
  status: CommodityStatus;
  isFluktuasi: boolean;
}

function CommodityTable({
  details,
  latest,
}: {
  details: { name: string; nilai: number; isFluktuasi: boolean }[];
  latest: SummaryTrendPoint | null;
}) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo<CommodityRow[]>(() => {
    const andil = details
      .filter((d) => !d.isFluktuasi)
      .sort((a, b) => b.nilai - a.nilai)
      .map<CommodityRow>((d, i) => ({
        id: `a-${i}-${d.name}`,
        name: d.name,
        andil: Number(d.nilai.toFixed(2)),
        status: d.nilai > 0.2 ? "waspada" : d.nilai < -0.2 ? "deflasi" : "terkendali",
        isFluktuasi: false,
      }));

    const fluktuasi = details
      .filter((d) => d.isFluktuasi)
      .sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai))
      .map<CommodityRow>((d, i) => ({
        id: `f-${i}-${d.name}`,
        name: d.name,
        andil: Number(d.nilai.toFixed(2)),
        status: Math.abs(d.nilai) < 0.01 ? "stabil" : "waspada",
        isFluktuasi: true,
      }));

    return [...andil, ...fluktuasi];
  }, [details]);

  const visible = showAll ? sorted : sorted.slice(0, 3);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Andil komoditas pekan terbaru</h2>
          <p className="text-sm text-gray-400">
            {showAll
              ? "Seluruh komoditas yang tercatat pada periode ini."
              : "Tiga komoditas dengan andil terbesar pada periode ini."}
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1 flex-shrink-0">
          {latest
            ? `Minggu ${ROMAWI[latest.mingguIndeks - 1]} ${BULAN_SINGKAT[latest.bulan - 1]} ${latest.tahun}`
            : "Periode terbaru"}
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
      <table className="commodity-table w-full mt-3 min-w-[560px]">
        <thead>
          <tr className="border-b border-gray-100">
            {(["Komoditas", "Andil (persen poin)", "Status"] as const).map(
              (col, i) => (
                <th
                  key={col}
                  className={`text-xs font-normal text-gray-400 uppercase tracking-wide pb-2 ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-xs text-gray-400 text-center">
                Belum ada data andil untuk periode ini.
              </td>
            </tr>
          )}
          {visible.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">
                      {c.isFluktuasi ? "Komoditas fluktuasi" : "Andil inflasi/deflasi"}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {c.andil === 0 ? (
                    <Minus size={10} className="text-gray-400" />
                  ) : c.andil > 0 ? (
                    <TrendingUp size={10} className="text-amber-500" />
                  ) : (
                    <TrendingDown size={10} className="text-blue-500" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      c.andil > 0 ? "text-amber-600" : c.andil < 0 ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {c.andil > 0 ? "+" : ""}
                    {c.andil.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </td>
              <td className="py-2.5 text-right">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 flex-wrap gap-2">
        <span className="text-sm text-gray-400">
          Menampilkan {visible.length} dari {sorted.length} komoditas
        </span>
        {sorted.length > 3 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
          >
            {showAll ? "Tutup" : "Lihat Semua"}
            <ChevronRight size={11} className={`transition-transform ${showAll ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── main ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryResp | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get<SummaryResp>("/rekap/summary")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Gagal memuat ringkasan data.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = summary?.latest ?? null;
  // Tanpa data, jangan memaksa ke satu tahun. Anotasi eksplisit wajib: tanpa itu
  // tahunTersedia[0] bertipe `number` (noUncheckedIndexedAccess mati) sehingga
  // `?? null` dianggap mati oleh tsc dan tipe sebenarnya jadi(number, bukan
  // number | null) padahal runtime bisa null.
  const tahunTersedia = [...new Set((summary?.trend ?? []).map((t) => t.tahun))].sort((a, b) => b - a);
  const year: number | null = latest?.tahun ?? tahunTersedia[0] ?? null;
  const trendPoints = (summary?.trend ?? [])
    .filter((t) => year === null || t.tahun === year)
    .map((t) => ({ label: `${BULAN_SINGKAT[t.bulan - 1]} M${t.mingguIndeks}`, iph: t.iph }));
  const freqItems = year === null
    ? []
    : summary?.frequency.find((f) => f.tahun === year)?.items ?? [];
  const weeklyRows: WeeklyRow[] = (summary?.weekly ?? []).map((w) => ({ tahun: w.tahun, data: w.data }));

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      <HeroMetrics latest={latest} />

      <div className="space-y-4">
        {loadError ? (
          <div className="bg-white border border-red-100 rounded-xl p-10 text-center text-sm text-red-500">
            {loadError}
          </div>
        ) : !summary ? (
          <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-sm text-gray-400">
            Memuat data ringkasan…
          </div>
        ) : (
          <>
            <CommodityTable details={summary.latestDetails} latest={latest} />
            <TrendChart points={trendPoints} year={year} />
            <FrequencyChart data={freqItems} />
            <WeeklyDataTable rows={weeklyRows} columns={weeklyColumns} />
          </>
        )}
      </div>
    </div>
  );
}
