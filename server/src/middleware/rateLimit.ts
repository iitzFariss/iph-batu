import rateLimit, { type Options } from "express-rate-limit";

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