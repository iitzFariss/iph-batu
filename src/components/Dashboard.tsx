import type { ReactNode } from "react";
import {
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
  Calendar,
  Clock,
  FileText,
  Cpu,
  CheckCircle2,
  Shield,
  ArrowRight,
} from "lucide-react";
import {
  commodities,
  activityLogs,
  agendaItems,
  type Commodity,
  type ActivityLog,
  type AgendaItem,
} from "../data/Mockdata";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

type CommodityStatus = Commodity["status"];
type ActivityStatus = ActivityLog["status"];

interface StatusConfig {
  label: string;
  cls: string;
}

interface VerifConfig {
  label: string;
  cls: string;
  icon: ReactNode;
}

const statusMap: Record<CommodityStatus, StatusConfig> = {
  deflasi:    { label: "Deflasi",    cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  waspada:    { label: "Waspada",    cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  terkendali: { label: "Terkendali", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  stabil:     { label: "Stabil",     cls: "bg-gray-100 text-gray-600 border border-gray-200" },
};

const verifMap: Record<ActivityStatus, VerifConfig> = {
  "terverifikasi-bps":  { label: "Terverifikasi BPS",   cls: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={10} /> },
  "disetujui-asisten":  { label: "Disetujui Asisten II", cls: "bg-blue-50 text-blue-700",       icon: <Shield size={10} /> },
  "terverifikasi":      { label: "Terverifikasi",        cls: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={10} /> },
  "terproses-ai":       { label: "Terproses AI",         cls: "bg-purple-50 text-purple-700",   icon: <Cpu size={10} /> },
};

function StatusBadge({ status }: { status: CommodityStatus }) {
  const { label, cls } = statusMap[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
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

function VerifBadge({ status }: { status: ActivityStatus }) {
  const { label, cls, icon } = verifMap[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── sub-sections ────────────────────────────────────────────────────────────

function HeroMetrics() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] text-gray-500">Sinkronisasi BPS • Minggu III April 2026 (Terverifikasi)</span>
      </div>

      <div className="flex items-start justify-between gap-6">
        {/* Left */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">
            Dashboard Pengendalian Inflasi (IPH) Kota Batu
          </h1>
          <p className="text-xs text-gray-500 mb-4">
            Pusat pemantauan kestabilan harga komoditas dan koordinasi respon cepat TPID Kota Batu.
          </p>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-500">Indeks Perkembangan Harga (IPH) Terkini</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Deflasi Aman
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900 tracking-tight">-0.42%</span>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <TrendingDown size={12} />
                  Turun 0.17% dibanding pekan lalu
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Kondisi harga 20 komoditas strategis di Pasar Besar Kota Batu dan Pasar Relokasi
                terpantau stabil dalam koridor target.
              </p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-gray-400 mb-1">Periode Aktif</div>
            <div className="text-sm font-bold text-gray-900">18 – 24 April</div>
            <div className="text-sm font-bold text-gray-900">2026</div>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors">
            <RefreshCw size={12} />
            Sinkron Data BPS
          </button>

          <div className="h-12 w-px bg-gray-100" />

          <div className="text-center px-3">
            <div className="text-[10px] text-gray-400 mb-0.5">Target Koridor Inflasi</div>
            <div className="text-sm font-black text-gray-900">± 0.50%</div>
            <div className="text-[10px] text-gray-400">Batas Waspada Daerah</div>
          </div>

          <div className="text-center px-3">
            <div className="text-[10px] text-gray-400 mb-0.5">Status Tekanan Harga</div>
            <div className="text-sm font-black text-emerald-600">Terkendali</div>
            <div className="text-[10px] text-gray-400">18 Komoditas Normal/Turun</div>
          </div>

          <div className="text-center px-3">
            <div className="text-[10px] text-gray-400 mb-0.5">Komoditas Perhatian</div>
            <div className="text-sm font-black text-amber-600">Cabai Rawit</div>
            <div className="text-[10px] text-amber-500">+0.18% W-to-W</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WorkflowStep {
  n: number;
  title: string;
  desc: string;
}

function WorkflowSteps() {
  const steps: WorkflowStep[] = [
    { n: 1, title: "Input Data Mingguan",  desc: "Catat data pasar terkini"   },
    { n: 2, title: "Pantau Rekapan IPH",   desc: "Validasi tren komoditas"     },
    { n: 3, title: "Susun Siaran & Rapat", desc: "Disposisi & notulensi rakor" },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <ArrowRight size={11} className="text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-gray-800">Alur Kerja Utama Tim TPID</span>
        </div>
        <span className="text-[11px] text-gray-400">Pilih langkah operasional yang ingin dilakukan</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {steps.map(({ n, title, desc }: WorkflowStep) => (
          <button
            key={n}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-emerald-600 transition-colors">
              {n}
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-900">{title}</div>
              <div className="text-[10px] text-gray-400">{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CommodityTable() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Komoditas Pangan Utama Kota Batu</h2>
          <p className="text-[11px] text-gray-400">
            Daftar pemantauan harga harian di Pasar Besar Kota Batu &amp; Pasar Relokasi
          </p>
        </div>
        <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded px-2 py-1">
          Minggu III April 2026
        </span>
      </div>

      <table className="w-full mt-3">
        <thead>
          <tr className="border-b border-gray-100">
            {(["Komoditas", "Harga Terkini", "Perubahan (W-to-W)", "Status IPH"] as const).map(
              (col, i) => (
                <th
                  key={col}
                  className={`text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {commodities.map((c: Commodity) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                    <div className="text-[10px] text-gray-400">{c.unit}</div>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-right">
                <span className="text-xs font-bold text-gray-900">{formatRupiah(c.price)}</span>
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

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">Memantau total 20 komoditas strategis</span>
        <button className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold hover:text-emerald-700">
          Lihat Tabel Lengkap Komoditas
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

interface MarketStatus {
  name: string;
  status: string;
  color: string;
}

function SupplyPanel() {
  const markets: MarketStatus[] = [
    { name: "Pasar Besar Kota Batu", status: "100% Normal",      color: "text-emerald-600" },
    { name: "Pasar Relokasi Batu",   status: "98% Normal",        color: "text-emerald-600" },
    { name: "Sentra Sayur Bumiaji",  status: "Pengawasan Cuaca",  color: "text-amber-600"   },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={13} className="text-emerald-600" />
        <span className="text-sm font-bold text-gray-900">Pasokan Pasar Utama</span>
        <span className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
          Aman &gt; 14 Hari
        </span>
      </div>

      <div className="space-y-2">
        {markets.map(({ name, status, color }: MarketStatus) => (
          <div key={name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-600">{name}</span>
            <span className={`text-xs font-semibold ${color}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendaPanel() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gray-500" />
          <span className="text-sm font-bold text-gray-900">Jadwal Rapat &amp; Disposisi Penting</span>
        </div>
        <span className="text-[10px] text-gray-400">Agenda Mendatang</span>
      </div>

      <div className="space-y-3">
        {agendaItems.map((item: AgendaItem) => (
          <div
            key={item.id}
            className={`rounded-lg p-3 border ${
              item.type === "mendesak"
                ? "border-amber-100 bg-amber-50/50"
                : "border-gray-100 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={`text-[10px] font-bold ${
                  item.type === "mendesak" ? "text-amber-600" : "text-gray-500"
                }`}
              >
                {item.type === "mendesak" ? "Disposisi Mendesak" : "Agenda Rutin Setda"}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  item.urgency === "wajib"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {item.urgency === "wajib" ? "Wajib" : "Internal"}
              </span>
            </div>

            <div className="text-xs font-semibold text-gray-900 mb-1">{item.title}</div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
              <Clock size={9} />
              {item.datetime}
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {item.actions.map((action: string, i: number) => (
                <button
                  key={action}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                    i === item.actions.length - 1 && item.type === "mendesak"
                      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <FileText size={9} />
                  {action}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityLogTable() {
  const cols = [
    "Waktu & Tanggal",
    "Petugas / Operator",
    "Perangkat Daerah / Instansi",
    "Deskripsi Aktivitas",
    "Status Verifikasi",
  ] as const;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Log Aktivitas Pembaruan Sistem &amp; Input Data Terkini
          </h2>
          <p className="text-[11px] text-gray-400">
            Audit trail pencatatan indeks perkembangan harga dan risalah TPID Kota Batu
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Auto-sync: On</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full mt-3">
          <thead>
            <tr className="border-b border-gray-100">
              {cols.map((col) => (
                <th
                  key={col}
                  className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activityLogs.map((log: ActivityLog) => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">{log.datetime}</span>
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <span className="text-xs font-semibold text-gray-900">{log.officer}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-[11px] text-gray-500">{log.agency}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="text-[11px] text-gray-700">{log.description}</span>
                </td>
                <td className="py-2.5">
                  <VerifBadge status={log.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <span className="text-[11px] text-gray-400">
          Menampilkan 4 aktivitas terakhir dari 128 catatan pekan ini
        </span>
        <div className="flex items-center gap-1">
          <button className="text-[11px] text-gray-400 px-2 py-1 rounded hover:bg-gray-50">
            Sebelumnya
          </button>
          {[1, 2, 3].map((p: number) => (
            <button
              key={p}
              className={`w-6 h-6 text-[11px] rounded flex items-center justify-center font-medium ${
                p === 1 ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
          <button className="text-[11px] text-gray-400 px-2 py-1 rounded hover:bg-gray-50">
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="p-5 space-y-4 w-full">
      <HeroMetrics />
      <WorkflowSteps />

      <div className="grid grid-cols-[1fr_280px] gap-4">
        <CommodityTable />
        <div className="flex flex-col gap-3">
          <SupplyPanel />
          <AgendaPanel />
        </div>
      </div>

      <ActivityLogTable />
    </div>
  );
}