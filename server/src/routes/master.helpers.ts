import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { initialsOf, colorOf } from "../lib/serializers";

/** Client minimal supaya helper bisa dijalankan di dalam prisma.$transaction(). */
type DbClient = Pick<Prisma.TransactionClient, "komoditas">;

export async function findOrCreateInstansi(nama: string): Promise<{ id: string; nama: string } | null> {
  const trimmed = nama.trim();
  if (!trimmed) return null;
  const all = await prisma.instansi.findMany();
  const found = all.find((i) => i.nama.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return prisma.instansi.create({ data: { nama: trimmed } });
}

/**
 * Memakai prisma global di dalam prisma.$transaction() membuka koneksi kedua
 * yang menunggu lock tulis milik transaksi tersebut, sehingga transaksi lama
 * expire dan permintaan gagal 500. Karena itu pemanggil dari dalam transaksi
 * WAJIB mengoper tx-nya; default prisma hanya untuk pemanggil di luar transaksi.
 * upsert (bukan find-then-create) juga menutup celah race pada kolom unik.
 */
export async function findOrCreateKomoditas(
  nama: string,
  db: DbClient = prisma
): Promise<{ id: string; nama: string }> {
  const trimmed = nama.trim();
  return db.komoditas.upsert({
    where: { namaNorm: trimmed.toLowerCase() },
    update: {},
    create: { nama: trimmed, namaNorm: trimmed.toLowerCase() },
  });
}

export function toPegawaiDTO(pegawai: {
  id: string;
  name: string;
  nip: string;
  instansiSub: string | null;
  peran: string;
  peranIcon: string | null;
  email: string | null;
  status: string;
  instansi: { nama: string } | null;
  user: { id: string } | null;
}) {
  return {
    id: pegawai.id,
    initials: initialsOf(pegawai.name),
    color: colorOf(pegawai.name),
    name: pegawai.name,
    nip: pegawai.nip,
    instansi: pegawai.instansi?.nama ?? "-",
    instansiSub: pegawai.instansiSub ?? "",
    peran: pegawai.peran,
    peranIcon: pegawai.peranIcon ?? "",
    email: pegawai.email,
    status: pegawai.status,
    isAccountCreated: !!pegawai.user,
  };
}