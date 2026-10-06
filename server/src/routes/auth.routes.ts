import { Router, type Request, type Response } from "express";
import prisma from "../lib/prisma";
import { h } from "../lib/asyncHandler";
import {
  changePasswordSchema,
  loginSchema,
  preferencesSchema,
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
import { periodeLabel } from "../lib/rekap";
import { COOKIE_OPTIONS, REFRESH_COOKIE, REFRESH_TTL_DAYS } from "../lib/env";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { findOrCreateInstansi } from "./master.helpers";

export const router = Router();

/**
 * Express 4 tidak mem-parsing header Cookie tanpa dependency tambahan, dan
 * satu cookie ini memang tidak perlu parser umum.
 */
function ambilCookie(req: Request, nama: string): string {
  const header = req.headers.cookie;
  if (!header) return "";
  for (const bagian of header.split(";")) {
    const sama = bagian.indexOf("=");
    if (sama === -1) continue;
    if (bagian.slice(0, sama).trim() === nama) {
      return decodeURIComponent(bagian.slice(sama + 1).trim());
    }
  }
  return "";
}

/** Refresh token hanya lewat cookie; tidak pernah dikembalikan di body. */
function pasangCookieRefresh(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function lepasCookieRefresh(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
}

async function issueSession(userId: string, role: string, req: AuthedRequest, res: Response) {
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
  pasangCookieRefresh(res, refreshToken);
  return { accessToken: signAccessToken({ sub: userId, role, jti: sessionId }) };
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────
router.post(
  "/login",
  h(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const emailNorm = body.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { emailNorm },
      include: { instansi: true },
    });

    // Password salah dan akun tidak aktif memakai pesan yang sama. Kalau
    // dibedakan, siapa pun bisa menebak email mana yang terdaftar hanya dari
    // teks respons. Password tetap diverifikasi untuk akun nonaktif supaya
    // waktu prosesnya tidak membocorkan keberadaan akun.
    const passwordBenar = user ? await verifyPassword(body.password, user.password) : false;
    const bolehMasuk = passwordBenar && user!.status === "aktif";

    if (!bolehMasuk) {
      res.status(401).json({ message: "Email atau kata sandi tidak valid." });
      return;
    }

    const { accessToken } = await issueSession(user!.id, user!.role, req, res);
    await prisma.user.update({ where: { id: user!.id }, data: { lastLoginAt: new Date() } });

    res.json({
      message: "Login berhasil.",
      user: toUserDTO(user!),
      accessToken,
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

    const { accessToken } = await issueSession(guest.id, guest.role, req, res);
    await prisma.user.update({ where: { id: guest.id }, data: { lastLoginAt: new Date() } });

    res.json({
      message: "Berhasil masuk sebagai tamu.",
      user: toUserDTO(guest),
      accessToken,
    });
  })
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────
router.post(
  "/refresh",
  h(async (req, res) => {
    const refreshToken = ambilCookie(req, REFRESH_COOKIE);
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
        lepasCookieRefresh(res);
        res.status(401).json({ message: "Sesi tidak ditemukan atau telah berakhir." });
        return;
      }
      const ok = await verifyRefreshToken(refreshToken, session.refreshHash);
      if (!ok) {
        lepasCookieRefresh(res);
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
      pasangCookieRefresh(res, newRefreshToken);

      res.json({
        accessToken: signAccessToken({ sub: session.userId, role: session.user.role, jti: newJti }),
        user: toUserDTO(session.user),
      });
    } catch {
      lepasCookieRefresh(res);
      res.status(401).json({ message: "Sesi berakhir. Silakan masuk kembali." });
    }
  })
);

// ─── POST /api/auth/logout ────────────────────────────────────────────────
// Sengaja tanpa requireAuth. Access token bisa saja sudah kedaluwarsa saat
// pengguna menekan tombol keluar; kalau route mewajibkan access token yang
// valid, cookie refresh tidak pernah tercabut dan sesi tetap hidup di server.
router.post(
  "/logout",
  h(async (req, res) => {
    const refreshToken = ambilCookie(req, REFRESH_COOKIE);
    if (refreshToken) {
      try {
        const payload = verifyRefreshTokenSignature(refreshToken);
        const session = await prisma.session.findFirst({
          where: { id: payload.jti, userId: payload.sub, revokedAt: null },
        });
        if (session && (await verifyRefreshToken(refreshToken, session.refreshHash))) {
          await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        }
      } catch {
        // Token rusak: cookie tetap dicabut di bawah, sesi tidak bisa dipakai lagi.
      }
    }
    lepasCookieRefresh(res);
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

// ─── GET /api/auth/me/activity ──────────────────────────────────────────────
// Aktivitas yang benar-benar tercatat: login terakhir, sesi aktif, dan rekap
// IPH yang dibuat/diubah oleh akun ini. Bukan audit log|access log lengkap.
router.get(
  "/me/activity",
  requireAuth,
  h(async (req, res) => {
    const me = (req as AuthedRequest).user!;

    const [user, sessions, rekapCount, rekapTerakhir] = await Promise.all([
      prisma.user.findUnique({ where: { id: me.id }, select: { lastLoginAt: true } }),
      prisma.session.findMany({
        where: { userId: me.id, revokedAt: null },
        select: { id: true, device: true, lastActiveAt: true },
        orderBy: { lastActiveAt: "desc" },
      }),
      prisma.rekap.count({ where: { createdById: me.id } }),
      prisma.rekap.findFirst({
        where: { createdById: me.id },
        select: { tahun: true, bulan: true, mingguIndeks: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const items: { label: string; at: Date }[] = [];
    if (user?.lastLoginAt) items.push({ label: "Login terakhir", at: user.lastLoginAt });

    const perangkat = new Map<string, Date>();
    for (const s of sessions) {
      const nama = s.device ?? "perangkat tidak dikenal";
      const sebelumnya = perangkat.get(nama);
      if (!sebelumnya || s.lastActiveAt > sebelumnya) perangkat.set(nama, s.lastActiveAt);
    }
    for (const [nama, at] of perangkat) {
      items.push({ label: `Sesi aktif di ${nama}`, at });
    }

    if (rekapTerakhir) {
      items.push({
        label: `Rekap ${periodeLabel(rekapTerakhir)} disimpan`,
        at: rekapTerakhir.updatedAt ?? rekapTerakhir.createdAt,
      });
      if (rekapCount > 1) {
        items.push({
          label: `Total ${rekapCount} rekap IPH tersimpan atas nama akun ini`,
          at: rekapTerakhir.createdAt,
        });
      }
    }

    items.sort((a, b) => b.at.getTime() - a.at.getTime());
    res.json({
      items: items.slice(0, 8),
      ringkasan: {
        rekap: rekapCount,
        perangkat: perangkat.size,
        terakhirMasuk: user?.lastLoginAt ?? null,
      },
    });
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