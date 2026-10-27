import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PublicHeader from "./PublicHeader";

interface Minutes { topik: string; tanggal: string; notulis: string; deadline: string; serverNow: string; expired: boolean; isi: string; submittedAt: string | null }
export default function PublicMinutes({ token }: { token: string }) {
  const [data, setData] = useState<Minutes | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api.get<Minutes>(`/public/notulensi/${encodeURIComponent(token)}`).then(value => {
      if (cancelled) return;
      if (typeof value.topik !== "string" || typeof value.isi !== "string" || !Number.isFinite(Date.parse(value.tanggal)) || !Number.isFinite(Date.parse(value.deadline)) || !Number.isFinite(Date.parse(value.serverNow))) {
        setError("Formulir notulensi belum tersedia pada server ini. Pastikan frontend dan backend telah diperbarui bersama, lalu coba lagi."); return;
      }
      setData(value); setText(value.isi); setOffset(Date.parse(value.serverNow) - Date.now());
    }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [token, attempt]);
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const remaining = data ? Math.max(0, Date.parse(data.deadline) - clock - offset) : 0;
  const expired = data && (data.expired || remaining <= 0);
  const countdown = `${Math.floor(remaining / 86400000)} hari ${Math.floor(remaining / 3600000) % 24} jam ${Math.floor(remaining / 60000) % 60} menit ${Math.floor(remaining / 1000) % 60} detik`;
  async function save() {
    if (busy || expired) return;
    setError(""); setSuccess("");
    if (text.trim().length < 10) { setError("Isi notulensi minimal 10 karakter."); return; }
    setBusy(true);
    try { await api.post(`/public/notulensi/${encodeURIComponent(token)}`, { isi: text }); setSuccess("Notulensi tersimpan. Perubahan masih dapat disimpan sebelum batas waktu berakhir."); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="public-dashboard min-h-screen"><PublicHeader /><main className="minutes-public">
    <h1>Pengisian notulensi rapat</h1>
    {error && <p className="error-message" role="alert">{error}</p>}
    {!data && error && <div className="field-stack"><p>Gunakan tautan lengkap dari undangan. Jika rapat baru dibuat, pastikan jadwalnya sudah disimpan.</p><div><button type="button" className="secondary-action" onClick={() => { setError(""); setAttempt(value => value + 1); }}>Coba muat formulir lagi</button></div></div>}
    {!data ? !error && <p role="status">Memuat undangan…</p> : <section className="form-surface field-stack">
      <h2>{data.topik}</h2><p>{new Date(data.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "full", timeStyle: "short" })} WIB</p>
      <p>Notulis: <strong>{data.notulis}</strong></p>
      <div className="deadline-panel"><strong>{expired ? "Pengisian telah ditutup" : `Sisa waktu: ${countdown}`}</strong><p>Batas pengisian: {new Date(data.deadline).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB</p></div>
      <label className="field-stack">Hasil notulensi<textarea rows={14} maxLength={50000} value={text} onChange={e => { setText(e.target.value); setSuccess(""); }} disabled={Boolean(expired) || busy} placeholder="Tuliskan pembahasan, keputusan, dan tindak lanjut rapat…" /></label>
      {success && <p role="status" className="text-emerald-700">{success}</p>}
      <div className="dialog-actions"><span className="text-xs text-gray-500">{text.length.toLocaleString("id-ID")} / 50.000 karakter</span><button type="button" className="primary-action" disabled={busy || Boolean(expired)} onClick={() => void save()}>{busy ? "Menyimpan…" : "Simpan notulensi"}</button></div>
    </section>}
  </main></div>;
}
