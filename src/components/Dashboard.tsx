import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { weeklyColumns, type WeeklyRow } from "../data/weeklyData";
import WeeklyDataTable from "./WeeklyDataTable";
import PageHeading from "./PageHeading";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import CommodityFrequency from "./CommodityFrequency";
import { iphDirection, type FrequencyPeriod } from "../lib/iph";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const WEEKS = ["I", "II", "III", "IV", "V"];
const STATUS: Record<string, string> = { inflasi: "Inflasi", deflasi: "Deflasi", "tidak-berubah": "Tidak berubah" };
interface TrendPoint { tahun: number; bulan: number; mingguIndeks: number; iph: number; status: string; pemicu: string | null; penutupan: boolean }
interface Detail { name: string; nilai: number; isFluktuasi: boolean }
interface Summary {
  frequencyPeriods: FrequencyPeriod[];
  trend: TrendPoint[];
  weekly: { tahun: number; data: Record<string, number | null> }[];
  frequency: { tahun: number; items: { name: string; count: number }[] }[];
  latest: TrendPoint | null;
  latestDetails: Detail[];
}
const number = (value: number) => `${value > 0 ? "+" : ""}${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const period = (row: TrendPoint) => `Minggu ${WEEKS[row.mingguIndeks - 1]} ${MONTHS[row.bulan - 1]} ${row.tahun}`;

function TrendChart({ points, year }: { points: TrendPoint[]; year: number | null }) {
  const { isDark } = useTheme();
  const values = points.map(row => row.iph);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const padding = Math.max(.25, (max - min) * .15);
  const data = points.map(row => ({ label: `${MONTHS[row.bulan - 1]} M${row.mingguIndeks}`, full: period(row), iph: row.iph }));
  return <section className="report-trend" aria-label="Tren IPH">
    <div className="section-heading"><div><h2>Pergerakan IPH</h2><p>Rekap mingguan {year ?? ""}, dibandingkan periode acuan.</p></div><span className="text-xs text-gray-500">Persen (%)</span></div>
    {points.length ? <div className="report-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 5, left: -16 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} dy={10} />
          <YAxis tick={{ fontSize: 11 }} width={65} tickLine={false} axisLine={false} domain={[min - padding, max + padding]} tickFormatter={value => `${Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`} />
          <ReferenceLine y={0} stroke={isDark ? "#8197a7" : "#87958c"} strokeDasharray="4 4" />
          <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="data-tooltip"><span>{payload[0]?.payload.full}</span><strong>IPH {number(Number(payload[0]?.value))}%</strong></div> : null} />
          <Line type="linear" dataKey="iph" stroke={isDark ? "#98dfc3" : "#267259"} strokeWidth={2.5} dot={points.length < 12 ? { r: 3, fill: isDark ? "#98dfc3" : "#267259", strokeWidth: 0 } : false} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div> : <p className="text-sm text-gray-500 py-14">Tren akan muncul setelah data mingguan ditambahkan.</p>}
  </section>;
}

function CommodityList({ details }: { details: Detail[] }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(() => [
    ...details.filter(row => !row.isFluktuasi).sort((a, b) => b.nilai - a.nilai),
    ...details.filter(row => row.isFluktuasi).sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai)),
  ], [details]);
  const visible = showAll ? sorted : sorted.slice(0, 3);
  const max = Math.max(.01, ...details.map(row => Math.abs(row.nilai)));
  return <section className="report-section">
    <div className="section-heading"><div><h2>Andil komoditas</h2><p>Kontribusi harga pada periode terpilih.</p></div><span className="text-xs text-gray-500">Persen poin</span></div>
    <ul className="commodity-list">{visible.map(row => <li key={`${row.name}-${row.isFluktuasi}`}>
      <div><strong>{row.name}</strong><small>{row.isFluktuasi ? "Komoditas fluktuasi" : row.nilai > 0 ? "Andil kenaikan harga" : row.nilai < 0 ? "Andil penurunan harga" : "Tidak ada perubahan"}</small><div className="commodity-scale" aria-hidden="true"><i style={{ width: `${Math.abs(row.nilai) / max * 100}%` }} /></div></div>
      <div><div className={`andil tabular-nums ${row.nilai > 0 ? "text-amber-600" : row.nilai < 0 ? "text-emerald-700" : "text-gray-500"}`}>{row.nilai.toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div><small className="text-right">{row.isFluktuasi ? "Fluktuasi" : iphDirection(row.nilai)}</small></div>
    </li>)}</ul>
    {!visible.length && <p className="py-6 text-sm text-gray-500">Belum ada rincian andil untuk periode ini.</p>}
    <div className="report-footer"><span>{visible.length} dari {sorted.length} komoditas</span>{sorted.length > 3 && <button className="text-action" onClick={() => setShowAll(value => !value)}>{showAll ? "Tampilkan lebih sedikit" : "Lihat semua komoditas"}</button>}</div>
  </section>;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const query = window.location.hash.startsWith("#/publik?") ? window.location.hash.split("?")[1] : "";
    api.get<Summary>(`/public/rekap/summary${query ? `?${query}` : ""}`)
      .then(data => { if (!cancelled) setSummary(data); })
      .catch((error: Error) => { if (!cancelled) setLoadError(error.message || "Ringkasan harga belum dapat dimuat."); });
    return () => { cancelled = true; };
  }, [attempt]);
  const latest = summary?.latest ?? null;
  const year = latest?.tahun ?? null;
  const trend = (summary?.trend ?? []).filter(row => year === null || row.tahun === year);
  const weeklyRows: WeeklyRow[] = (summary?.weekly ?? []).map(row => ({ tahun: row.tahun, data: row.data }));
  return <div className="dashboard-view w-full">
    <PageHeading title="Dashboard harga Kota Batu" description="Perubahan harga mingguan dan andil komoditas Pasar Besar Kota Batu.">
      {latest && <div className="report-period"><span>Periode data</span><strong className="font-medium">{period(latest)}</strong></div>}
    </PageHeading>
    {loadError ? <div className="form-surface" role="alert"><h2 className="form-section-title">Ringkasan belum dapat dimuat</h2><p className="text-sm text-gray-500 mb-4">{loadError}</p><button className="secondary-action" onClick={() => { setLoadError(""); setAttempt(value => value + 1); }}>Coba lagi</button></div> : !summary ? <div role="status" className="form-surface text-sm text-gray-500">Memuat data ringkasan…</div> : <>
      <div className="report-board">
        <section className="iph-summary" aria-label="Indeks Perkembangan Harga"><p className="metric-label">Indeks Perkembangan Harga</p><div className={latest ? "iph-value" : "text-xl my-8"}>{latest ? <>{number(latest.iph)}<small>%</small></> : "Belum ada data"}</div>{latest && <span className={`text-xs font-medium ${latest.iph > 0 ? "text-amber-600" : "text-emerald-700"}`}>{STATUS[latest.status] ?? latest.status}</span>}<p className="iph-explanation">{latest ? latest.iph > 0 ? "Harga meningkat dibandingkan periode acuan." : latest.iph < 0 ? "Harga menurun dibandingkan periode acuan." : "Harga tidak berubah dibandingkan periode acuan." : "Data akan tampil setelah rekap IPH ditambahkan."}</p></section>
        <TrendChart points={trend} year={year} />
      </div>
      <div className="report-detail-grid"><CommodityList details={summary.latestDetails} /><CommodityFrequency key={year} periods={summary.frequencyPeriods ?? []} defaultYear={year ?? undefined} /></div>
      <div className="mt-6"><WeeklyDataTable rows={weeklyRows} columns={weeklyColumns} title="Arsip IPH mingguan" description="Nilai IPH setiap minggu dalam persen. Geser tabel untuk melihat periode lainnya." /></div>
      <p className="text-xs text-gray-500 mt-5 leading-relaxed">IPH menunjukkan perubahan harga terhadap periode acuan. Rincian andil dapat bersifat parsial dan tidak selalu berjumlah sama dengan IPH.</p>
    </>}
  </div>;
}
