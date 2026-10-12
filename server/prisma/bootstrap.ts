import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../src/lib/prisma";

class BootstrapError extends Error {}

async function main() {
  const parsed = z.object({
    INITIAL_ADMIN_EMAIL: z.string().trim().email(),
    INITIAL_ADMIN_NAME: z.string().trim().min(1),
    INITIAL_ADMIN_PASSWORD: z.string().min(12),
  }).safeParse(process.env);
  if (!parsed.success) {
    throw new BootstrapError("Isi INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, dan INITIAL_ADMIN_PASSWORD (minimal 12 karakter) di server/.env lokal.");
  }
  const config = parsed.data;
  const email = config.INITIAL_ADMIN_EMAIL.toLowerCase();
  const adminPassword = await bcrypt.hash(config.INITIAL_ADMIN_PASSWORD, 12);
  const guestPassword = await bcrypt.hash(randomBytes(48).toString("base64url"), 12);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { emailNorm: email } });
    if (existing && (existing.role !== "admin" || existing.status !== "aktif")) {
      throw new BootstrapError("Email tersebut sudah terdaftar sebagai akun lain. Pilih email administrator baru; akun lama tidak diubah.");
    }
    await tx.user.upsert({
      where: { emailNorm: email }, update: {},
      create: { name: config.INITIAL_ADMIN_NAME, email, emailNorm: email, password: adminPassword, role: "admin", status: "aktif" },
    });
    const guest = await tx.user.findFirst({ where: { role: "tamu", status: "aktif" } });
    if (!guest) {
      const guestEmail = "tamu@tpid-batu.go.id";
      if (await tx.user.findUnique({ where: { emailNorm: guestEmail } })) {
        throw new BootstrapError("Email akun tamu bawaan sudah digunakan. Periksa akun tersebut; data lama tidak diubah.");
      }
      await tx.user.create({ data: { name: "Tamu", email: guestEmail, emailNorm: guestEmail, password: guestPassword, role: "tamu", status: "aktif" } });
    }
  });
  console.log("Akun administrator dan akses tamu siap. Akun yang sudah ada tidak diubah; tidak ada data contoh yang dimasukkan.");
}

main().catch((error) => {
  console.error(error instanceof BootstrapError
    ? error.message : "Inisialisasi gagal. Periksa koneksi dan migration database.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
