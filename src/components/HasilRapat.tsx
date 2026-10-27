import { useEffect, useState } from "react";
import { api } from "../lib/api";
import PageHeading from "./PageHeading";
import MeetingMinutesEditor from "./MeetingMinutesEditor";

interface Meeting { id: string; topik: string; tanggal: string; lokasi: string | null; status: string; dapatNotulensi: boolean; notulensiDeadline: string | null; petugas: { pegawaiId: string; name: string; peran: string }[]; notulensi: { isi: string; by: string; submittedAt: string } | null }
export default function HasilRapat() {
  const [rows, setRows] = useState<Meeting[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    let cancelled = false;
    api.get<{ rows: Meeting[] }>("/rapat").then(result => { if (!cancelled) setRows(result.rows); }).catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [attempt]);
  const visible = (rows ?? []).filter(r => `${r.topik} ${r.petugas.map(p => p.name).join(" ")}`.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
  return <div className="space-y-6"><PageHeading title="Hasil rapat" description="Agenda, peserta, dan hasil notulensi rapat TPID." />
    <label className="field-stack">Cari rapat atau peserta<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Judul rapat atau nama peserta" /></label>
    {error ? <div className="form-surface" role="alert"><p>{error}</p><button className="secondary-action mt-3" onClick={() => { setError(""); setAttempt(v => v + 1); }}>Coba lagi</button></div> : rows === null ? <p role="status">Memuat hasil rapat…</p> : !visible.length ? <p className="form-surface">Tidak ada rapat yang sesuai.</p> : visible.map(r => <article className="form-surface field-stack" key={r.id}>
      <div className="section-heading"><div><h2>{r.topik}</h2><p>{new Date(r.tanggal).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long", timeStyle: "short" })} WIB{r.lokasi ? ` · ${r.lokasi}` : ""}</p></div><span className="text-sm">{r.status === "dibatalkan" ? "Dibatalkan" : r.notulensi ? "Notulensi tersedia" : "Belum diisi"}</span></div>
      <div><h3 className="font-semibold mb-2">Peserta rapat</h3><ul className="participant-list">{r.petugas.map(p => <li key={p.pegawaiId}>{p.name}{p.peran === "notulis" ? " · Notulis" : ""}</li>)}</ul></div>
      <MeetingMinutesEditor meeting={r} onSaved={saved => setRows(current => (current ?? []).map(row => row.id === saved.id ? saved : row))} />
      {!r.dapatNotulensi && !r.notulensi && <p className="text-sm text-gray-500">{r.status === "dibatalkan" ? "Rapat dibatalkan; pengisian ditutup." : r.notulensiDeadline && Date.parse(r.notulensiDeadline) <= now ? "Batas pengisian notulensi telah berakhir." : "Pengisian tersedia untuk notulis yang ditugaskan dan admin."}</p>}
      {r.notulensi ? <div className="minutes-result"><h3 className="font-semibold">Hasil notulensi</h3><p className="text-xs text-gray-500 my-2">Diisi oleh {r.notulensi.by} · {new Date(r.notulensi.submittedAt).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" })}</p><p className="whitespace-pre-wrap break-words">{r.notulensi.isi}</p></div> : <p className="text-sm text-gray-500">Hasil akan tampil setelah notulis menyimpan notulensi.</p>}
    </article>)}
  </div>;
}
