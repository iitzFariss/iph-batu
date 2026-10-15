import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import { notulensiSchema, rapatCreateSchema, rapatUpdateSchema } from "../lib/schemas";
import { AuthedRequest, requireAuth, requireRoles } from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimit";
import { catatAudit } from "../lib/audit";
import { susunReminder, toRapatDTO } from "../lib/rapat";
import { automationEnabled, cancelNotifications, queueMeetingNotifications } from "../lib/whatsapp";
import { normalisasiNomorWa } from "../lib/phone";
import { meetingRecipients, publicPeriodLink, queueDispatch } from "../lib/meetingDispatch";
import { z } from "zod";

const broadcastSchema = z.object({ rekapId: z.string().min(1), text: z.string().trim().min(10).max(3300) });

export const router = Router();

const RAPAT_INCLUDE = {
  petugas: {
    include: { pegawai: { include: { instansi: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  notulensi: { include: { notulis: true } },
};

router.get("/:id/recipients", requireAuth, requireRoles("admin"), h(async (req, res) => {
  if (!await prisma.rapat.findUnique({ where: { id: req.params.id }, select: { id: true } })) { res.status(404).json({ message: "Rapat tidak ditemukan." }); return; }
  let dashboardLink: string | undefined;
  let configurationError: string | undefined;
  if (req.query.rekapId) {
    const record = await prisma.rekap.findUnique({ where: { id: z.string().parse(req.query.rekapId) } });
    if (!record) { res.status(404).json({ message: "Rekap tidak ditemukan." }); return; }
    try { dashboardLink = publicPeriodLink(record); } catch (error) { configurationError = (error as Error).message; }
  }
  res.json({ rows: await meetingRecipients(prisma, req.params.id), enabled: automationEnabled(), dashboardLink, configurationError });
}));

for (const mode of ["remind", "broadcast"] as const) {
  router.post(`/:id/${mode}`, writeLimiter, requireAuth, requireRoles("admin"), h(async (req, res) => {
    if (!automationEnabled()) { res.status(503).json({ message: "Pengiriman WhatsApp belum aktif." }); return; }
    const body = mode === "broadcast" ? broadcastSchema.parse(req.body) : undefined;
    const result = await prisma.$transaction(tx => queueDispatch(tx, req.params.id, body));
    if (result.error) { res.status(result.code ?? 400).json({ message: result.error }); return; }
    await catatAudit(req, `rapat.${mode}-diantrekan`, req.params.id);
    res.json({ ...result, message: `${result.queued} pesan masuk antrean. ${result.skipped} peserta dilewati. ${result.alreadyQueued} sudah pernah diantrekan.` });
  }));
}

router.get("/notifications", requireAuth, requireRoles("admin"), h(async (_req, res) => {
  const rows = await prisma.whatsAppNotification.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { rapat: { select: { topik: true, status: true, notificationRevision: true } } } });
  res.json({ enabled: automationEnabled(), rows: rows.map(row => ({
    id: row.id, rapatId: row.rapatId, topik: row.rapat.topik, recipientName: row.recipientName,
    phone: row.phone, kind: row.kind, status: row.status, scheduledAt: row.scheduledAt,
    sentAt: row.sentAt, attempts: row.attempts, lastError: row.lastError, expiresAt: row.expiresAt,
    canRetry: ["failed", "missing_phone"].includes(row.status) && row.expiresAt > new Date()
      && row.rapat.notificationRevision === row.revision
      && (row.kind.startsWith("broadcast:") ? row.rapat.status !== "dibatalkan" : row.rapat.status === "terjadwal"),
  })) });
}));

router.post("/notifications/:notificationId/retry", writeLimiter, requireAuth, requireRoles("admin"), h(async (req, res) => {
  const job = await prisma.whatsAppNotification.findUnique({ where: { id: req.params.notificationId }, include: { rapat: true } });
  if (!job) { res.status(404).json({ message: "Pengiriman tidak ditemukan." }); return; }
  if (!["failed", "missing_phone"].includes(job.status) || job.expiresAt <= new Date() || (job.kind.startsWith("broadcast:") ? job.rapat.status === "dibatalkan" : job.rapat.status !== "terjadwal") || job.rapat.notificationRevision !== job.revision) {
    res.status(409).json({ message: "Pengiriman ini tidak dapat diulang. Periksa status dan jadwal rapat." }); return;
  }
  const participant = await prisma.petugasRapat.findUnique({ where: { rapatId_pegawaiId: { rapatId: job.rapatId, pegawaiId: job.pegawaiId } }, include: { pegawai: { include: { user: { select: { phone: true } } } } } });
  const phone = normalisasiNomorWa(participant?.pegawai.phone ?? participant?.pegawai.user?.phone);
  if (!participant || participant.pegawai.status !== "aktif" || !phone) {
    res.status(400).json({ message: "Isi nomor WhatsApp yang valid pada pegawai aktif yang ditugaskan." }); return;
  }
  const result = await prisma.whatsAppNotification.updateMany({ where: { id: job.id, status: job.status }, data: { status: "pending", phone, attempts: 0, scheduledAt: new Date(), lastError: null } });
  if (!result.count) { res.status(409).json({ message: "Status pengiriman telah berubah. Muat ulang halaman." }); return; }
  await catatAudit(req, "rapat.whatsapp-diulang", job.id);
  res.json({ message: "Pesan kembali masuk antrean." });
}));

// ─── GET /api/rapat ───────────────────────────────────────────────────────
// Admin melihat semua; petugas hanya melihat rapat yang menyangkut dirinya
// (pegawai punya relasi ke akun User lewat userId).
router.get(
  "/",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const where =
      me.role === "admin"
        ? undefined
        : { petugas: { some: { pegawai: { userId: me.id } } } };

    const rows = await prisma.rapat.findMany({
      where,
      include: RAPAT_INCLUDE,
      orderBy: { tanggal: "desc" },
    });
    res.json({ rows: rows.map((r) => toRapatDTO(r, me)) });
  })
);

// ─── GET /api/rapat/reminders (admin) ─────────────────────────────────────
// Pengingat jatuh tempo yang "dikirim" lewat WhatsApp. Pengiriman manual oleh
// admin: aplikasi menyiapkan pesan + nomor, tombol Buka WhatsApp yang
// menuntaskan kirimnya. Berkas reminder hanya ada sesaat, tidak disimpan.
router.get(
  "/reminders",
  requireAuth,
  requireRoles("admin"),
  h(async (_req, res) => {
    const rows = await prisma.rapat.findMany({
      where: { status: { not: "dibatalkan" } },
      select: {
        id: true,
        topik: true,
        tanggal: true,
        status: true,
        petugas: {
          select: {
            id: true,
            peran: true,
            pegawai: {
              select: { id: true, name: true, phone: true, user: { select: { phone: true } } },
            },
          },
        },
        notulensi: { select: { notulisPegawaiId: true } },
      },
      orderBy: { tanggal: "desc" },
    });

    const items = rows
      .map((r) =>
        susunReminder({
          rapatId: r.id,
          topik: r.topik,
          tanggal: r.tanggal,
          status: r.status,
          petugas: r.petugas.map((p) => ({
            id: p.id,
            peran: p.peran,
            name: p.pegawai.name,
            phone: p.pegawai.phone ?? p.pegawai.user?.phone ?? null,
          })),
          notulensi: r.notulensi,
        })
      )
      .flat();

    items.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    res.json({ rows: items, total: items.length });
  })
);

// ─── GET /api/rapat/:id ───────────────────────────────────────────────────
router.get(
  "/:id",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const rapat = await prisma.rapat.findUnique({
      where: { id: req.params.id },
      include: RAPAT_INCLUDE,
    });
    if (!rapat) {
      res.status(404).json({ message: "Rapat tidak ditemukan." });
      return;
    }
    if (me.role !== "admin") {
      const bagian = rapat.petugas.some((p) => p.pegawai.userId === me.id);
      if (!bagian) {
        res.status(403).json({ message: "Anda tidak terdaftar pada rapat ini." });
        return;
      }
    }
    res.json({ rapat: toRapatDTO(rapat, me) });
  })
);

// ─── POST /api/rapat (admin) ──────────────────────────────────────────────
router.post(
  "/",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const body = rapatCreateSchema.parse(req.body);

    const ids = [...new Set(body.petugas.map((p) => p.pegawaiId))];
    const valid = await prisma.pegawai.findMany({
      where: { id: { in: ids }, status: "aktif" },
      select: { id: true },
    });
    if (valid.length !== ids.length) {
      res.status(400).json({ message: "Petugas yang dipilih tidak valid." });
      return;
    }

    const rapat = await prisma.$transaction(async tx => {
      const created = await tx.rapat.create({
      data: {
        topik: body.topik,
        tanggal: body.tanggal,
        lokasi: body.lokasi ?? null,
        catatan: body.catatan ?? null,
        createdById: me.id,
        petugas: {
          create: body.petugas.map((p) => ({
            pegawaiId: p.pegawaiId,
            peran: p.peran,
          })),
        },
      },
      include: RAPAT_INCLUDE,
      });
      await queueMeetingNotifications(tx, created.id);
      return created;
    });

    await catatAudit(req, "rapat.dibuat", rapat.topik);
    res.status(201).json({ message: "Rapat berhasil dibuat.", rapat: toRapatDTO(rapat, me) });
  })
);

// ─── PATCH /api/rapat/:id (admin) ─────────────────────────────────────────
router.patch(
  "/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const rapat = await prisma.rapat.findUnique({ where: { id: req.params.id }, include: { petugas: true } });
    if (!rapat) {
      res.status(404).json({ message: "Rapat tidak ditemukan." });
      return;
    }
    const body = rapatUpdateSchema.parse(req.body);

    let petugasGanti: { pegawaiId: string; peran: string }[] | null = null;
    if (body.petugas) {
      const ids = [...new Set(body.petugas.map((p) => p.pegawaiId))];
      const valid = await prisma.pegawai.findMany({
        where: { id: { in: ids }, status: "aktif" },
        select: { id: true },
      });
      if (valid.length !== ids.length) {
        res.status(400).json({ message: "Petugas yang dipilih tidak valid." });
        return;
      }
      petugasGanti = body.petugas.map((p) => ({ pegawaiId: p.pegawaiId, peran: p.peran }));
    }

    const changed = (body.topik !== undefined && body.topik !== rapat.topik)
      || (body.tanggal !== undefined && body.tanggal.getTime() !== rapat.tanggal.getTime())
      || (body.lokasi !== undefined && body.lokasi !== rapat.lokasi)
      || (body.status !== undefined && body.status !== rapat.status)
      || (petugasGanti !== null && JSON.stringify(petugasGanti.map(p => `${p.pegawaiId}:${p.peran}`).sort()) !== JSON.stringify(rapat.petugas.map(p => `${p.pegawaiId}:${p.peran}`).sort()));
    const updated = await prisma.$transaction(async (tx) => {
      await tx.rapat.update({
        where: { id: rapat.id },
        data: {
          ...(body.topik ? { topik: body.topik } : {}),
          ...(body.tanggal ? { tanggal: body.tanggal } : {}),
          ...(body.lokasi !== undefined ? { lokasi: body.lokasi ?? null } : {}),
          ...(body.catatan !== undefined ? { catatan: body.catatan ?? null } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(changed ? { notificationRevision: { increment: 1 } } : {}),
        },
        include: RAPAT_INCLUDE,
      });
      if (petugasGanti) {
        await tx.petugasRapat.deleteMany({ where: { rapatId: rapat.id } });
        for (const p of petugasGanti) {
          await tx.petugasRapat.create({
            data: { rapatId: rapat.id, pegawaiId: p.pegawaiId, peran: p.peran },
          });
        }
      }
      if (changed) {
        await cancelNotifications(tx, rapat.id);
        await queueMeetingNotifications(tx, rapat.id, "updated");
      }
      return tx.rapat.findUniqueOrThrow({ where: { id: rapat.id }, include: RAPAT_INCLUDE });
    });

    await catatAudit(req, "rapat.diubah", rapat.topik);
    res.json({ message: "Rapat berhasil diperbarui.", rapat: toRapatDTO(updated, me) });
  })
);

// ─── DELETE /api/rapat/:id (admin) ────────────────────────────────────────
router.delete(
  "/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const rapat = await prisma.rapat.findUnique({ where: { id: req.params.id } });
    if (!rapat) {
      res.status(404).json({ message: "Rapat tidak ditemukan." });
      return;
    }
    await catatAudit(req, "rapat.dihapus", rapat.topik);
    await prisma.rapat.delete({ where: { id: rapat.id } });
    res.json({ message: "Rapat berhasil dihapus." });
  })
);

// ─── POST /api/rapat/:id/notulensi ────────────────────────────────────────
// Notulensi diisi oleh notulis rapat (petugas yang terdaftar dengan peran
// notulis) atau admin. Petugas lain yang hanya berperan peserta ditolak.
router.post(
  "/:id/notulensi",
  writeLimiter,
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const rapat = await prisma.rapat.findUnique({
      where: { id: req.params.id },
      include: { petugas: { include: { pegawai: true } } },
    });
    if (!rapat) {
      res.status(404).json({ message: "Rapat tidak ditemukan." });
      return;
    }

    const notulisBagian = rapat.petugas.find(
      (p) => p.peran === "notulis" && p.pegawai.userId === me.id
    );
    if (me.role !== "admin" && !notulisBagian) {
      res.status(403).json({
        message: "Hanya notulis rapat ini atau admin yang dapat mengisi notulensi.",
      });
      return;
    }
    const notulisPegawaiId = notulisBagian?.pegawaiId ?? me.role === "admin"
      ? rapat.petugas.find((p) => p.peran === "notulis")?.pegawaiId ?? rapat.petugas[0]?.pegawaiId
      : undefined;

    if (!notulisPegawaiId) {
      res.status(400).json({ message: "Rapat belum memiliki petugas notulis." });
      return;
    }

    const body = notulensiSchema.parse(req.body);
    await prisma.$transaction(async (tx) => {
      await tx.notulensi.upsert({
        where: { rapatId: rapat.id },
        create: {
          rapatId: rapat.id,
          isi: body.isi,
          notulisPegawaiId,
        },
        update: { isi: body.isi, notulisPegawaiId },
      });
      // Notulensi yang tersimpan menandai rapat selesai. Rapat yang sudah
      // dibatalkan tidak dihidupkan lagi oleh notulensi yang telat masuk.
      if (rapat.status !== "dibatalkan") {
        await tx.rapat.update({ where: { id: rapat.id }, data: { status: "selesai" } });
        await cancelNotifications(tx, rapat.id, true);
      }
    });

    const final = await prisma.rapat.findUnique({
      where: { id: rapat.id },
      include: RAPAT_INCLUDE,
    });
    res.json({ message: "Notulensi berhasil disimpan.", rapat: toRapatDTO(final!, me) });
  })
);

export default router;
