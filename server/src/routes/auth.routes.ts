import { Router } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import {
  changePasswordSchema,
  loginSchema,
  preferencesSchema,
  registerSchema,
  updateMeSchema,
} from "../lib/schemas";
import {
  hashPassword,
  hashRefreshToken,
  newRefreshJti,
  refreshExpiry,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  verifyRefreshTokenSignature,
} from "../lib/security";
import { toUserDTO } from "../lib/serializers";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { findOrCreateInstansi } from "./master.helpers";

export const router = Router();

async function issueSession(userId: string, role: string, req: AuthedRequest) {
  const sessionId = newRefreshJti();
  const refreshToken = signRefreshToken({ sub: userId, jti: sessionId });
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshHash: await hashRefreshToken(refreshToken),
      device: (req.body as { device?: string })?.device ?? null,
      ip: req.ip ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      expiresAt: refreshExpiry(),
    },
  });
  return {
    accessToken: signAccessToken({ sub: userId, role, jti: sessionId }),
    refreshToken,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────
router.post(
  "/register",
  h(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { emailNorm: body.email.toLowerCase() } });
    if (exists) {
      res.status(409).json({ message: "Email sudah terdaftar." });
      return;
    }

    const instansi = body.instansi ? await findOrCreateInstansi(body.instansi) : null;

    await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        emailNorm: body.email.toLowerCase(),
        password: await hashPassword(body.password),
        role: "petugas",
        status: "pending",
        instansiId: instansi?.id ?? null,
        nip: body.nip ?? null,
        phone: body.phone ?? null,
      },
    });

    res.status(201).json({
      message:
        "Pendaftaran berhasil. Akun petugas Anda akan diverifikasi dan diaktifkan oleh Administrator TPID melalui menu Kelola Pegawai sebelum dapat digunakan.",
    });
  })
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────
router.post(
  "/login",
  h(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { emailNorm: body.email.toLowerCase() },
      include: { instansi: true },
    });
    if (!user || !(await verifyPassword(body.password, user.password))) {
      res.status(401).json({ message: "Email atau kata sandi tidak valid." });
      return;
    }
    if (user.status !== "aktif") {
      res.status(403).json({
        message:
          user.status === "pending"
            ? "Akun Anda belum diverifikasi. Administrator TPID akan mengaktifkannya melalui menu Kelola Pegawai."
            : "Akun Anda dinonaktifkan. Hubungi administrator.",
      });
      return;
    }

    const { accessToken, refreshToken } = await issueSession(user.id, user.role, req);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({
      message: "Login berhasil.",
      user: toUserDTO(user),
      accessToken,
      refreshToken,
    });
  })
);

// ─── POST /api/auth/guest ─────────────────────────────────────────────────
router.post(
  "/guest",
  h(async (req, res) => {
    const guest = await prisma.user.findFirst({
      where: { role: "tamu" },
      include: { instansi: true },
    });
    if (!guest) {
      res.status(404).json({ message: "Akun tamu tidak tersedia." });
      return;
    }

    const { accessToken, refreshToken } = await issueSession(guest.id, guest.role, req);
    await prisma.user.update({ where: { id: guest.id }, data: { lastLoginAt: new Date() } });

    res.json({
      message: "Berhasil masuk sebagai tamu.",
      user: toUserDTO(guest),
      accessToken,
      refreshToken,
    });
  })
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────
router.post(
  "/refresh",
  h(async (req, res) => {
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token tidak valid." });
      return;
    }

    try {
      const payload = verifyRefreshTokenSignature(refreshToken);
      const session = await prisma.session.findFirst({
        where: {
          id: payload.jti,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: { gte: new Date() },
        },
        include: {
          user: { include: { instansi: true } },
        },
      });
      if (!session) {
        res.status(401).json({ message: "Sesi tidak ditemukan atau telah berakhir." });
        return;
      }
      const ok = await verifyRefreshToken(refreshToken, session.refreshHash);
      if (!ok) {
        res.status(401).json({ message: "Sesi tidak valid." });
        return;
      }

      const newJti = newRefreshJti();
      const newRefreshToken = signRefreshToken({ sub: session.userId, jti: newJti });
      await prisma.session.update({
        where: { id: session.id },
        data: {
          id: newJti,
          refreshHash: await hashRefreshToken(newRefreshToken),
          lastActiveAt: new Date(),
          expiresAt: refreshExpiry(),
        },
      });

      res.json({
        accessToken: signAccessToken({ sub: session.userId, role: session.user.role, jti: newJti }),
        refreshToken: newRefreshToken,
        user: toUserDTO(session.user),
      });
    } catch {
      res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
    }
  })
);

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post(
  "/logout",
  requireAuth,
  h(async (req, res) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string };
    if (refreshToken) {
      const sessions = await prisma.session.findMany({
        where: { userId: (req as AuthedRequest).user!.id, revokedAt: null },
      });
      for (const s of sessions) {
        if (await verifyRefreshToken(refreshToken, s.refreshHash)) {
          await prisma.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
          break;
        }
      }
    }
    res.json({ message: "Berhasil keluar." });
  })
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────
router.get(
  "/me",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const user = await prisma.user.findUnique({
      where: { id: me.id },
      include: { instansi: true },
    });
    if (!user) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    res.json({ user: toUserDTO(user) });
  })
);

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────
router.patch(
  "/me",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const body = updateMeSchema.parse(req.body);

    if (body.email) {
      const conflict = await prisma.user.findFirst({
        where: { emailNorm: body.email.toLowerCase(), id: { not: me.id } },
      });
      if (conflict) {
        res.status(409).json({ message: "Email sudah digunakan akun lain." });
        return;
      }
    }

    const instansi = body.instansi ? await findOrCreateInstansi(body.instansi) : null;

    const user = await prisma.user.update({
      where: { id: me.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email
          ? { email: body.email, emailNorm: body.email.toLowerCase() }
          : {}),
        ...(body.nip !== undefined ? { nip: body.nip } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(instansi !== undefined ? { instansiId: instansi?.id ?? null } : {}),
      },
      include: { instansi: true },
    });

    res.json({ message: "Profil berhasil diperbarui.", user: toUserDTO(user) });
  })
);

// ─── POST /api/auth/change-password ───────────────────────────────────────
router.post(
  "/change-password",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const body = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (!(await verifyPassword(body.passwordSaatIni, user.password))) {
      res.status(400).json({ message: "Kata sandi saat ini salah." });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.passwordBaru) },
    });
    res.json({ message: "Kata sandi berhasil diperbarui." });
  })
);

// ─── POST /api/auth/preferences ───────────────────────────────────────────
router.post(
  "/preferences",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const { preferences } = preferencesSchema.parse(req.body);
    await prisma.user.update({
      where: { id: me.id },
      data: { preferences: JSON.stringify(preferences) },
    });
    res.json({ message: "Preferensi berhasil disimpan." });
  })
);

// ─── GET /api/auth/sessions ───────────────────────────────────────────────
router.get(
  "/sessions",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const sessions = await prisma.session.findMany({
      where: { userId: me.id, revokedAt: null },
      orderBy: { lastActiveAt: "desc" },
    });
    const rows = sessions.map((s) => ({
      id: s.id,
      device: s.device ?? "Perangkat tidak diketahui",
      ip: s.ip ?? "-",
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === (req as AuthedRequest).user!.sessionId,
    }));
    res.json({ rows });
  })
);

// ─── POST /api/auth/sessions/revoke ───────────────────────────────────────
router.post(
  "/sessions/revoke",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const { id } = (req.body ?? {}) as { id?: string };
    if (!id) {
      res.status(400).json({ message: "ID sesi wajib diisi." });
      return;
    }
    const session = await prisma.session.findFirst({ where: { id, userId: me.id } });
    if (!session) {
      res.status(404).json({ message: "Sesi tidak ditemukan." });
      return;
    }
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    res.json({ message: "Sesi berhasil diakhiri." });
  })
);

// ─── DELETE /api/auth/me ──────────────────────────────────────────────────
router.delete(
  "/me",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) {
      res.status(404).json({ message: "Akun tidak ditemukan." });
      return;
    }
    if (user.role === "admin") {
      res.status(403).json({ message: "Akun administrator tidak dapat dihapus melalui menu ini." });
      return;
    }
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: "Akun Anda telah dihapus." });
  })
);

export default router;