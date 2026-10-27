import { useState } from "react";
import { api } from "../lib/api";
import { decimal4, MONTH_NAMES } from "../lib/iph";

interface Period { tahun: number; bulan: number; mingguKe: number; indikator: number; andil: { nama: string; nilai: number }[]; fluktuasi: { nama: string; nilai: number } | null }
export default function ExcelImport({ onImported }: { onImported: () => void }) {
  const [base64, setBase64] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const blob = await api.download("/rekap/template"), url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "template-input-iph.xlsx"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function read(file?: File) {
    setBase64(""); setPeriods([]); setMessage(""); setError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > 1_000_000) { setError("Pilih file .xlsx maksimal 1 MB sesuai template."); return; }
    setBusy(true);
    try {
      const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = () => reject(new Error("File belum dapat dibaca.")); reader.readAsDataURL(file); });
      const result = await api.post<{ periods: Period[]; message: string }>("/rekap/import", { base64: content, commit: false });
      setBase64(content); setPeriods(result.periods); setMessage(result.message);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function save() {
    if (busy || !base64) return;
    setBusy(true); setError("");
    try {
      const result = await api.post<{ message: string }>("/rekap/import", { base64, commit: true });
      setMessage(result.message); setBase64(""); setPeriods([]); onImported();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <section className="form-surface field-stack">
    <div className="section-heading"><div><h2>Impor rekap dari Excel</h2><p>Gunakan template agar periode, IPH, dan andil komoditas terbaca dengan tepat.</p></div><button className="secondary-action" disabled={busy} onClick={() => void download()}>Unduh template Excel</button></div>
    <label className="field-stack">Unggah file .xlsx<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={e => void read(e.target.files?.[0])} /></label>
    <p className="text-xs text-gray-500">Maksimal 1 MB atau 1.000 baris. File diperiksa terlebih dahulu; data tersimpan setelah tombol impor ditekan.</p>
    {busy && <p role="status">Memproses workbook…</p>}{error && <p role="alert" className="text-red-600 text-sm">{error}</p>}{message && <p role="status" className="text-sm">{message}</p>}
    {periods.length > 0 && <><div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Pratinjau impor Excel"><table className="data-table w-full"><thead><tr><th>Periode</th><th>IPH (%)</th><th>Komoditas dan andil</th></tr></thead><tbody>{periods.map(p => <tr key={`${p.tahun}-${p.bulan}-${p.mingguKe}`}><td>Minggu {p.mingguKe} {MONTH_NAMES[p.bulan - 1]} {p.tahun}</td><td>{decimal4(p.indikator)}</td><td>{p.andil.map(d => <div key={d.nama}>{d.nama}: {decimal4(d.nilai)}</div>)}{p.fluktuasi && <div>Fluktuasi · {p.fluktuasi.nama}: {decimal4(p.fluktuasi.nilai)}</div>}</td></tr>)}</tbody></table></div><button className="primary-action" disabled={busy} onClick={() => void save()}>Impor {periods.length} periode</button></>}
  </section>;
}
