import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api";

interface Delivery {
  id: string; topik: string; recipientName: string; phone: string | null;
  kind: string; status: string; scheduledAt: string; sentAt: string | null;
  attempts: number; lastError: string | null;
}

const labels: Record<string, string> = {
  pending: "Menunggu", missing_phone: "Nomor belum diisi", sending: "Sedang dikirim",
  sent: "Diserahkan ke WhatsApp", failed: "Gagal", unknown: "Perlu diperiksa",
  cancelled: "Dibatalkan", expired: "Waktu rapat lewat",
};
const kinds: Record<string, string> = { invitation: "Undangan", updated: "Perubahan jadwal", reminder: "Pengingat hari ini" };

export default function RapatWhatsappStatus() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
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
  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5" aria-label="Pengiriman WhatsApp rapat">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900"><MessageCircle size={15} className="text-emerald-600" />Pengiriman WhatsApp</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Riwayat undangan, pengingat, dan teks siaran rapat. Menampilkan 100 pengiriman terbaru.</p>
        </div>
        <button type="button" onClick={() => void load()} className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 shrink-0"><RefreshCw size={12} />Muat ulang</button>
      </div>
      {loaded && !enabled && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-3">Pengiriman otomatis belum aktif. Jadwal dan nomor WhatsApp tetap dapat disiapkan.</p>}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
      {!loaded ? <p className="text-sm text-gray-400 py-4">Memuat riwayat pengiriman…</p> : rows.length === 0 ? <p className="text-sm text-gray-400 py-4">Belum ada antrean pengiriman. Undangan dibuat saat admin menyimpan rapat mendatang.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="text-gray-500 border-b border-gray-100"><tr><th className="py-2 pr-3 font-medium">Rapat / pesan</th><th className="py-2 pr-3 font-medium">Penerima</th><th className="py-2 pr-3 font-medium">Waktu (WIB)</th><th className="py-2 font-medium">Status</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id} className="border-b border-gray-100 last:border-0 align-top">
              <td className="py-3 pr-3"><div className="font-medium text-gray-900">{row.topik}</div><div className="text-gray-500 mt-1">{row.kind.startsWith("broadcast:") ? "Teks siaran & dashboard" : row.kind.startsWith("manual_reminder:") ? "Pengingat manual" : kinds[row.kind] ?? row.kind}</div></td>
              <td className="py-3 pr-3"><div className="text-gray-900">{row.recipientName}</div><div className="text-gray-500 mt-1">{row.phone || "Lengkapi nomor di Kelola Pegawai"}</div></td>
              <td className="py-3 pr-3 text-gray-600 whitespace-nowrap">{new Date(row.sentAt ?? row.scheduledAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="py-3"><span className={row.status === "sent" ? "text-emerald-700" : ["failed", "unknown", "missing_phone"].includes(row.status) ? "text-amber-700" : "text-gray-600"}>{labels[row.status] ?? row.status}</span>
                {row.lastError && <p className="text-gray-500 mt-1 max-w-xs">{row.lastError}</p>}
                {["failed", "missing_phone"].includes(row.status) && <button type="button" disabled={busy !== null || !enabled} onClick={() => void retry(row.id)} className="mt-2 text-emerald-700 underline underline-offset-2 disabled:opacity-40">{busy === row.id ? "Memproses…" : "Coba lagi"}</button>}
              </td>
            </tr>)}</tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-3">Status diserahkan berarti layanan menerima pesan, belum memastikan pesan dibaca. Pengiriman dengan status perlu diperiksa tidak diulang otomatis.</p>
        </div>
      )}
    </section>
  );
}
