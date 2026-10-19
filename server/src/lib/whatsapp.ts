import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { normalisasiNomorWa } from "./phone";
import { log } from "./logger";
import { hostname } from "node:os";

const WIB = 7 * 60 * 60 * 1000;
const MINUTE = 60_000;
const writable = ["pending", "missing_phone", "failed"];

export function automationEnabled(): boolean {
  return process.env.WHATSAPP_AUTOMATION_ENABLED === "true" && Boolean(process.env.N8N_WHATSAPP_WEBHOOK_URL && process.env.N8N_WHATSAPP_TOKEN);
}

/** 07:00 WIB on the meeting date, or one hour before meetings earlier than 08:00. */
export function reminderTime(meeting: Date): Date {
  const day = new Date(meeting.getTime() + WIB).toISOString().slice(0, 10);
  const morning = new Date(`${day}T07:00:00+07:00`);
  const midnight = new Date(`${day}T00:00:00+07:00`);
  return new Date(Math.max(midnight.getTime(), Math.min(morning.getTime(), meeting.getTime() - 60 * MINUTE)));
}

export function meetingMessage(meeting: { topik: string; tanggal: Date; lokasi: string | null }, name: string, role: string, kind: string): string {
  const date = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(meeting.tanggal);
  const time = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(meeting.tanggal);
  const title = kind === "reminder" ? "Pengingat rapat hari ini" : kind === "updated" ? "Perubahan jadwal rapat" : "Undangan rapat TPID Kota Batu";
  return `${title}\n\nYth. Bapak/Ibu ${name},\nAnda terdaftar sebagai ${role === "notulis" ? "notulis" : "peserta"} pada rapat:\n${meeting.topik}\n\nHari/tanggal: ${date}\nWaktu: ${time} WIB\nTempat: ${meeting.lokasi || "Akan diinformasikan"}\n\nMohon hadir tepat waktu.`;
}

export async function cancelNotifications(tx: Prisma.TransactionClient, rapatId: string, keepBroadcast = false): Promise<void> {
  await tx.whatsAppNotification.updateMany({ where: { rapatId, status: { in: writable }, ...(keepBroadcast ? { NOT: { kind: { startsWith: "broadcast:" } } } : {}) }, data: { status: "cancelled", lastError: "Jadwal atau penugasan telah berubah." } });
}

export async function queueMeetingNotifications(tx: Prisma.TransactionClient, rapatId: string, kind: "invitation" | "updated" | "reminder_only" = "invitation", now = new Date()): Promise<void> {
  const meeting = await tx.rapat.findUnique({ where: { id: rapatId }, include: { petugas: { include: { pegawai: { include: { user: { select: { phone: true } } } } } } } });
  if (!meeting || meeting.status !== "terjadwal" || meeting.tanggal <= now) return;
  const reminder = reminderTime(meeting.tanggal);
  for (const participant of meeting.petugas) {
    if (participant.pegawai.status !== "aktif") continue;
    const phone = normalisasiNomorWa(participant.pegawai.phone ?? participant.pegawai.user?.phone);
    const events: { kind: string; scheduledAt: Date }[] = kind === "reminder_only" ? [] : [{ kind, scheduledAt: now }];
    // An immediate invitation/update already covers a reminder whose scheduled time has passed.
    if (reminder < meeting.tanggal && (reminder > now || kind === "reminder_only")) {
      events.push({ kind: "reminder", scheduledAt: new Date(Math.max(reminder.getTime(), now.getTime())) });
    }
    for (const event of events) {
      const key = { rapatId, pegawaiId: participant.pegawaiId, kind: event.kind, revision: meeting.notificationRevision };
      await tx.whatsAppNotification.upsert({ where: { rapatId_pegawaiId_kind_revision: key }, update: {}, create: {
        ...key, recipientName: participant.pegawai.name, phone,
        message: meetingMessage(meeting, participant.pegawai.name, participant.peran, event.kind),
        scheduledAt: event.scheduledAt, expiresAt: meeting.tanggal, status: phone ? "pending" : "missing_phone",
      } });
    }
  }
}

export type SendResult = { status: "sent" | "failed" | "unknown"; messageId?: string; error?: string };

export async function queueMinutesReminders(now = new Date()): Promise<void> {
  const today = new Date(now.getTime() + WIB).toISOString().slice(0, 10);
  const due = new Date(`${today}T09:00:00+07:00`);
  if (now < due) return;
  const dayStart = new Date(`${today}T00:00:00+07:00`);
  const meetings = await prisma.rapat.findMany({ where: {
    tanggal: { gte: new Date(dayStart.getTime() - 86_400_000), lt: dayStart },
    status: { not: "dibatalkan" }, notulensi: { is: null },
  }, include: { petugas: { where: { peran: "notulis", pegawai: { status: "aktif" } }, include: { pegawai: { include: { user: { select: { phone: true } } } } } } } });
  for (const meeting of meetings) {
    for (const participant of meeting.petugas) {
      const phone = normalisasiNomorWa(participant.pegawai.phone ?? participant.pegawai.user?.phone);
      const key = { rapatId: meeting.id, pegawaiId: participant.pegawaiId, kind: "minutes_reminder", revision: meeting.notificationRevision };
      const date = meeting.tanggal.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" });
      const baseUrl = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
      const message = `Pengingat pengisian notulensi\n\nYth. Bapak/Ibu ${participant.pegawai.name},\nNotulensi rapat ${meeting.topik} pada ${date} belum diisi. Mohon lengkapi notulensi melalui menu Kelola rapat.${baseUrl ? `\n\n${baseUrl}` : ""}\n\nTerima kasih.`;
      await prisma.whatsAppNotification.upsert({ where: { rapatId_pegawaiId_kind_revision: key }, update: {}, create: {
        ...key, recipientName: participant.pegawai.name, phone, message,
        scheduledAt: due, expiresAt: new Date(dayStart.getTime() + 86_400_000), status: phone ? "pending" : "missing_phone",
      } });
    }
  }
}

export async function sendViaN8n(job: { id: string; phone: string; message: string; kind: string; rapatId: string; expiresAt: Date }, request: typeof fetch = fetch): Promise<SendResult> {
  try {
    const response = await request(process.env.N8N_WHATSAPP_WEBHOOK_URL!, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.N8N_WHATSAPP_TOKEN}`, "X-IPH-Event-ID": job.id },
      body: JSON.stringify({ eventId: job.id, rapatId: job.rapatId, kind: job.kind.startsWith("broadcast:") ? "broadcast" : job.kind === "minutes_reminder" || job.kind.startsWith("manual_reminder:") ? "reminder" : job.kind, phone: job.phone, message: job.message, expiresAt: job.expiresAt.toISOString() }),
      signal: AbortSignal.timeout(45_000), redirect: "error",
    });
    // Only definite rejection before a send may be retried. A server error could
    // occur after WAHA accepted the message, so it must not cause an automatic resend.
    if (response.status === 401 || response.status === 403) return { status: "failed", error: `Autentikasi n8n ditolak (HTTP ${response.status}). Samakan N8N_WHATSAPP_TOKEN pada setiap backend yang memproses antrean dengan token workflow n8n.` };
    if ([400, 404, 422, 429].includes(response.status)) return { status: "failed", error: `Layanan menolak permintaan (HTTP ${response.status}).` };
    if (!response.ok) return { status: "unknown", error: "Layanan mengalami gangguan; periksa riwayat n8n sebelum mengirim ulang." };
    const body = await response.json() as { ok?: boolean; messageId?: string; eventId?: string; dryRun?: boolean };
    if (body.ok === true && body.dryRun !== true && body.eventId === job.id && typeof body.messageId === "string" && body.messageId.length > 0) {
      return { status: "sent", messageId: body.messageId.slice(0, 300) };
    }
    return { status: "unknown", error: "Respons belum mengonfirmasi ID pesan; periksa riwayat n8n." };
  } catch (error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    return code === "ECONNREFUSED" || code === "ENOTFOUND"
      ? { status: "failed", error: "Layanan n8n belum dapat dijangkau." }
      : { status: "unknown", error: "Koneksi terputus; status pengiriman perlu diperiksa di n8n." };
  }
}

let running = false;
export async function processNotifications(now = new Date()): Promise<void> {
  if (running || !automationEnabled()) return;
  running = true;
  try {
    await queueMinutesReminders(now);
    // A crashed worker may have sent the request. Never blindly retry its lease.
    await prisma.whatsAppNotification.updateMany({ where: { status: "sending", startedAt: { lt: new Date(now.getTime() - 5 * MINUTE) } }, data: { status: "unknown", lastError: "Proses pengiriman terputus; periksa riwayat n8n." } });
    await prisma.whatsAppNotification.updateMany({ where: { status: { in: writable }, expiresAt: { lte: now } }, data: { status: "expired", lastError: "Batas waktu pengiriman telah lewat." } });
    const jobs = await prisma.whatsAppNotification.findMany({ where: { status: { in: writable }, scheduledAt: { lte: now }, expiresAt: { gt: now }, attempts: { lt: 3 } }, orderBy: { scheduledAt: "asc" }, take: 20 });
    for (const job of jobs) {
      const participant = await prisma.petugasRapat.findUnique({ where: { rapatId_pegawaiId: { rapatId: job.rapatId, pegawaiId: job.pegawaiId } }, include: { rapat: { include: { notulensi: { select: { id: true } } } }, pegawai: { include: { user: { select: { phone: true } } } } } });
      const invalidMeeting = participant && (job.kind === "minutes_reminder"
        ? participant.rapat.status === "dibatalkan" || Boolean(participant.rapat.notulensi) || participant.peran !== "notulis"
        : job.kind.startsWith("broadcast:") ? participant.rapat.status === "dibatalkan" : participant.rapat.status !== "terjadwal");
      if (!participant || invalidMeeting || participant.rapat.notificationRevision !== job.revision || participant.pegawai.status !== "aktif") {
        await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: { in: writable } }, data: { status: "cancelled", lastError: "Rapat atau penugasan sudah tidak aktif." } });
        continue;
      }
      const reminder = reminderTime(participant.rapat.tanggal);
      if (job.kind === "reminder" && job.createdAt >= reminder) {
        const immediate = await prisma.whatsAppNotification.findFirst({ where: {
          rapatId: job.rapatId, pegawaiId: job.pegawaiId, revision: job.revision,
          kind: { in: ["invitation", "updated"] }, createdAt: { gte: reminder },
          status: { notIn: ["cancelled", "expired"] },
        }, select: { id: true } });
        if (immediate) {
          await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: { in: writable } }, data: {
            status: "cancelled", lastError: "Pengingat bersamaan dibatalkan karena undangan atau perubahan jadwal sudah menjadi pemberitahuan langsung.",
          } });
          continue;
        }
      }
      const phone = normalisasiNomorWa(participant.pegawai.phone ?? participant.pegawai.user?.phone);
      if (!phone) {
        await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: { in: writable } }, data: { status: "missing_phone", lastError: "Nomor WhatsApp belum diisi.", scheduledAt: new Date(now.getTime() + MINUTE) } });
        continue;
      }
      const claimed = await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: { in: writable }, attempts: job.attempts }, data: { status: "sending", phone, startedAt: new Date(), attempts: { increment: 1 }, lastError: null } });
      if (!claimed.count) continue;
      const result = await sendViaN8n({ ...job, phone });
      if (result.status !== "sent") log.warn("whatsapp.pengirimanGagal", { notificationId: job.id, status: result.status, message: result.error, worker: hostname(), pid: process.pid });
      await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: "sending" }, data: {
        status: result.status, providerMessageId: result.messageId ?? null, sentAt: result.status === "sent" ? new Date() : null,
        lastError: result.error ?? null, ...(result.status === "failed" ? { scheduledAt: new Date(Date.now() + 5 * MINUTE) } : {}),
      } });
    }
  } finally { running = false; }
}

export function startNotificationWorker(): () => void {
  const tick = () => { void processNotifications().catch(() => log.warn("whatsapp.worker.gagal", { message: "Antrean WhatsApp belum dapat diproses." })); };
  tick();
  const timer = setInterval(tick, 15_000);
  timer.unref();
  return () => clearInterval(timer);
}
