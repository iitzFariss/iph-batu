import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import {
  komoditasCreateSchema,
  pegawaiSchema,
  pegawaiUpdateSchema,
} from "../lib/schemas";
import { generateTemporaryPassword, hashPassword } from "../lib/security";
import { AuthedRequest, requireAuth, requireRoles } from "../middleware/auth";
import { writeLimiter } from "../middleware/rateLimit";
import { findOrCreateInstansi, toPegawaiDTO } from "./master.helpers";
import { invalidateSummary } from "../lib/rekapCache";
import { catatAudit } from "../lib/audit";

export const router = Router();

// ─── GET /api/instansi ─────────────────────────────────────────────────---
router.get(
  "/instansi",
  requireAuth,
  requireRoles("admin", "petugas"),
  h(async (_req, res) => {
    const rows = await prisma.instansi.findMany({ orderBy: { nama: "asc" } });
    res.json({ rows: rows.map((i) => ({ id: i.id, nama: i.nama })) });
  })
);

// ─── GET /api/komoditas ──────────────────────────────────────────────────
router.get(
  "/komoditas",
  requireAuth,
  h(async (_req, res) => {
    const rows = await prisma.komoditas.findMany({
      where: { isActive: true },
      orderBy: { nama: "asc" },
    });
    res.json({ rows: rows.map((k) => ({ id: k.id, nama: k.nama, unit: k.unit })) });
  })
);

// ─── POST /api/komoditas ──────────────────────────────────────────────────
router.post(
  "/komoditas",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const body = komoditasCreateSchema.parse(req.body);
    const nama = body.nama.trim();
    const existing = await prisma.komoditas.findFirst({
      where: { namaNorm: nama.toLowerCase() },
    });
    if (existing) {
      res.status(409).json({ message: "Nama komoditas sudah ada." });
      return;
    }
    const kom = await prisma.komoditas.create({
      data: { nama, namaNorm: nama.toLowerCase(), unit: body.unit ?? null },
    });
    res.status(201).json({ message: "Komoditas berhasil ditambahkan.", komoditas: kom });
    invalidateSummary();
  })
);

// ─── DELETE /api/komoditas/:id ────────────────────────────────────────────
router.delete(
  "/komoditas/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const { id } = req.params;
    const kom = await prisma.komoditas.findUnique({ where: { id } });
    if (!kom) {
      res.status(404).json({ message: "Komoditas tidak ditemukan." });
      return;
    }
    await prisma.komoditas.update({ where: { id }, data: { isActive: false } });
    await catatAudit(req, "komoditas.nonaktif", kom.nama);
    res.json({ message: "Komoditas dinonaktifkan." });
    invalidateSummary();
  })
);

// ─── GET /api/pegawai (admin) ─────────────────────────────────────────────
router.get(
  "/pegawai",
  requireAuth,
  requireRoles("admin"),
  h(async (_req, res) => {
    const rows = await prisma.pegawai.findMany({
      include: { instansi: true, user: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ rows: rows.map(toPegawaiDTO) });
  })
);

// ─── POST /api/pegawai (admin) ────────────────────────────────────────────
router.post(
  "/pegawai",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const body = pegawaiSchema.parse(req.body);

    const existingNip = await prisma.pegawai.findUnique({ where: { nip: body.nip } });
    if (existingNip) {
      res.status(409).json({ message: "NIP sudah digunakan." });
      return;
    }

    const instansi = body.instansi ? await findOrCreateInstansi(body.instansi) : null;

    let userId: string | null = null;
    let createUserPassword: string | null = null;
    if (body.email) {
      const emailNorm = body.email.toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { emailNorm } });
      if (existingUser) {
        res.status(409).json({ message: "Email sudah terdaftar sebagai akun pengguna." });
        return;
      }
      createUserPassword = generateTemporaryPassword();
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          emailNorm,
          password: await hashPassword(createUserPassword),
          role: "petugas",
          status: body.status === "aktif" ? "aktif" : "nonaktif",
          instansiId: instansi?.id ?? null,
          nip: body.nip,
        },
      });
      userId = user.id;
    }

    const peg = await prisma.pegawai.create({
      data: {
        name: body.name,
        nip: body.nip,
        instansiId: instansi?.id ?? null,
        instansiSub: body.instansiSub ?? null,
        peran: body.peran,
        peranIcon: body.peranIcon ?? null,
        email: body.email ?? null,
        status: body.status,
        userId,
      },
      include: { instansi: true, user: { select: { id: true } } },
    });

    await catatAudit(req, "pegawai.dibuat", `${body.name} (${body.nip})`);

    res.status(201).json({
      message: "Pegawai berhasil ditambahkan.",
      pegawai: toPegawaiDTO(peg),
      temporaryPassword: createUserPassword,
    });
  })
);

// ─── PATCH /api/pegawai/:id (admin) ───────────────────────────────────────
router.patch(
  "/pegawai/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const { id } = req.params;
    const body = pegawaiUpdateSchema.parse(req.body);

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        instansi: true,
        user: { select: { id: true, email: true, emailNorm: true, name: true, status: true, instansiId: true, nip: true } },
      },
    });
    if (!pegawai) {
      res.status(404).json({ message: "Pegawai tidak ditemukan." });
      return;
    }

    if (body.nip && body.nip !== pegawai.nip) {
      const conflict = await prisma.pegawai.findUnique({ where: { nip: body.nip } });
      if (conflict) {
        res.status(409).json({ message: "NIP sudah digunakan." });
        return;
      }
    }

    const instansi = body.instansi ? await findOrCreateInstansi(body.instansi) : null;
    const emailDiberikan = body.email !== undefined;
    const emailBaru = emailDiberikan ? (body.email ? body.email.trim() : null) : pegawai.email;

    // Akun login hanya dibuat ketika admin secara eksplisit mengisi email pada
    // pegawai yang tadinya tak punya akun. Menyentuh kolom lain tanpa email
    // tidak boleh diam-diam membuat akun baru.
    let userIdBaru: string | null = null;
    let temporaryPassword: string | null = null;
    if (pegawai.user) {
      if (emailBaru && pegawai.user.emailNorm !== emailBaru.toLowerCase()) {
        const conflict = await prisma.user.findFirst({
          where: { emailNorm: emailBaru.toLowerCase(), id: { not: pegawai.user.id } },
        });
        if (conflict) {
          res.status(409).json({ message: "Email sudah terdaftar sebagai akun pengguna lain." });
          return;
        }
      }
    } else if (emailBaru) {
      const conflict = await prisma.user.findFirst({ where: { emailNorm: emailBaru.toLowerCase() } });
      if (conflict) {
        res.status(409).json({ message: "Email sudah terdaftar sebagai akun pengguna." });
        return;
      }
      temporaryPassword = generateTemporaryPassword();
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Sinkron data pegawai ke akun login yang terhubung (email, nama, NIP,
      // instansi) dan status aktivasi mengikuti status penugasan.
      if (pegawai.user) {
        const dataUser: {
          email?: string;
          emailNorm?: string;
          name?: string;
          nip?: string;
          instansiId?: string | null;
          status?: string;
        } = {};

        if (emailDiberikan && emailBaru && pegawai.user.email !== emailBaru) {
          dataUser.email = emailBaru;
          dataUser.emailNorm = emailBaru.toLowerCase();
        }
        if (body.name && body.name !== pegawai.user.name) dataUser.name = body.name;
        if (body.nip && pegawai.user.nip !== body.nip) dataUser.nip = body.nip;
        if (instansi !== undefined && pegawai.user.instansiId !== instansi?.id) {
          dataUser.instansiId = instansi?.id ?? null;
        }
        const statusAkun = (body.status ?? pegawai.status) === "aktif" ? "aktif" : "nonaktif";
        if (body.status && statusAkun !== pegawai.user.status) dataUser.status = statusAkun;

        if (Object.keys(dataUser).length > 0) {
          await tx.user.update({ where: { id: pegawai.user.id }, data: dataUser });
        }
        // Pegawai yang berubah nonaktif/cuti langsung kehilangan sesi login.
        if (dataUser.status === "nonaktif") {
          await tx.session.updateMany({
            where: { userId: pegawai.user.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
      } else if (emailBaru) {
        const akun = await tx.user.create({
          data: {
            name: body.name ?? pegawai.name,
            email: emailBaru,
            emailNorm: emailBaru.toLowerCase(),
            password: await hashPassword(temporaryPassword!),
            role: "petugas",
            status: (body.status ?? pegawai.status) === "aktif" ? "aktif" : "nonaktif",
            instansiId: instansi?.id ?? null,
            nip: body.nip ?? pegawai.nip,
          },
        });
        userIdBaru = akun.id;
      }

      return tx.pegawai.update({
        where: { id },
        data: {
          ...(body.name ? { name: body.name } : {}),
          ...(body.nip ? { nip: body.nip } : {}),
          ...(instansi !== undefined ? { instansiId: instansi?.id ?? null } : {}),
          ...(body.instansiSub !== undefined ? { instansiSub: body.instansiSub } : {}),
          ...(body.peran ? { peran: body.peran } : {}),
          ...(body.peranIcon !== undefined ? { peranIcon: body.peranIcon } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(userIdBaru ? { userId: userIdBaru } : {}),
        },
        include: { instansi: true, user: { select: { id: true } } },
      });
    });

    if (temporaryPassword) {
      await catatAudit(req, "pegawai.akun-dibuat", `${body.name ?? pegawai.name} (${body.nip ?? pegawai.nip})`);
      res.json({
        message: "Pegawai berhasil diperbarui, akun login baru dibuat.",
        pegawai: toPegawaiDTO(updated),
        temporaryPassword,
      });
      return;
    }

    res.json({ message: "Pegawai berhasil diperbarui.", pegawai: toPegawaiDTO(updated) });
  })
);

// ─── POST /api/pegawai/:id/reset-password (admin) ─────────────────────────
// Gugur kata sandi akun login pegawai: sandi baru sementara + semua sesi lama
// dicabut. Satu-satunya jalan reset admin reguler setelah menu Kelola Akun
// dihapus; akun sendiri dikecualikan (ganti via Pengaturan Akun).
router.post(
  "/pegawai/:id/reset-password",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const pegawai = await prisma.pegawai.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!pegawai) {
      res.status(404).json({ message: "Pegawai tidak ditemukan." });
      return;
    }
    if (!pegawai.user) {
      res.status(400).json({
        message: "Belum ada akun login untuk pegawai ini. Isi email pada form pegawai agar akun dibuat.",
      });
      return;
    }
    if (pegawai.user.id === me.id) {
      res.status(400).json({ message: "Ganti kata sandi sendiri lewat menu Pengaturan Akun." });
      return;
    }

    const temporaryPassword = generateTemporaryPassword();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: pegawai.user!.id },
        data: { password: await hashPassword(temporaryPassword), status: "aktif" },
      });
      // Reset mencabut semua sesi lama: pemegang cookie refresh lama tidak
      // boleh menyamar setelah kata sandi diunggah ulang oleh admin.
      await tx.session.updateMany({
        where: { userId: pegawai.user!.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await catatAudit(req, "user.reset-password", pegawai.user.email);

    res.json({
      message: "Kata sandi berhasil direset.",
      temporaryPassword,
      email: pegawai.user.email,
    });
  })
);

// ─── DELETE /api/pegawai/:id (admin) ──────────────────────────────────────
router.delete(
  "/pegawai/:id",
  writeLimiter,
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const { id } = req.params;
    const pegawai = await prisma.pegawai.findUnique({ where: { id } });
    if (!pegawai) {
      res.status(404).json({ message: "Pegawai tidak ditemukan." });
      return;
    }
    // Notulensi mereferensikan pegawai dengan onDelete Restrict. Tanpa cek ini,
    // admin menghapus notulis dan menerima 500 FK alih-alih arahan yang jelas.
    const jumlahNotulensi = await prisma.notulensi.count({
      where: { notulisPegawaiId: id },
    });
    if (jumlahNotulensi > 0) {
      res.status(409).json({
        message: `Pegawai masih menjadi notulis pada ${jumlahNotulensi} notulensi. Nonaktifkan pegawai, atau hapus/ganti notulensi tersebut lebih dulu.`,
      });
      return;
    }
    await catatAudit(req, "pegawai.dihapus", `${pegawai.name} (${pegawai.nip})`);
    await prisma.pegawai.delete({ where: { id } });
    res.json({ message: "Pegawai berhasil dihapus." });
  })
);

export default router;