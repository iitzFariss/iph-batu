import { z } from "zod";
import { PEGAWAI_STATUSES } from "./enums";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter.").optional(),
  email: z.string().trim().email("Format email tidak valid.").optional(),
  nip: z.string().trim().nullish(),
  phone: z.string().trim().nullish(),
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
  nip: z.string().trim().min(5, "NIP minimal 5 karakter."),
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
  nilai: z.number(),
});

export const rekapCreateSchema = z.object({
  tahun: z.number().int().min(2000).max(2100),
  bulan: z.number().int().min(1).max(12),
  mingguKe: z.number().int().min(1).max(5),
  indikator: z.number(),
  andil: z.array(detailSchema).min(1, "Minimal satu komoditas andil.").max(10),
  fluktuasi: detailSchema.nullish(),
});

export const rekapUpdateSchema = z.object({
  periode: z.string().trim().nullish(),
  nilaiIPH: z.number().nullish(),
  deflasi: z.array(detailSchema).default([]),
  inflasi: z.array(detailSchema).default([]),
  fluktuasi: detailSchema.nullish(),
});