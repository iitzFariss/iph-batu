import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import {
  komoditasCreateSchema,
  pegawaiSchema,
  pegawaiUpdateSchema,
} from "../lib/schemas";
import { hashPassword } from "../lib/security";
import { requireAuth, requireRoles } from "../middleware/auth";
import { findOrCreateInstansi, toPegawaiDTO } from "./master.helpers";
import { invalidateSummary } from "../lib/rekapCache";

export const router = Router();

// ─── GET /api/instansi ─────────────────────────────────────────────────---
router.get(
  "/instansi",
  requireAuth,
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
      createUserPassword = Array.from({ length: 8 }, () =>
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
      ).join("");
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          emailNorm,
          password: await hashPassword(createUserPassword),
          role: "petugas",
          status: "aktif",
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
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const { id } = req.params;
    const body = pegawaiUpdateSchema.parse(req.body);

    const pegawai = await prisma.pegawai.findUnique({ where: { id } });
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

    const updated = await prisma.pegawai.update({
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
      },
      include: { instansi: true, user: { select: { id: true } } },
    });

    res.json({ message: "Pegawai berhasil diperbarui.", pegawai: toPegawaiDTO(updated) });
  })
);

// ─── DELETE /api/pegawai/:id (admin) ──────────────────────────────────────
router.delete(
  "/pegawai/:id",
  requireAuth,
  requireRoles("admin"),
  h(async (req, res) => {
    const { id } = req.params;
    const pegawai = await prisma.pegawai.findUnique({ where: { id } });
    if (!pegawai) {
      res.status(404).json({ message: "Pegawai tidak ditemukan." });
      return;
    }
    await prisma.pegawai.delete({ where: { id } });
    res.json({ message: "Pegawai berhasil dihapus." });
  })
);

export default router;