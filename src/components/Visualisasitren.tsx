import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";
import { decimal4, iphDirection, MONTH_NAMES, type FrequencyPeriod } from "../lib/iph";
import PageHeading from "./PageHeading";
import CommodityFrequency from "./CommodityFrequency";

interface Point { tahun: number; bulan: number; mingguIndeks: number; iph: number; pemicu: string | null; penutupan: boolean }
interface Summary { trend: Point[]; frequencyPeriods: FrequencyPeriod[] }
const fullPeriod = (p: Point) => `Minggu ${p.mingguIndeks} ${MONTH_NAMES[p.bulan - 1]} ${p.tahun}`;

export default function VisualisasiTren() {
  const { isDark } = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [closingOnly, setClosingOnly] = useState(false);
  useEffect(() => {
    let cancelled = false;
    api.get<Summary>("/rekap/summary").then(data => {
      if (cancelled) return;
      setSummary(data);
      const years = [...new Set(data.trend.map(p => p.tahun))].sort((a, b) => b - a);
      setSelectedYears(years.slice(0, 1));
    }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [attempt]);
  const years = [...new Set(summary?.trend.map(p => p.tahun) ?? [])].sort((a, b) => b - a);
  const palette = isDark ? ["#8ad6b5", "#dbc8f5", "#f6c27d", "#ffaaa5"] : ["#19684e", "#6550a0", "#92500e", "#ad302b"];
  const points = (summary?.trend ?? []).filter(p => selectedYears.includes(p.tahun) && (!closingOnly || p.penutupan));
  const latest = points.at(-1);
  const last4 = points.slice(-4);
  const average = last4.length ? last4.reduce((sum, p) => sum + p.iph, 0) / last4.length : null;
  const peak = points.length ? points.reduce((a, b) => a.iph > b.iph ? a : b) : null;
  const merged = Array.from({ length: 60 }, (_, i) => {
    const bulan = Math.floor(i / 5) + 1, minggu = i % 5 + 1;
    const matching = points.filter(p => p.bulan === bulan && p.mingguIndeks === minggu);
    return { label: `${MONTH_NAMES[bulan - 1].slice(0, 3)} M${minggu}`, ...Object.fromEntries(matching.map(p => [String(p.tahun), p.iph])) };
  }).filter(row => Object.keys(row).length > 1);
  const matrix = points.filter(p => latest && p.tahun === latest.tahun && p.bulan === latest.bulan);
  const stats = [
    { label: "IPH terakhir dalam pilihan", value: latest ? `${decimal4(latest.iph)}%` : "N/A", note: latest ? fullPeriod(latest) : "Belum ada data" },
    { label: "Rata-rata empat pekan terakhir", value: average === null ? "N/A" : `${decimal4(average)}%`, note: `${last4.length} pekan dalam pilihan` },
    { label: "Puncak tertinggi", value: peak ? `${decimal4(peak.iph)}%` : "N/A", note: peak ? fullPeriod(peak) : "Belum ada data" },
  ];
  return <div className="trend-view space-y-6 w-full">
    <PageHeading title="Visualisasi tren IPH" description="Bandingkan pergerakan harga antar tahun dan frekuensi komoditas dalam rekap." />
    {error ? <div className="form-surface" role="alert"><p>{error}</p><button className="secondary-action mt-3" onClick={() => { setError(""); setAttempt(v => v + 1); }}>Coba lagi</button></div> : !summary ? <p role="status">Memuat tren IPH…</p> : <>
      <section className="form-surface">
        <div className="section-heading"><div><h2>Pergerakan IPH antar tahun</h2><p>Grafik dan ringkasan mengikuti tahun yang dipilih.</p></div></div>
        <div className="flex flex-wrap gap-3 mb-5" role="group" aria-label="Pilih tahun grafik">{years.map((year, i) => <button key={year} type="button" aria-pressed={selectedYears.includes(year)} className={selectedYears.includes(year) ? "primary-action" : "secondary-action"} style={{ borderColor: palette[i % palette.length] }} onClick={() => setSelectedYears(values => values.includes(year) ? values.length > 1 ? values.filter(y => y !== year) : values : [...values, year])}>{year}</button>)}
          <label className="flex items-center gap-2"><input type="checkbox" checked={closingOnly} onChange={e => setClosingOnly(e.target.checked)} />Hanya pekan terakhir setiap bulan</label>
        </div>
        {points.length ? <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={merged} margin={{ top: 15, right: 15, left: 0, bottom: 10 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeDasharray="3 5" /><XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 11 }} /><YAxis width={75} domain={['auto', 'auto']} tickFormatter={v => `${Number(v).toLocaleString("id-ID")}%`} tick={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke={isDark ? "#b1c0cd" : "#5d6c64"} strokeDasharray="4 4" />
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="data-tooltip"><strong>{label}</strong>{payload.map(p => <p key={String(p.dataKey)}>{p.name}: {decimal4(Number(p.value))}% · {iphDirection(Number(p.value))}</p>)}</div> : null} />
          {selectedYears.map(year => <Line key={year} type="linear" dataKey={String(year)} name={String(year)} connectNulls stroke={palette[years.indexOf(year) % palette.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />)}
        </LineChart></ResponsiveContainer></div> : <p className="py-10 text-gray-500">Belum ada data untuk pilihan ini.</p>}
        <dl className="trend-statistics">{stats.map(s => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}<small>{s.note}</small></dd></div>)}</dl>
      </section>
      <section className="form-surface"><div className="section-heading"><div><h2>Matriks evaluasi mingguan</h2><p>{latest ? `${MONTH_NAMES[latest.bulan - 1]} ${latest.tahun}, mengikuti pilihan grafik.` : "Belum ada periode."}</p></div></div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Matriks evaluasi mingguan"><table className="data-table w-full"><thead><tr>{["Minggu", "IPH (%)", "Arah harga", "Pemicu utama"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{matrix.map(p => <tr key={`${p.tahun}-${p.bulan}-${p.mingguIndeks}`}><td>{fullPeriod(p)}</td><td className="tabular-nums">{decimal4(p.iph)}</td><td>{iphDirection(p.iph)}</td><td>{p.pemicu ?? "N/A"}</td></tr>)}{!matrix.length && <tr><td colSpan={4}>Tidak ada data.</td></tr>}</tbody></table></div>
      </section>
      <CommodityFrequency key={years[0]} periods={summary.frequencyPeriods ?? []} defaultYear={years[0]} title="Frekuensi komoditas" />
    </>}
  </div>;
}
