import { tautanWa } from "./phone";

export interface PetugasRapatRow {
  id: string;
  pegawaiId: string;
  name: string;
  instansi: string | null;
  peran: string;
}

export interface NotulensiRow {
  submittedAt: string;
  by: string;
}

export interface RapatDTO {
  id: string;
  topik: string;
  tanggal: string;
  lokasi: string | null;
  catatan: string | null;
  status: string;
  petugas: PetugasRapatRow[];
  notulensi: NotulensiRow | null;
  /** Benar jika peminta admin atau notulis rapat ini → boleh input notulensi. */
  dapatNotulensi: boolean;
}

interface RapatQueryRow {
  id: string;
  topik: string;
  tanggal: Date;
  lokasi: string | null;
  catatan: string | null;
  status: string;
  petugas: {
    id: string;
    peran: string;
    pegawai: { id: string; name: string; instansi: { nama: string } | null; userId: string | null };
  }[];
  notulensi: { submittedAt: Date; notulis: { name: string } } | null;
}

export interface Peminta {
  id: string;
  role: string;
}

export function toRapatDTO(rapat: RapatQueryRow, me?: Peminta): RapatDTO {
  return {
    id: rapat.id,
    topik: rapat.topik,
    tanggal: rapat.tanggal.toISOString(),
    lokasi: rapat.lokasi,
    catatan: rapat.catatan,
    status: rapat.status,
    petugas: rapat.petugas.map((p) => ({
      id: p.id,
      pegawaiId: p.pegawai.id,
      name: p.pegawai.name,
      instansi: p.pegawai.instansi?.nama ?? null,
      peran: p.peran,
    })),
    notulensi: rapat.notulensi
      ? { submittedAt: rapat.notulensi.submittedAt.toISOString(), by: rapat.notulensi.notulis.name }
      : null,
    dapatNotulensi: me
      ? me.role === "admin" ||
        rapat.petugas.some((p) => p.peran === "notulis" && p.pegawai.userId === me.id)
      : false,
  };
}

/** Selisih tanggal rapat dengan hari ini dalam satuan hari; negatif = sudah lewat. */
export function selisihHari(tanggal: Date, sekarang: Date = new Date()): number {
  const mulai = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  return Math.round((mulai.getTime() - hariIni.getTime()) / 86_400_000);
}

const FORMAT_HARI = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatTanggal(tanggal: Date): string {
  return FORMAT_HARI.format(tanggal);
}

export interface ReminderItem {
  id: string;
  tipe: "rapat" | "notulensi";
  rapatId: string;
  topik: string;
  tanggal: string;
  jatuhTempo: string;
  untuk: string;
  phone: string | null;
  pesan: string;
  waLink: string;
}

interface ReminderSource {
  rapatId: string;
  topik: string;
  tanggal: Date;
  status: string;
  petugas: {
    id: string;
    peran: string;
    name: string;
    phone: string | null;
  }[];
  notulensi: { notulisPegawaiId: string } | null;
}

/**
 * Reminder tidak disimpan sebagai baris; diturunkan dari data rapat setiap
 * kali diminta supaya tidak pernah melenceng dari jadwal terkini.
 *  - "rapat"      → H-1 dan H-0, untuk setiap petugas yang terdaftar.
 *  - "notulensi"  → sejak H+1 jika notulensi belum diisi, untuk notulis.
 */
export function susunReminder(rapat: ReminderSource): ReminderItem[] {
  if (rapat.status === "dibatalkan") return [];
  const selisih = selisihHari(rapat.tanggal);
  const hasil: ReminderItem[] = [];

  if (selisih === 1 || selisih === 0) {
    for (const p of rapat.petugas) {
      const pesan =
        `Pengingat TPID Kota Batu\n` +
        `Anda terdaftar sebagai ${p.peran} pada rapat:\n` +
        `"${rapat.topik}" — ${formatTanggal(rapat.tanggal)}.\n` +
        `Mohon hadir tepat waktu.`;
      hasil.push({
        id: `${rapat.rapatId}:rapat:${p.id}`,
        tipe: "rapat",
        rapatId: rapat.rapatId,
        topik: rapat.topik,
        tanggal: rapat.tanggal.toISOString(),
        jatuhTempo: selisih === 0 ? "Hari ini" : "Besok",
        untuk: p.name,
        phone: p.phone,
        pesan,
        waLink: tautanWa(p.phone, pesan),
      });
    }
  }

  if (!rapat.notulensi && selisih <= -1) {
    const notulis = rapat.petugas.find((p) => p.peran === "notulis");
    if (notulis) {
      const pesan =
        `Pengingat TPID Kota Batu\n` +
        `Notulensi rapat "${rapat.topik}" (${formatTanggal(rapat.tanggal)}) belum diisi. ` +
        `Mohon lengkapi notulensi segera.`;
      hasil.push({
        id: `${rapat.rapatId}:notulensi:${notulis.id}`,
        tipe: "notulensi",
        rapatId: rapat.rapatId,
        topik: rapat.topik,
        tanggal: rapat.tanggal.toISOString(),
        jatuhTempo: selisih === -1 ? "Kemarin (H+1)" : `${-selisih} hari lalu`,
        untuk: notulis.name,
        phone: notulis.phone,
        pesan,
        waLink: tautanWa(notulis.phone, pesan),
      });
    }
  }

  return hasil;
}