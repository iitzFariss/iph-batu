import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const INSTANSI = [
  "BPS Kota Batu",
  "Bagian Perekonomian Setda Kota Batu",
  "Disperindag Kota Batu",
  "Diskumperindag Kota Batu",
  "Dinas Pertanian Kota Batu",
  "Bulog Sub-Divre Malang",
  "Bank Indonesia Malang",
  "Dinas Kominfo Kota Batu",
  "Satgas Pangan Polres Batu",
];

const KOMODITAS = [
  "Beras Medium",
  "Beras Premium",
  "Jagung",
  "Kedelai",
  "Bawang Merah",
  "Bawang Putih",
  "Cabai Merah Keriting",
  "Cabai Rawit Merah",
  "Cabai Merah",
  "Daging Sapi Murni",
  "Daging Sapi",
  "Daging Ayam Ras",
  "Telur Ayam Ras",
  "Telur Ayam",
  "Ikan Tongkol",
  "Gula Pasir",
  "Minyak Goreng Kemasan",
  "Tepung Terigu",
  "Daging Ayam",
  "Cabai Rawit",
  "Minyak Goreng",
];

const PEGAWAI = [
  {
    name: "Drs. Eko Prasetyo, M.Si.",
    nip: "19780410 200312 1 002",
    instansi: "Bagian Perekonomian Setda Kota Batu",
    instansiSub: "Sekretariat Daerah Kota Batu",
    peran: "Admin Sistem & Koordinator Teknis",
    peranIcon: "🛡️",
    status: "aktif",
    email: null as string | null,
  },
  {
    name: "Siti Rahmawati, S.E.",
    nip: "19850920 200902 2 004",
    instansi: "BPS Kota Batu",
    instansiSub: "Badan Pusat Statistik",
    peran: "Analis Data BPS & Verifikator",
    peranIcon: "📊",
    status: "aktif",
    email: "siti.rahmawati@bps-batu.go.id",
  },
  {
    name: "Budi Santoso, M.Si.",
    nip: "19800315 200501 1 008",
    instansi: "Disperindag Kota Batu",
    instansiSub: "Dinas Perindustrian & Perdagangan",
    peran: "Satgas Pasar & Enumerator",
    peranIcon: "🏪",
    status: "aktif",
    email: null,
  },
  {
    name: "Anisa Rahayu, S.P.",
    nip: "19891104 201402 2 001",
    instansi: "Dinas Pertanian Kota Batu",
    instansiSub: "Dinas Pertanian & Ketahanan Pangan",
    peran: "Koordinator Teknis Distribusi",
    peranIcon: "🌾",
    status: "aktif",
    email: null,
  },
  {
    name: "Bambang Wijaya",
    nip: "19770808 200312 1 003",
    instansi: "Diskumperindag Kota Batu",
    instansiSub: "Dinas Koperasi & UMKM",
    peran: "Analis Pasar & Harga",
    peranIcon: "📈",
    status: "aktif",
    email: "bambang@diskoperindag-batu.go.id",
  },
  {
    name: "Diana Lestari, M.Si.",
    nip: "19830612 200604 2 002",
    instansi: "Bagian Perekonomian Setda Kota Batu",
    instansiSub: "Sekretariat Daerah Kota Batu",
    peran: "Notulis & Dokumentasi Rapat",
    peranIcon: "📝",
    status: "cuti",
    email: null,
  },
  {
    name: "Achmad Nur, S.T.",
    nip: "19920214 201903 1 001",
    instansi: "Dinas Kominfo Kota Batu",
    instansiSub: "Kominfo & Persandian",
    peran: "Admin Teknis Sistem",
    peranIcon: "💻",
    status: "nonaktif",
    email: null,
  },
];

const REKAP = [
  {
    tahun: 2026,
    bulan: 4,
    mingguIndeks: 3,
    indikator: -0.42,
    deflasi: [
      { nama: "Beras Medium", nilai: -0.25 },
      { nama: "Daging Ayam", nilai: -0.12 },
    ],
    inflasi: [{ nama: "Cabai Rawit", nilai: 0.18 }],
  },
  {
    tahun: 2026,
    bulan: 4,
    mingguIndeks: 2,
    indikator: 0.15,
    deflasi: [{ nama: "Minyak Goreng", nilai: -0.08 }],
    inflasi: [
      { nama: "Bawang Merah", nilai: 0.14 },
      { nama: "Telur Ayam", nilai: 0.09 },
    ],
  },
  {
    tahun: 2026,
    bulan: 4,
    mingguIndeks: 1,
    indikator: 0.88,
    deflasi: [],
    inflasi: [
      { nama: "Cabai Rawit", nilai: 0.54 },
      { nama: "Daging Sapi", nilai: 0.22 },
    ],
  },
  {
    tahun: 2026,
    bulan: 3,
    mingguIndeks: 4,
    indikator: -0.11,
    deflasi: [
      { nama: "Beras Premium", nilai: -0.1 },
      { nama: "Gula Pasir", nilai: -0.05 },
    ],
    inflasi: [{ nama: "Bawang Putih", nilai: 0.04 }],
  },
  {
    tahun: 2026,
    bulan: 3,
    mingguIndeks: 3,
    indikator: -0.65,
    deflasi: [
      { nama: "Cabai Merah", nilai: -0.38 },
      { nama: "Beras Medium", nilai: -0.24 },
    ],
    inflasi: [],
  },
];

async function upsertUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  instansi?: string;
}) {
  const instansi = data.instansi
    ? await prisma.instansi.findUnique({ where: { nama: data.instansi } })
    : null;
  return prisma.user.upsert({
    where: { emailNorm: data.email.toLowerCase() },
    update: { name: data.name, role: data.role, status: "aktif", instansiId: instansi?.id ?? null },
    create: {
      name: data.name,
      email: data.email,
      emailNorm: data.email.toLowerCase(),
      password: await bcrypt.hash(data.password, 10),
      role: data.role,
      status: "aktif",
      instansiId: instansi?.id ?? null,
    },
  });
}

async function main() {
  console.log("Menghapus data lama...");
  await prisma.rekapDetail.deleteMany();
  await prisma.rekap.deleteMany();
  await prisma.session.deleteMany();
  await prisma.pegawai.deleteMany();
  await prisma.komoditas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.instansi.deleteMany();

  console.log("Seed instansi...");
  for (const nama of INSTANSI) {
    await prisma.instansi.create({ data: { nama } });
  }

  console.log("Seed komoditas...");
  for (const nama of KOMODITAS) {
    await prisma.komoditas.create({ data: { nama, namaNorm: nama.toLowerCase() } });
  }

  console.log("Seed akun...");
  const admin = await upsertUser({
    name: "Administrator TPID",
    email: "admin@tpid-batu.go.id",
    password: "admin123",
    role: "admin",
    instansi: "Bagian Perekonomian Setda Kota Batu",
  });
  const siti = await upsertUser({
    name: "Siti Rahmawati, S.E.",
    email: "siti.rahmawati@bps-batu.go.id",
    password: "petugas123",
    role: "petugas",
    instansi: "BPS Kota Batu",
  });
  const bambang = await upsertUser({
    name: "Bambang Wijaya",
    email: "bambang@diskoperindag-batu.go.id",
    password: "petugas123",
    role: "petugas",
    instansi: "Diskumperindag Kota Batu",
  });
  await upsertUser({
    name: "Tamu TPID",
    email: "tamu@tpid-batu.go.id",
    password: "tamu123",
    role: "tamu",
  });

  console.log("Seed pegawai...");
  const userByPegawaiEmail: Record<string, string> = {
    "siti.rahmawati@bps-batu.go.id": siti.id,
    "bambang@diskoperindag-batu.go.id": bambang.id,
  };
  for (const p of PEGAWAI) {
    const instansi = await prisma.instansi.findUnique({ where: { nama: p.instansi as string } });
    await prisma.pegawai.create({
      data: {
        name: p.name,
        nip: p.nip,
        instansiId: instansi?.id ?? null,
        instansiSub: p.instansiSub,
        peran: p.peran,
        peranIcon: p.peranIcon,
        email: p.email,
        status: p.status,
        userId: p.email ? userByPegawaiEmail[p.email.toLowerCase()] ?? null : null,
      },
    });
  }

  console.log("Seed rekap IPH...");
  for (const r of REKAP) {
    const rekap = await prisma.rekap.create({
      data: {
        tahun: r.tahun,
        bulan: r.bulan,
        mingguIndeks: r.mingguIndeks,
        indikator: r.indikator,
        status: "submitted",
        createdById: admin.id,
      },
    });
    const rows = [
      ...r.deflasi.map((d) => ({ ...d, isFluktuasi: false })),
      ...r.inflasi.map((d) => ({ ...d, isFluktuasi: false })),
    ];
    for (const row of rows) {
      const komoditas = await prisma.komoditas.findUnique({
        where: { namaNorm: row.nama.toLowerCase() },
      });
      if (!komoditas) throw new Error(`Komoditas seed tidak ditemukan: ${row.nama}`);
      await prisma.rekapDetail.create({
        data: {
          rekapId: rekap.id,
          komoditasId: komoditas.id,
          nilai: row.nilai,
          isFluktuasi: false,
        },
      });
    }
  }

  console.log("Seed selesai.");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });