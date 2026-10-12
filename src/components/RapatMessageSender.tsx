import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api";

interface Meeting { id: string; topik: string; tanggal: string; status: string }
interface Recipient { pegawaiId: string; name: string; peran: string; phone: string | null; reason: string | null }
interface Preview { rows: Recipient[]; enabled: boolean; dashboardLink?: string; configurationError?: string }
function dayWib(value: string | number) { return new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10); }

export default function RapatMessageSender({ broadcast }: { broadcast?: { rekapId: string; text: string; periodLabel: string; ready: boolean } }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [date, setDate] = useState(() => dayWib(Date.now()));
  const [meetingId, setMeetingId] = useState("");
  const [preview, setPreview] = useState<{ key: string; data: Preview } | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    api.get<{ rows: Meeting[] }>("/rapat").then(data => { if (!cancelled) { setMeetings(data.rows); setError(""); } })
      .catch(e => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Daftar rapat belum dapat dimuat."); });
    return () => { cancelled = true; };
  }, [reload]);
  const previewKey = `${meetingId}:${broadcast?.rekapId ?? ""}`;
  useEffect(() => {
    if (!meetingId) return;
    let cancelled = false;
    api.get<Preview>(`/rapat/${meetingId}/recipients${broadcast?.rekapId ? `?rekapId=${encodeURIComponent(broadcast.rekapId)}` : ""}`)
      .then(data => { if (!cancelled) { setPreview({ key: previewKey, data }); setError(""); } })
      .catch(e => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Penerima belum dapat dimuat."); });
    return () => { cancelled = true; };
  }, [meetingId, broadcast?.rekapId, previewKey, reload]);
  const today = dayWib(now);
  const filtered = meetings.filter(row => row.status !== "dibatalkan" && (!date || dayWib(row.tanggal) === date) && (broadcast || (row.status === "terjadwal" && new Date(row.tanggal).getTime() > now)));
  const selected = filtered.find(row => row.id === meetingId);
  const data = selected && preview?.key === previewKey ? preview.data : null;
  const recipients = data?.rows.filter(row => !row.reason) ?? [];
  const sameDay = selected && dayWib(selected.tanggal) === today;
  const canSend = !!selected && !!data?.enabled && recipients.length > 0 && !busy && (!broadcast || (broadcast.ready && sameDay && !!data.dashboardLink && !data.configurationError));
  async function send() {
    if (!canSend) return;
    setBusy(true); setError(""); setResult("");
    try {
      const response = await api.post<{ message: string }>(`/rapat/${meetingId}/${broadcast ? "broadcast" : "remind"}`, broadcast ? { rekapId: broadcast.rekapId, text: broadcast.text } : {});
      setResult(response.message + " Pantau statusnya di Monitoring Rapat.");
    } catch (e) { setError(e instanceof ApiError ? e.message : "Pesan belum dapat diantrekan."); }
    finally { setBusy(false); }
  }
  return <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-sm font-bold text-gray-900">{broadcast ? "Kirim teks siaran ke peserta rapat" : "Kirim pengingat rapat"}</h2>
        <p className="text-sm text-gray-500 mt-1">{broadcast ? `Draf ${broadcast.periodLabel} beserta link dashboard periode yang sama. Pengiriman tersedia pada hari rapat (WIB).` : "Pengingat langsung melalui WhatsApp ke peserta dan notulis yang memiliki nomor. Peserta tanpa nomor dilewati."}</p></div>
      <button type="button" aria-label="Muat ulang rapat dan penerima" disabled={busy} onClick={() => setReload(value => value + 1)} className="p-2 border border-gray-200 rounded-lg text-gray-600"><RefreshCw size={15} /></button>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <label className="text-xs text-gray-600 space-y-1">Tanggal rapat (WIB)
        <input type="date" value={date} onChange={e => { setDate(e.target.value); setMeetingId(""); setResult(""); }} className="block w-full border border-gray-200 rounded-lg p-2 text-sm bg-white" /></label>
      <label className="flex-1 text-xs text-gray-600 space-y-1">Rapat tujuan
        <select value={selected ? meetingId : ""} onChange={e => { setMeetingId(e.target.value); setResult(""); setError(""); }} className="block w-full border border-gray-200 rounded-lg p-2 text-sm bg-white">
          <option value="">{filtered.length ? "Pilih rapat" : "Tidak ada rapat pada tanggal ini"}</option>
          {filtered.map(row => <option key={row.id} value={row.id}>{row.topik} · {new Date(row.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}</option>)}
        </select></label>
    </div>
    {selected && !data && !error && <p className="text-sm text-gray-500">Memuat penerima…</p>}
    {data && <>
      <div className="text-sm text-gray-700">{recipients.length} penerima · {data.rows.length - recipients.length} dilewati</div>
      <ul className="divide-y divide-gray-100 text-sm">{data.rows.map(row => <li key={row.pegawaiId} className="py-2 flex flex-wrap justify-between gap-1"><span>{row.name} <span className="text-gray-500">({row.peran})</span></span><span className={row.reason ? "text-gray-400" : "text-gray-600"}>{row.reason ?? row.phone}</span></li>)}</ul>
      {!data.enabled && <p className="text-sm text-amber-700">Pengiriman WhatsApp belum aktif.</p>}
      {broadcast && !sameDay && <p className="text-sm text-amber-700">Pengiriman tersedia pada tanggal pelaksanaan rapat.</p>}
      {data.configurationError && <p className="text-sm text-amber-700">{data.configurationError}</p>}
      {broadcast && data.dashboardLink && <a href={data.dashboardLink} target="_blank" rel="noopener noreferrer" className="block text-sm text-emerald-700 underline break-all">Lihat dashboard yang akan dikirim: {data.dashboardLink}</a>}
    </>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {result && <p role="status" className="text-sm text-emerald-700">{result}</p>}
    <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={!canSend} onClick={() => void send()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"><MessageCircle size={15} />{busy ? "Memproses…" : `Kirim ${broadcast ? "teks & link" : "pengingat"} ke ${recipients.length} penerima`}</button>
      <span className="text-xs text-gray-500">{broadcast ? "Draf yang sama hanya diantrekan sekali untuk rapat ini." : "Pengingat manual dibatasi satu kali per peserta per hari untuk setiap revisi rapat."}</span></div>
  </section>;
}
