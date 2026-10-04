import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

export const PASSWORD = "rahasia-uji-123";

export const hash = (plain: string) => bcrypt.hash(plain, 10);

interface FixtureUser {
  email: string;
  role: "admin" | "petugas" | "tamu";
}

/**
 * Fixture minimal per test file. Sengaja TIDAK memakai prisma/seed.ts:
 * seed menghapus seluruh tabel dan mengisi 178 rekap.
 */
export async function buatUser({ email, role }: FixtureUser) {
  const hashed = await hash(PASSWORD);
  const user = await prisma.user.create({
    data: {
      name: email.split("@")[0],
      email,
      emailNorm: email.toLowerCase(),
      password: hashed,
      role,
      status: "aktif",
    },
  });
  return user;
}

export async function buatRekapFixture() {
  const admin = await buatUser({ email: "admin@uji.test", role: "admin" });

  const komoditas = async (nama: string) =>
    prisma.komoditas.create({ data: { nama, namaNorm: nama.toLowerCase() } });

  const beras = await komoditas("Beras Medium");
  await komoditas("Cabai Merah");
  await komoditas("Minyak Goreng");

  const isiDetail = async (rekapId: string) => {
    await prisma.rekapDetail.create({
      data: { rekapId, komoditasId: beras.id, nilai: 1.25, isFluktuasi: false },
    });
  };

  // Dua periode supaya filter tahun/bulan/minggu dan pengurutan bisa diuji.
  const terbaru = await prisma.rekap.create({
    data: {
      tahun: 2026,
      bulan: 9,
      mingguIndeks: 4,
      indikator: 3.06,
      status: "submitted",
      createdById: admin.id,
    },
  });
  await isiDetail(terbaru.id);

  const lampau = await prisma.rekap.create({
    data: {
      tahun: 2023,
      bulan: 2,
      mingguIndeks: 3,
      indikator: 1.82,
      status: "submitted",
      createdById: admin.id,
    },
  });
  await isiDetail(lampau.id);

  return { admin, terbaru, lampau };
}

export async function bersihkanSemua() {
  await prisma.rekapDetail.deleteMany();
  await prisma.rekap.deleteMany();
  await prisma.session.deleteMany();
  await prisma.komoditas.deleteMany();
  await prisma.user.deleteMany();
}

export async function login(email: string, role: "admin" | "petugas" | "tamu" = "admin") {
  await buatUser({ email, role });
  return PASSWORD;
}