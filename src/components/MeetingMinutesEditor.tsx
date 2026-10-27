import { useId, useState } from "react";
import { api } from "../lib/api";

export interface EditableMinutesMeeting {
  id: string;
  dapatNotulensi: boolean;
  notulensiDeadline?: string | null;
  notulensi: { isi: string; by: string; submittedAt: string } | null;
}

export default function MeetingMinutesEditor<T extends EditableMinutesMeeting>({ meeting, onSaved }: { meeting: T; onSaved: (meeting: T) => void }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [closed, setClosed] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (text.trim().length < 10) { setError("Isi notulensi minimal 10 karakter."); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await api.post<{ rapat: T }>(`/rapat/${meeting.id}/notulensi`, { isi: text.trim() });
      onSaved(result.rapat); setEditing(false); setSuccess("Notulensi berhasil disimpan.");
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof Error && "status" in e && e.status === 410) setClosed(true);
    } finally { setBusy(false); }
  }
  return <div className="field-stack">
    {meeting.dapatNotulensi && !closed && !editing && <div><button type="button" className="primary-action" onClick={() => { setText(meeting.notulensi?.isi ?? ""); setError(""); setSuccess(""); setEditing(true); }}>{meeting.notulensi ? "Ubah notulensi" : "Isi notulensi"}</button></div>}
    {editing && <form onSubmit={save} className="field-stack">
      <label htmlFor={id}>Hasil notulensi</label>
      {meeting.notulensiDeadline && <p className="text-sm text-gray-500">Batas pengisian: {new Date(meeting.notulensiDeadline).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB</p>}
      <textarea id={id} rows={10} maxLength={50000} value={text} onChange={e => setText(e.target.value)} disabled={busy || closed} placeholder="Tuliskan pembahasan, keputusan, dan tindak lanjut rapat." autoFocus />
      <p className="text-xs text-gray-500">Minimal 10 karakter. {text.length.toLocaleString("id-ID")} / 50.000 karakter.</p>
      <div className="dialog-actions"><button type="button" className="secondary-action" disabled={busy} onClick={() => { setEditing(false); setError(""); }}>Batal</button><button type="submit" className="primary-action" disabled={busy || closed}>{busy ? "Menyimpan…" : "Simpan notulensi"}</button></div>
    </form>}
    {error && <p role="alert" className="error-message">{error}</p>}
    {success && <p role="status" className="text-emerald-700">{success}</p>}
  </div>;
}
