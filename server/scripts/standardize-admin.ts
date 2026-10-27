import prisma from "../src/lib/prisma";
import { hashPassword } from "../src/lib/security";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const targetEmail = "admin@bpskotabatu.com";
  const sourceEmail = process.env.ADMIN_SOURCE_EMAIL?.trim().toLowerCase();
  const single = process.argv.includes("--single-admin");
  const admins = await prisma.user.findMany({ where: { role: "admin", ...(!single && sourceEmail ? { emailNorm: sourceEmail } : {}) }, select: { id: true, email: true, emailNorm: true, status: true, role: true, password: true } });
  const target = admins.find(u => u.emailNorm === targetEmail) ?? (single ? admins.find(u => u.emailNorm === "admin@tpid-batu.go.id") : undefined) ?? (admins.length === 1 ? admins[0] : null);
  if (!target) { console.table(admins.map(u => ({ email: u.email, status: u.status }))); throw new Error("Tidak dapat memilih satu akun admin. Isi ADMIN_SOURCE_EMAIL dengan email admin yang akan diperbarui."); }
  const conflict = await prisma.user.findUnique({ where: { emailNorm: targetEmail }, select: { id: true } });
  if (conflict && conflict.id !== target.id) throw new Error("Email tujuan sudah dipakai akun lain. Tidak ada akun yang diubah.");
  const others = single ? admins.filter(u => u.id !== target.id) : [];
  if (!process.argv.includes("--apply")) { console.log(`Pratinjau: ${target.email} → ${targetEmail}. ${others.length} admin lain akan dinonaktifkan dan dilepas hak adminnya. Tidak ada data diubah.`); return; }
  const password = process.env.ADMIN_TARGET_PASSWORD;
  if (!password || password.length < 7) throw new Error("Isi ADMIN_TARGET_PASSWORD sebelum menjalankan --apply. Nilai tidak ditampilkan atau disimpan ke Git.");
  const hash = await hashPassword(password);
  const backupDirectory = resolve("backups");
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(resolve(backupDirectory, `admin-before-${Date.now()}.json`), JSON.stringify(admins, null, 2), { mode: 0o600, flag: "wx" });
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: target.id }, data: { email: targetEmail, emailNorm: targetEmail, password: hash, status: "aktif" } });
    if (others.length) await tx.user.updateMany({ where: { id: { in: others.map(u => u.id) } }, data: { role: "petugas", status: "nonaktif" } });
    await tx.session.updateMany({ where: { userId: { in: [target.id, ...others.map(u => u.id)] }, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.auditLog.create({ data: { actorId: target.id, aksi: "admin.identitas-diperbarui", detail: targetEmail } });
  });
  console.log(`Akun admin diperbarui menjadi ${targetEmail}. Silakan masuk kembali.`);
}
main().catch(error => { console.error(error instanceof Error && /^(Tidak dapat|Email tujuan|Isi ADMIN)/.test(error.message) ? error.message : "Pembaruan admin gagal. Periksa koneksi database; kredensial tidak ditampilkan."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
