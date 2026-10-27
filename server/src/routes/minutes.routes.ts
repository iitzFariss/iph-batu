import { Router } from "express";
import { h } from "../lib/asyncHandler";
import prisma from "../lib/prisma";
import { minutesDeadline, readMinutesToken, prepareMinutesLinks } from "../lib/minutesLink";
import { notulensiSchema } from "../lib/schemas";
import { writeLimiter } from "../middleware/rateLimit";
import { cancelNotifications } from "../lib/whatsapp";

export const router = Router();
router.use((_req, _res, next) => { void prepareMinutesLinks().then(() => next(), next); });
async function readMeeting(token: string) {
  const data = readMinutesToken(token);
  if (!data) return null;
  const meeting = await prisma.rapat.findUnique({ where: { notulensiKey: data.key }, include: {
    petugas: { where: { pegawaiId: data.pegawaiId, peran: "notulis", pegawai: { status: "aktif" } }, include: { pegawai: true } }, notulensi: true,
  } });
  return meeting?.petugas.length && meeting.status !== "dibatalkan" ? meeting : null;
}
router.get("/:token", h(async (req, res) => {
  res.set("Cache-Control", "no-store");
  const meeting = await readMeeting(req.params.token);
  if (!meeting) { res.status(404).json({ message: "Tautan tidak valid, penugasan berubah, atau rapat dibatalkan." }); return; }
  const deadline = minutesDeadline(meeting);
  res.json({ topik: meeting.topik, tanggal: meeting.tanggal, notulis: meeting.petugas[0].pegawai.name,
    deadline, serverNow: new Date(), expired: deadline <= new Date(), isi: meeting.notulensi?.isi ?? "", submittedAt: meeting.notulensi?.submittedAt ?? null });
}));
router.post("/:token", writeLimiter, h(async (req, res) => {
  const body = notulensiSchema.parse(req.body);
  const result = await prisma.$transaction(async tx => {
    const data = readMinutesToken(req.params.token);
    if (!data) return 404;
    const meeting = await tx.rapat.findUnique({ where: { notulensiKey: data.key } });
    if (!meeting || meeting.status === "dibatalkan") return 404;
    const assignment = await tx.petugasRapat.findFirst({ where: { rapatId: meeting.id, pegawaiId: data.pegawaiId, peran: "notulis", pegawai: { status: "aktif" } } });
    if (!assignment) return 404;
    if (minutesDeadline(meeting) <= new Date()) return 410;
    await tx.notulensi.upsert({ where: { rapatId: meeting.id }, create: { rapatId: meeting.id, isi: body.isi, notulisPegawaiId: data.pegawaiId }, update: { isi: body.isi, notulisPegawaiId: data.pegawaiId } });
    if (meeting.tanggal <= new Date()) {
      await tx.rapat.update({ where: { id: meeting.id }, data: { status: "selesai" } });
      await cancelNotifications(tx, meeting.id, true);
    } else {
      await tx.whatsAppNotification.updateMany({ where: { rapatId: meeting.id, kind: "minutes_reminder", status: { in: ["pending", "failed", "missing_phone"] } }, data: { status: "cancelled" } });
    }
    await tx.auditLog.create({ data: { actorId: assignment.pegawaiId, aksi: "notulensi.tautan-disimpan", detail: meeting.id } });
    return 200;
  });
  res.status(result).json({ message: result === 200 ? "Notulensi berhasil disimpan." : result === 410 ? "Batas pengisian tujuh hari sudah berakhir." : "Tautan atau penugasan tidak berlaku." });
}));
export default router;
