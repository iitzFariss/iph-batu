import { useState } from "react";
import { commodityFrequency, MONTH_NAMES, type FrequencyPeriod } from "../lib/iph";

export default function CommodityFrequency({ periods, defaultYear, title = "Komoditas yang sering muncul" }: { periods: FrequencyPeriod[]; defaultYear?: number; title?: string }) {
  const [year, setYear] = useState(String(defaultYear ?? ""));
  const [month, setMonth] = useState("");
  const years = [...new Set(periods.map(p => p.tahun))].sort((a, b) => b - a);
  const items = commodityFrequency(periods, year, month);
  const max = Math.max(1, ...items.map(row => row.count));
  return <section className="form-surface">
    <div className="section-heading"><div><h2>{title}</h2><p>Jumlah pekan saat komoditas tercatat dalam periode yang dipilih.</p></div></div>
    <div className="filter-fields mb-5">
      <label>Tahun frekuensi<select value={year} onChange={e => setYear(e.target.value)}><option value="">Semua tahun</option>{years.map(y => <option key={y}>{y}</option>)}</select></label>
      <label>Bulan frekuensi<select value={month} onChange={e => setMonth(e.target.value)}><option value="">Semua bulan</option>{MONTH_NAMES.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label>
    </div>
    {items.length ? <ul className="frequency-list">{items.map(row => <li key={row.name}><div><span>{row.name}</span><span className="tabular-nums">{row.count} kali</span></div><div className="frequency-bar" aria-hidden="true"><i style={{ width: `${row.count / max * 100}%` }} /></div></li>)}</ul> : <p className="text-sm text-gray-500 py-6">Tidak ada komoditas dalam periode ini.</p>}
  </section>;
}
