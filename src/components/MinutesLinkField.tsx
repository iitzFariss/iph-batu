import { useState } from "react";
import { api } from "../lib/api";

export interface MinutesDraft { key: string; url: string; pegawaiId: string }
export default function MinutesLinkField({ pegawaiId, rapatId, initialLink, value, onChange }: { pegawaiId?: string; rapatId?: string; initialLink?: string | null; value: MinutesDraft | null; onChange: (value: MinutesDraft) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const url = value && value.pegawaiId === pegawaiId ? value.url : initialLink ?? "";
  async function generate() {
    setBusy(true); setError("");
    try { const result = await api.post<{ key: string; url: string }>("/rapat/notulensi-link", { pegawaiId, rapatId }); onChange({ ...result, pegawaiId: pegawaiId! }); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="field-stack"><label>Tautan notulensi <span className="required-label">Wajib</span><input type="text" value={url} readOnly placeholder="Pilih notulis, lalu buat tautan" /></label>
    <button type="button" className="secondary-action" onClick={() => void generate()} disabled={!pegawaiId || busy}>{busy ? "Membuat tautan…" : url ? "Perbarui tautan notulensi" : "Buat tautan notulensi"}</button>
    {url && rapatId && <a className="secondary-action" href={new URL(url, window.location.origin).hash} target="_blank" rel="noopener noreferrer">Buka formulir notulensi</a>}
    {url && !rapatId && <p className="text-sm text-gray-500">Simpan jadwal rapat terlebih dahulu agar tautan ini dapat digunakan.</p>}
    <p className="text-xs text-gray-500">Dikirim kepada notulis melalui undangan WhatsApp. Pengisian dibuka sejak undangan diterima sampai tujuh hari setelah dikirim.</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
