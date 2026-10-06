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
  await prisma.notulensi.deleteMany();
  await prisma.petugasRapat.deleteMany();
  await prisma.rapat.deleteMany();
  await prisma.rekapDetail.deleteMany();
  await prisma.rekap.deleteMany();
  await prisma.session.deleteMany();
  await prisma.komoditas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.instansi.deleteMany();
}

export async function buatRapatFixture() {
  const admin = await buatUser({ email: "admin@rapat.test", role: "admin" });
  const notulisUser = await buatUser({ email: "notulis@rapat.test", role: "petugas" });
  const pesertaUser = await buatUser({ email: "peserta@rapat.test", role: "petugas" });

  const notulis = await prisma.pegawai.create({
    data: {
      name: "Notulis Satu",
      nip: "197804102003121002",
      peran: "Kepala Seksi",
      status: "aktif",
      userId: notulisUser.id,
    },
  });
  const peserta = await prisma.pegawai.create({
    data: {
      name: "Peserta Dua",
      nip: "198509202009022004",
      peran: "Staf",
      status: "aktif",
      userId: pesertaUser.id,
    },
  });

  const hari = (selisih: number, jam = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + selisih);
    d.setHours(jam, 0, 0, 0);
    return d;
  };

  const rapatIni = await prisma.rapat.create({
    data: {
      topik: "Rapat Hari Ini",
      tanggal: hari(0),
      status: "terjadwal",
      createdById: admin.id,
      petugas: {
        create: [
          { pegawaiId: notulis.id, peran: "notulis" },
          { pegawaiId: peserta.id, peran: "peserta" },
        ],
      },
    },
  });
  const rapatBesok = await prisma.rapat.create({
    data: {
      topik: "Rapat Besok",
      tanggal: hari(1),
      status: "terjadwal",
      createdById: admin.id,
      petugas: { create: [{ pegawaiId: notulis.id, peran: "notulis" }] },
    },
  });
  // Kemarin, belum diisi notulensi: pemicu reminder "notulensi" H+1.
  const rapatBelumNotulen = await prisma.rapat.create({
    data: {
      topik: "Rapat Kemarin",
      tanggal: hari(-1),
      status: "terjadwal",
      createdById: admin.id,
      petugas: { create: [{ pegawaiId: notulis.id, peran: "notulis" }] },
    },
  });
  const rapatSelesai = await prisma.rapat.create({
    data: {
      topik: "Rapat Kelar",
      tanggal: hari(-3),
      status: "selesai",
      createdById: admin.id,
      petugas: { create: [{ pegawaiId: notulis.id, peran: "notulis" }] },
      notulensi: { create: { isi: "Notulensi sudah lengkap dari rapat kemarin.", notulisPegawaiId: notulis.id } },
    },
  });

  return { admin, notulis, peserta, notulisUser, pesertaUser, rapatIni, rapatBesok, rapatBelumNotulen, rapatSelesai };
}

export async function login(email: string, role: "admin" | "petugas" | "tamu" = "admin") {
  await buatUser({ email, role });
  return PASSWORD;
}