import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api";

interface Delivery {
  id: string; topik: string; recipientName: string; phone: string | null;
  kind: string; status: string; scheduledAt: string; sentAt: string | null;
  attempts: number; lastError: string | null;
  expiresAt?: string; canRetry?: boolean;
}

const labels: Record<string, string> = {
  pending: "Terjadwal", missing_phone: "Nomor belum diisi", sending: "Sedang dikirim",
  sent: "Diserahkan ke WhatsApp", failed: "Gagal", unknown: "Perlu diperiksa",
  cancelled: "Dibatalkan", expired: "Batas waktu lewat",
};
const kinds: Record<string, string> = { invitation: "Undangan", updated: "Perubahan jadwal", reminder: "Pengingat hari ini", minutes_reminder: "Pengingat pengisian notulensi" };
const attention = ["failed", "unknown", "missing_phone"];
const formatTime = (value: string) => new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });

export default function RapatWhatsappStatus() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const load = useCallback(() => api.get<{ rows: Delivery[]; enabled: boolean }>("/rapat/notifications")
    .then(data => { setRows(data.rows); setEnabled(data.enabled); setError(""); })
    .catch(e => setError(e instanceof ApiError ? e.message : "Riwayat pengiriman belum dapat dimuat."))
    .finally(() => setLoaded(true)), []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);
  async function retry(id: string) {
    setBusy(id);
    try { await api.post(`/rapat/notifications/${id}/retry`); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Pesan belum dapat dimasukkan kembali ke antrean."); }
    finally { setBusy(null); }
  }
  const filtered = rows.filter(row => filter === "all" || (filter === "attention" ? attention.includes(row.status) : filter === "scheduled" ? ["pending", "sending"].includes(row.status) : row.status === "sent"));
  const needsAttention = rows.filter(row => attention.includes(row.status)).length;
  return (
    <section className="delivery-panel form-surface" aria-label="Pengiriman WhatsApp rapat">
      <div className="section-heading">
        <div>
          <h2>Riwayat pengiriman WhatsApp</h2>
          <p>Undangan, pengingat rapat dan notulensi, serta teks siaran. Hingga 100 pengiriman terbaru.</p>
        </div>
        <button type="button" aria-label="Muat ulang riwayat pengiriman" onClick={() => void load()} className="icon-button border border-gray-200"><RefreshCw size={16} /></button>
      </div>
      <p className="dispatch-note">Notulis yang belum mengisi notulensi mendapat satu pengingat pada H+1 pukul 09.00 WIB. Pengiriman memerlukan nomor WhatsApp dan layanan otomatis yang aktif.</p>
      {loaded && !enabled && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">Pengiriman otomatis belum aktif. Jadwal dan nomor WhatsApp tetap dapat disiapkan.</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      {needsAttention > 0 && <p className="delivery-attention">{needsAttention} pengiriman perlu perhatian. Buka detail status sebelum mengirim ulang.</p>}
      <div className="delivery-filters" aria-label="Filter riwayat pengiriman">{[["all", "Semua"], ["attention", "Perlu perhatian"], ["scheduled", "Terjadwal"], ["sent", "Terkirim"]].map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
      {!loaded ? <p role="status" className="text-sm text-gray-500 py-6">Memuat riwayat pengiriman…</p> : !filtered.length ? <p className="text-sm text-gray-500 py-6">{rows.length ? "Tidak ada pengiriman pada filter ini." : "Belum ada antrean. Undangan dibuat saat rapat mendatang disimpan."}</p> : <ol className="delivery-list" tabIndex={0} aria-label="Daftar status pengiriman">{filtered.map(row => <li key={row.id}>
        <div className="delivery-row-heading"><h3>{row.topik}</h3><span className={`delivery-state ${row.status === "sent" ? "text-emerald-700" : attention.includes(row.status) ? "text-amber-700" : "text-gray-600"}`}>{labels[row.status] ?? row.status}</span></div>
        <p className="delivery-recipient">{row.kind.startsWith("broadcast:") ? "Teks siaran & dashboard" : row.kind.startsWith("manual_reminder:") ? "Pengingat manual" : kinds[row.kind] ?? row.kind}<span aria-hidden="true"> · </span>{row.recipientName}</p>
        <div className="delivery-meta"><span>{row.phone || "Nomor belum diisi"}</span><span>{row.sentAt ? "Dikirim" : "Jadwal"} {formatTime(row.sentAt ?? row.scheduledAt)} WIB</span></div>
        {row.lastError && <p className="delivery-error">{row.lastError}</p>}
        {row.canRetry === true && <button type="button" disabled={busy !== null || !enabled} onClick={() => void retry(row.id)} className="text-action mt-2">{busy === row.id ? "Memproses…" : "Coba lagi"}</button>}
      </li>)}</ol>}
      <p className="delivery-footnote">Pesan dalam antrean belum tentu terkirim. Status diserahkan berarti WhatsApp menerima pesan, bukan berarti sudah dibaca. Status perlu diperiksa tidak diulang otomatis.</p>
    </section>
  );
}
