import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { normalisasiNomorWa } from "./phone";
import { meetingMessage } from "./whatsapp";

export function wibDay(date: Date): string {
  return new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10);
}

export function publicPeriodLink(period: { tahun: number; bulan: number; mingguIndeks: number }): string {
  const base = process.env.PUBLIC_APP_URL;
  if (!base) throw new Error("Isi PUBLIC_APP_URL pada backend dengan alamat web yang dapat dibuka peserta.");
  const url = new URL(base);
  if (!["http:", "https:"].includes(url.protocol) || ["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"].includes(url.hostname)) {
    throw new Error("PUBLIC_APP_URL harus dapat dibuka dari ponsel peserta, bukan localhost.");
  }
  url.hash = `/publik?tahun=${period.tahun}&bulan=${period.bulan}&minggu=${period.mingguIndeks}`;
  return url.toString();
}

export async function meetingRecipients(tx: Prisma.TransactionClient, rapatId: string) {
  const rows = await tx.petugasRapat.findMany({ where: { rapatId }, include: { pegawai: { include: { user: { select: { phone: true } } } } }, orderBy: { createdAt: "asc" } });
  const seen = new Set<string>();
  return rows.map(row => {
    const phone = normalisasiNomorWa(row.pegawai.phone ?? row.pegawai.user?.phone);
    const reason = row.pegawai.status !== "aktif" ? "Pegawai tidak aktif" : !phone ? "Nomor WhatsApp belum diisi" : seen.has(phone) ? "Nomor sama dengan peserta lain" : null;
    if (!reason && phone) seen.add(phone);
    return { pegawaiId: row.pegawaiId, name: row.pegawai.name, peran: row.peran, phone, reason };
  });
}

export async function queueDispatch(tx: Prisma.TransactionClient, rapatId: string, broadcast?: { rekapId: string; text: string }, now = new Date()) {
  const meeting = await tx.rapat.findUnique({ where: { id: rapatId } });
  if (!meeting) return { error: "Rapat tidak ditemukan.", code: 404 } as const;
  const day = wibDay(meeting.tanggal);
  if (meeting.status === "dibatalkan" || day < wibDay(now) || (!broadcast && (meeting.status !== "terjadwal" || meeting.tanggal <= now))) {
    return { error: "Rapat sudah lewat, selesai, atau dibatalkan.", code: 409 } as const;
  }
  let text = "";
  let link: string | undefined;
  let kind = `manual_reminder:${wibDay(now)}`;
  if (broadcast) {
    if (day !== wibDay(now)) return { error: "Teks siaran hanya dapat dikirim pada tanggal pelaksanaan rapat (WIB).", code: 409 } as const;
    const record = await tx.rekap.findUnique({ where: { id: broadcast.rekapId } });
    if (!record) return { error: "Rekap periode yang dipilih tidak tersedia.", code: 404 } as const;
    try { link = publicPeriodLink(record); } catch (error) { return { error: (error as Error).message, code: 400 } as const; }
    text = `${broadcast.text}\n\nDashboard analisis periode ini:\n${link}`;
    if (text.length > 4000) return { error: "Teks beserta link maksimal 4.000 karakter. Ringkas draf terlebih dahulu.", code: 400 } as const;
    kind = `broadcast:${record.id}:${createHash("sha256").update(text).digest("hex").slice(0, 20)}`;
  }
  const recipients = await meetingRecipients(tx, rapatId);
  const eligible = recipients.filter(row => !row.reason);
  if (!eligible.length) return { error: "Belum ada peserta aktif dengan nomor WhatsApp yang valid.", code: 400 } as const;
  let queued = 0;
  for (const recipient of eligible) {
    const key = { rapatId, pegawaiId: recipient.pegawaiId, kind, revision: meeting.notificationRevision };
    const existing = await tx.whatsAppNotification.findUnique({ where: { rapatId_pegawaiId_kind_revision: key }, select: { id: true } });
    if (existing) continue;
    await tx.whatsAppNotification.upsert({ where: { rapatId_pegawaiId_kind_revision: key }, update: {}, create: {
      ...key, recipientName: recipient.name, phone: recipient.phone,
      message: broadcast ? text : meetingMessage(meeting, recipient.name, recipient.peran, "reminder", recipient.pegawaiId).replace("Pengingat rapat hari ini", day === wibDay(now) ? "Pengingat rapat hari ini" : "Pengingat jadwal rapat"),
      scheduledAt: now, expiresAt: broadcast ? new Date(`${day}T23:59:59.999+07:00`) : meeting.tanggal,
    } });
    queued++;
  }
  return { queued, skipped: recipients.length - eligible.length, alreadyQueued: eligible.length - queued, dashboardLink: link };
}
