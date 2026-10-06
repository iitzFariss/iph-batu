import { createHash } from "node:crypto";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";
import { REFRESH_COOKIE } from "../lib/env";

type Aturan = Partial<
  Pick<Options, "windowMs" | "limit" | "skipSuccessfulRequests">
> & {
  pesan: string;
};

function buat({ pesan, ...aturan }: Aturan) {
  return rateLimit({
    ...aturan,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: pesan },
  });
}

/**
 * authLimiter keyed per IP bisa dilewati brute force terdistribusi: penyerang
 * memakai banyak IP untuk satu email yang sama dan tetap mendapat jatah penuh
 * di tiap IP. Jadi ada lapis kedua yang menghitung per email.
 *
 * Kuncinya email saja, bukan IP+email. Menggabungkan IP kembali membuka
 * celah yang sama: tiap IP punya ember sendiri sehingga email yang sama tidak
 * pernah kehitung menumpuk.
 *
 * Konsekuensinya, seseorang bisa mengunci akun lain dengan sengaja gagal
 * login 10 kali memakai email korban. Ini trade-off yang disengaja dan
 * diterima karena (1) yang dilindungi adalah akses ke data pemerintah,
 * (2) kunci dikunci 15 menit dan limiter per-IP tetap membatasi biaya setiap
 * penyerang, jadi mengunci banyak akun sekaligus tidak murah, dan (3) kunci
 * per IP+email justru membiarkan credential stuffing berjalan tanpa batas.
 */
export const loginPerEmailLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan masuk untuk email ini. Coba lagi dalam 15 menit.",
  },
  keyGenerator: (req: Request) => {
    const body = req.body as { email?: unknown } | undefined;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    return email || ipKeyGenerator(req.ip ?? "");
  },
});

export const authLimiter = buat({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  pesan: "Terlalu banyak percobaan masuk gagal. Coba lagi dalam 15 menit.",
});

export const guestLimiter = buat({
  windowMs: 15 * 60_000,
  limit: 10,
  pesan: "Terlalu banyak permintaan masuk tamu. Coba lagi dalam 15 menit.",
});

/**
 * Refresh token dihitung per sesi (hash nilai cookie), bukan per IP. Kalau
 * keyed per IP, satu pengguna aktif dengan banyak tab/perangkat (yang wajar
 * menelurkan puluhan refresh dalam 15 menit) bisa menghabiskan jatah IP dan
 * mengunci SEMUA pengguna di balik NAT yang sama — termasuk mereka yang tidak
 * melakukan apa-apa. Keyed per sesi, penyalahgunaan satu sesi tidak menular.
 * Sesi tanpa cookie jatuh ke IP sebagai kunci cadangan.
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Terlalu banyak permintaan perpanjangan sesi." },
  keyGenerator: (req: Request) => {
    const header = req.headers.cookie ?? "";
    for (const bagian of header.split(";")) {
      const sama = bagian.indexOf("=");
      if (sama === -1) continue;
      if (bagian.slice(0, sama).trim() !== REFRESH_COOKIE) continue;
      const token = bagian.slice(sama + 1).trim();
      if (token) {
        return `sesi:${createHash("sha256").update(token).digest("hex")}`;
      }
    }
    return ipKeyGenerator(req.ip ?? "");
  },
});

// Backstop longgar per IP untuk menahan kunci dari jutaan sesi anonim, tanpa
// menyentuh pengguna sah yang berbagi satu IP (NAT kantor).
export const refreshIpLimiter = buat({
  windowMs: 15 * 60_000,
  limit: 300,
  pesan: "Terlalu banyak permintaan perpanjangan sesi dari perangkat ini.",
});

export const publicLimiter = buat({
  windowMs: 60_000,
  limit: 60,
  pesan: "Terlalu banyak permintaan ke data publik. Coba lagi sebentar.",
});

export const writeLimiter = buat({
  windowMs: 60_000,
  limit: 60,
  pesan: "Terlalu banyak permintaan penyimpanan data. Coba lagi sebentar.",
});