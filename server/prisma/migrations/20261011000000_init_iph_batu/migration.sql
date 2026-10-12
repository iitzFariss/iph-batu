BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "iph_batu";

-- CreateTable
CREATE TABLE "iph_batu"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailNorm" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'petugas',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "instansiId" TEXT,
    "nip" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshHash" TEXT NOT NULL,
    "device" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Instansi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Instansi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Komoditas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "namaNorm" TEXT NOT NULL,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Komoditas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Pegawai" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "instansiId" TEXT,
    "instansiSub" TEXT,
    "peran" TEXT NOT NULL,
    "peranIcon" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Rekap" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "mingguIndeks" INTEGER NOT NULL,
    "indikator" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rekap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."RekapDetail" (
    "id" TEXT NOT NULL,
    "rekapId" TEXT NOT NULL,
    "komoditasId" TEXT NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,
    "isFluktuasi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RekapDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Rapat" (
    "id" TEXT NOT NULL,
    "topik" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'terjadwal',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."PetugasRapat" (
    "id" TEXT NOT NULL,
    "rapatId" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "peran" TEXT NOT NULL DEFAULT 'peserta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetugasRapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iph_batu"."Notulensi" (
    "id" TEXT NOT NULL,
    "rapatId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "notulisPegawaiId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notulensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "iph_batu"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailNorm_key" ON "iph_batu"."User"("emailNorm");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "iph_batu"."Session"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "iph_batu"."AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Instansi_nama_key" ON "iph_batu"."Instansi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Komoditas_nama_key" ON "iph_batu"."Komoditas"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Komoditas_namaNorm_key" ON "iph_batu"."Komoditas"("namaNorm");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_nip_key" ON "iph_batu"."Pegawai"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "Pegawai_userId_key" ON "iph_batu"."Pegawai"("userId");

-- CreateIndex
CREATE INDEX "Pegawai_status_idx" ON "iph_batu"."Pegawai"("status");

-- CreateIndex
CREATE INDEX "Rekap_createdById_idx" ON "iph_batu"."Rekap"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Rekap_tahun_bulan_mingguIndeks_key" ON "iph_batu"."Rekap"("tahun", "bulan", "mingguIndeks");

-- CreateIndex
CREATE INDEX "RekapDetail_rekapId_idx" ON "iph_batu"."RekapDetail"("rekapId");

-- CreateIndex
CREATE INDEX "Rapat_createdById_idx" ON "iph_batu"."Rapat"("createdById");

-- CreateIndex
CREATE INDEX "Rapat_tanggal_idx" ON "iph_batu"."Rapat"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "PetugasRapat_rapatId_pegawaiId_key" ON "iph_batu"."PetugasRapat"("rapatId", "pegawaiId");

-- CreateIndex
CREATE UNIQUE INDEX "Notulensi_rapatId_key" ON "iph_batu"."Notulensi"("rapatId");

-- AddForeignKey
ALTER TABLE "iph_batu"."User" ADD CONSTRAINT "User_instansiId_fkey" FOREIGN KEY ("instansiId") REFERENCES "iph_batu"."Instansi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "iph_batu"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Pegawai" ADD CONSTRAINT "Pegawai_instansiId_fkey" FOREIGN KEY ("instansiId") REFERENCES "iph_batu"."Instansi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Pegawai" ADD CONSTRAINT "Pegawai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "iph_batu"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Rekap" ADD CONSTRAINT "Rekap_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "iph_batu"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."RekapDetail" ADD CONSTRAINT "RekapDetail_rekapId_fkey" FOREIGN KEY ("rekapId") REFERENCES "iph_batu"."Rekap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."RekapDetail" ADD CONSTRAINT "RekapDetail_komoditasId_fkey" FOREIGN KEY ("komoditasId") REFERENCES "iph_batu"."Komoditas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."PetugasRapat" ADD CONSTRAINT "PetugasRapat_rapatId_fkey" FOREIGN KEY ("rapatId") REFERENCES "iph_batu"."Rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."PetugasRapat" ADD CONSTRAINT "PetugasRapat_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "iph_batu"."Pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Notulensi" ADD CONSTRAINT "Notulensi_rapatId_fkey" FOREIGN KEY ("rapatId") REFERENCES "iph_batu"."Rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iph_batu"."Notulensi" ADD CONSTRAINT "Notulensi_notulisPegawaiId_fkey" FOREIGN KEY ("notulisPegawaiId") REFERENCES "iph_batu"."Pegawai"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
