import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
} from "lucide-react";
import {
  commodities,
  commodityFrequency,
  type Commodity,
} from "../data/Mockdata";
import WeeklyDataTable from "./WeeklyDataTable";

// ─── helpers ────────────────────────────────────────────────────────────────

type CommodityStatus = Commodity["status"];

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

function ChangeCell({ change }: { change: number }) {
  if (change === 0) {
    return <span className="text-xs text-gray-500 font-medium">0.00%</span>;
  }
  const pos = change > 0;
  return (
    <span className={`text-xs font-semibold ${pos ? "text-amber-600" : "text-blue-600"}`}>
      {pos ? "+" : ""}
      {change.toFixed(2)}%
    </span>
  );
}

// ─── sub-sections ────────────────────────────────────────────────────────────

function HeroMetrics() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-sm text-gray-500">Sinkronisasi BPS • </span>
        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Minggu III April 2026
        </span>
        <span className="text-sm text-gray-500"> (Terverifikasi)</span>
      </div>

      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
          Dashboard Pengendalian Inflasi (IPH) Kota Batu
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          Pusat pemantauan kestabilan harga komoditas dan koordinasi respon cepat TPID Kota Batu.
        </p>

        <div className="flex items-center gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">
              Indeks Perkembangan Harga (IPH) Terkini
            </div>
            <span className="text-4xl font-black text-gray-900 tracking-tight">-0.42%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FrequencyChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Frekuensi Kemunculan Komoditas</h2>
          <p className="text-sm text-gray-400">
            Berapa kali komoditas muncul dalam pemantauan pekan ini (2026)
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1">
          2026
        </span>
      </div>

      <div className="h-64 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={commodityFrequency} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              interval={0}
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
      </div>
    </div>
  );
}

function CommodityTable() {
  // Hanya tampilkan 3 komoditas dengan kenaikan tertinggi
  const topRisers = [...commodities]
    .sort((a, b) => b.change - a.change)
    .slice(0, 3);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Komoditas Pangan Utama Kota Batu</h2>
          <p className="text-sm text-gray-400">
            3 komoditas dengan kenaikan tertinggi pekan ini di Pasar Besar Kota Batu
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1">
          Minggu III April 2026
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full mt-3 min-w-[560px]">
        <thead>
          <tr className="border-b border-gray-100">
            {(["Komoditas", "Perubahan (W-to-W)", "Status IPH"] as const).map(
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
          {topRisers.map((c: Commodity) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.unit}</div>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {c.change === 0 ? (
                    <Minus size={10} className="text-gray-400" />
                  ) : c.change > 0 ? (
                    <TrendingUp size={10} className="text-amber-500" />
                  ) : (
                    <TrendingDown size={10} className="text-blue-500" />
                  )}
                  <ChangeCell change={c.change} />
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
        <span className="text-sm text-gray-400">Menampilkan 3 kenaikan tertinggi dari 20 komoditas strategis</span>
        <button className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700">
          Lihat Tabel Lengkap Komoditas
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── main ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      <HeroMetrics />

      <div className="space-y-4">
        <CommodityTable />
        <FrequencyChart />
        <WeeklyDataTable />
      </div>
    </div>
  );
}