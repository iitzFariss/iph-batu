import prisma from "../lib/prisma";
import { initialsOf, colorOf } from "../lib/serializers";

export async function findOrCreateInstansi(nama: string): Promise<{ id: string; nama: string } | null> {
  const trimmed = nama.trim();
  if (!trimmed) return null;
  const all = await prisma.instansi.findMany();
  const found = all.find((i) => i.nama.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;
  return prisma.instansi.create({ data: { nama: trimmed } });
}

export async function findOrCreateKomoditas(nama: string): Promise<{ id: string; nama: string }> {
  const trimmed = nama.trim();
  const norm = trimmed.toLowerCase();
  const all = await prisma.komoditas.findMany();
  const found = all.find((k) => k.namaNorm === norm);
  if (found) return found;
  return prisma.komoditas.create({ data: { nama: trimmed, namaNorm: norm } });
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