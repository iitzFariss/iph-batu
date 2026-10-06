import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";

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

export const refreshLimiter = buat({
  windowMs: 15 * 60_000,
  limit: 30,
  pesan: "Terlalu banyak permintaan perpanjangan sesi.",
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