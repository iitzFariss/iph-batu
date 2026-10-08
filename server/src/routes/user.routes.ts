import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import { userUpdateSchema } from "../lib/schemas";
import { generateTemporaryPassword, hashPassword } from "../lib/security";
import { AuthedRequest, requireAuth, requireRoles } from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimit";
import { catatAudit } from "../lib/audit";

export const router = Router();

// Jalur kunci admin: daftar akun, ubah role/status (approve pending, aktifkan/
// nonaktifkan), dan reset kata sandi. Akun admin dan akun tamu sengaja dibatasi:
// mengubahnya lewat API bisa mengunci satu-satunya pengelola atau memutus login publik.

const USER_INCLUDE = {
  instansi: true,
  pegawai: { select: { id: true, name: true } },
};

function toAdminDTO(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  nip: string | null;
  phone: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  isSelf: boolean;
  instansi: { nama: string } | null;
  pegawai: { id: string; name: string } | null;
  sessionCount: number;
}) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    instansi: u.instansi?.nama ?? null,
    nip: u.nip ?? null,
    phone: u.phone ?? null,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    isSelf: u.isSelf,
    pegawaiId: u.pegawai?.id ?? null,
    pegawaiName: u.pegawai?.name ?? null,
    sessionCount: u.sessionCount,
  };
}

// ─── GET /api/users (admin) ────────────────────────────────────────────────
// Akun yang menunggu aktivasi tampil paling atas; sisanya urut nama.
router.get(
  "/",
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const users = await prisma.user.findMany({
      include: {
        ...USER_INCLUDE,
        _count: { select: { sessions: { where: { revokedAt: null } } } },
      },
      orderBy: [{ status: "desc" }, { name: "asc" }],
    });

    const rows = users.map((u) =>
      toAdminDTO({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        nip: u.nip,
        phone: u.phone,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        isSelf: u.id === me.id,
        instansi: u.instansi,
        pegawai: u.pegawai,
        sessionCount: u._count.sessions,
      })
    );

    // Pending selalu di depan, lalu berdasarkan status_string bukan alfabetis.
    const urutan: Record<string, number> = { pending: 0, aktif: 1, nonaktif: 2 };
    rows.sort((a, b) => (urutan[a.status] ?? 9) - (urutan[b.status] ?? 9) || a.name.localeCompare(b.name));

    res.json({
      rows,
      ringkasan: {
        total: users.length,
        pending: users.filter((u) => u.status === "pending").length,
        aktif: users.filter((u) => u.status === "aktif").length,
      },
    });
  })
);

// ─── PATCH /api/users/:id (admin) ──────────────────────────────────────────
router.patch(
  "/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const body = userUpdateSchema.parse(req.body);

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { instansi: true, pegawai: { select: { id: true, name: true } } },
    });
    if (!target) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }

    if (target.id === me.id) {
      res.status(400).json({ message: "Anda tidak dapat mengubah akun Anda sendiri." });
      return;
    }

    if (target.role === "admin" && (body.role !== undefined || body.status !== undefined)) {
      res.status(400).json({ message: "Role dan status akun administrator dikelola langsung." });
      return;
    }

    if (target.role === "tamu" && body.role !== undefined) {
      res.status(400).json({ message: "Role akun tamu tidak dapat diubah." });
      return;
    }

    const data: { role?: string; status?: string } = {};
    if (body.role !== undefined) data.role = body.role;
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.$transaction(async (tx) => {
      const hasil = await tx.user.update({
        where: { id: target.id },
        data,
        include: USER_INCLUDE,
      });
      // User yang dinonaktifkan langsung dicabut semua sesinya; kalau tidak,
      // akun "nonaktif" tetap bisa memakai cookie refresh lama sampai 30 hari.
      if (data.status === "nonaktif") {
        await tx.session.updateMany({
          where: { userId: target.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return hasil;
    });

    const sessionCount = await prisma.session.count({
      where: { userId: target.id, revokedAt: null },
    });

    const change =
      `${body.status ? `status ${target.status} -> ${body.status}` : ""}` +
      `${body.role ? ` role ${target.role} -> ${body.role}` : ""}`.trim();
    await catatAudit(req, "user.diubah", `${target.email} (${change.trim()})`);

    res.json({
      message: "Akun berhasil diperbarui.",
      user: toAdminDTO({
        ...updated,
        isSelf: false,
        lastLoginAt: updated.lastLoginAt,
        sessionCount,
        pegawai: updated.pegawai,
      }),
    });
  })
);

// ─── POST /api/users/:id/reset-password (admin) ────────────────────────────
router.post(
  "/:id/reset-password",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (target.id === me.id) {
      res.status(400).json({ message: "Ganti kata sandi sendiri lewat menu Pengaturan Akun." });
      return;
    }

    const temporaryPassword = generateTemporaryPassword();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: { password: await hashPassword(temporaryPassword), status: "aktif" },
      });
      // Reset mencabut semua sesi lama: pemegang cookie refresh lama tidak
      // boleh menyamar setelah kata sandi diunggah ulang oleh admin.
      await tx.session.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await catatAudit(req, "user.reset-password", target.email);

    res.json({
      message: "Kata sandi berhasil direset.",
      temporaryPassword,
      email: target.email,
    });
  })
);

export default router;