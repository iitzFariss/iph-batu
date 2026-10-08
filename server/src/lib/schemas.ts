import { z } from "zod";
import { PEGAWAI_STATUSES, RAPAT_STATUSES, USER_ROLES, USER_STATUSES } from "./enums";

/**
 * Angka yang boleh datang sebagai string dari input form ("1,5" atau "1.5")
 * diubah menjadi number. Nilai yang bukan angka tetap ditolak dengan pesan
 * jelas, bukan berakhir 500. NaN secara eksplisit ditolak karena `typeof NaN
 * === "number"` sehingga z.number() biasa tidak menolaknya.
 */
const angka = z.preprocess(
  (v) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.replace(",", "."));
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  },
  z.number({ message: "Nilai harus berupa angka." })
);

/**
 * NIP PNS standar berformat 18 digit, di grup-grup ("1978 0410 2003 12 1 002"
 * atau "197804102003121002"). Versi lama ada yang 16 digit. Spasi/spasi grup
 * diabaikan untuk pengecekan tapi nilai aslinya tetap disimpan apa adanya,
 * supaya data hasil impor yang memakai format standar tidak berubah tampilan.
 */
function cekNip(nip: string): boolean {
  return /^[0-9]{16,18}$/.test(nip.replace(/\s/g, ""));
}

/**
 * Nomor yang dipakai untuk prefill tautan wa.me, jadi mengikuti bentuk nomor
 * WhatsApp Indonesia: awalan 0, 62, atau +62 lalu awalan 8.
 */
function cekNoWa(nomor: string): boolean {
  const bersih = nomor.replace(/[\s\-()]/g, "");
  return /^(\+?62|0)8[0-9]{8,12}$/.test(bersih);
}

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter.").optional(),
  email: z.string().trim().email("Format email tidak valid.").optional(),
  nip: z.string().trim().refine(cekNip, "NIP harus 16-18 digit angka.").nullish(),
  phone: z.string().trim().refine(cekNoWa, "Nomor WhatsApp tidak valid.").nullish(),
  bio: z.string().trim().nullish(),
  instansi: z.string().trim().nullish(),
});

export const changePasswordSchema = z
  .object({
    passwordSaatIni: z.string().min(1, "Kata sandi saat ini wajib diisi."),
    passwordBaru: z.string().min(8, "Kata sandi baru minimal 8 karakter."),
    konfirmasi: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((d) => d.passwordBaru === d.konfirmasi, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["konfirmasi"],
  });

export const komoditasCreateSchema = z.object({
  nama: z.string().trim().min(2, "Nama komoditas minimal 2 karakter."),
  unit: z.string().trim().nullish(),
});

export const pegawaiSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter."),
  nip: z.string().trim().refine(cekNip, "NIP harus 16-18 digit angka."),
  instansi: z.string().trim().nullish(),
  instansiSub: z.string().trim().nullish(),
  peran: z.string().trim().min(3, "Peran minimal 3 karakter."),
  peranIcon: z.string().trim().max(8).nullish(),
  email: z.string().trim().email("Format email tidak valid.").nullish(),
  status: z.enum(PEGAWAI_STATUSES).optional().default("aktif"),
});

export const pegawaiUpdateSchema = pegawaiSchema.partial().extend({});

const detailSchema = z.object({
  nama: z.string().trim().min(1, "Nama komoditas wajib diisi."),
  nilai: angka,
});

export const rekapCreateSchema = z.object({
  tahun: z.number().int().min(2000).max(2100),
  bulan: z.number().int().min(1).max(12),
  mingguKe: z.number().int().min(1).max(5),
  indikator: angka,
  andil: z.array(detailSchema).min(1, "Minimal satu komoditas andil.").max(10),
  fluktuasi: detailSchema.nullish(),
});

export const rekapUpdateSchema = z.object({
  periode: z.string().trim().nullish(),
  nilaiIPH: angka.nullish(),
  deflasi: z.array(detailSchema).default([]),
  inflasi: z.array(detailSchema).default([]),
  fluktuasi: detailSchema.nullish(),
});

const rapatPetugasSchema = z.object({
  pegawaiId: z.string().min(1, "Petugas wajib dipilih."),
  peran: z.enum(["notulis", "peserta"]).default("peserta"),
});

export const rapatCreateSchema = z.object({
  topik: z.string().trim().min(3, "Topik rapat minimal 3 karakter."),
  tanggal: z.coerce.date({ required_error: "Tanggal rapat tidak valid." }),
  lokasi: z.string().trim().max(200).nullish(),
  catatan: z.string().trim().nullish(),
  petugas: z
    .array(rapatPetugasSchema)
    .min(1, "Minimal satu petugas rapat.")
    .max(20)
    .refine((p) => p.some((x) => x.peran === "notulis"), "Minimal satu petugas berperan notulis."),
});

export const rapatUpdateSchema = rapatCreateSchema
  .partial()
  .extend({ status: z.enum(RAPAT_STATUSES).optional() });

export const notulensiSchema = z.object({
  isi: z.string().trim().min(10, "Notulensi minimal 10 karakter."),
});

export const userUpdateSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .refine((d) => d.role !== undefined || d.status !== undefined, {
    message: "Role atau status wajib diisi.",
  });