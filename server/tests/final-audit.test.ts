import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { formatTanggal, selisihHari, susunReminder } from "../src/lib/rapat";
import { bersihkanSemua, buatUser, PASSWORD } from "./fixtures";

const app = createApp();

describe("regresi alur admin dan petugas", () => {
  let adminId: string;
  let adminToken: string;
  let userId: string;
  let userToken: string;
  let instansiId: string;

  beforeEach(async () => {
    await bersihkanSemua();
    const admin = await buatUser({ email: "admin@final.test", role: "admin" });
    const user = await buatUser({ email: "petugas@final.test", role: "petugas" });
    adminId = admin.id;
    userId = user.id;
    instansiId = (await prisma.instansi.create({ data: { nama: "Instansi Uji" } })).id;
    await prisma.user.update({ where: { id: userId }, data: { instansiId } });
    adminToken = (await request(app).post("/api/auth/login").send({ email: admin.email, password: PASSWORD })).body.accessToken;
    userToken = (await request(app).post("/api/auth/login").send({ email: user.email, password: PASSWORD })).body.accessToken;
  });
  afterAll(async () => { await bersihkanSemua(); await prisma.$disconnect(); });

  it("mengganti kata sandi petugas dengan kontrak formulir dan mencabut sesi lainnya", async () => {
    const oldLogin = await request(app).post("/api/auth/login").send({ email: "petugas@final.test", password: PASSWORD });
    const updated = await request(app).post("/api/auth/change-password").set("Authorization", `Bearer ${userToken}`)
      .send({ passwordSaatIni: PASSWORD, passwordBaru: "baru-final-123", konfirmasi: "baru-final-123" });
    expect(updated.status).toBe(200);
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldLogin.body.accessToken}`)).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${userToken}`)).status).toBe(200);
    expect((await request(app).post("/api/auth/login").send({ email: "petugas@final.test", password: PASSWORD })).status).toBe(401);
    expect((await request(app).post("/api/auth/login").send({ email: "petugas@final.test", password: "baru-final-123" })).status).toBe(200);
  });

  it("menjelaskan konfirmasi yang hilang dengan bahasa Indonesia", async () => {
    const response = await request(app).post("/api/auth/change-password").set("Authorization", `Bearer ${userToken}`)
      .send({ passwordSaatIni: PASSWORD, passwordBaru: "baru-final-123" });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: "Konfirmasi kata sandi wajib diisi.", field: "konfirmasi" });
  });

  it("menyimpan profil tanpa mengosongkan instansi yang tidak dikirim", async () => {
    const response = await request(app).patch("/api/auth/me").set("Authorization", `Bearer ${userToken}`).send({ name: "Nama Setelah Edit", bio: "Profil diperbarui" });
    expect(response.status).toBe(200);
    expect(response.body.user.instansi.id).toBe(instansiId);
    const cleared = await request(app).patch("/api/auth/me").set("Authorization", `Bearer ${userToken}`).send({ instansi: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.user.instansi).toBeNull();
  });

  it("edit nomor pegawai mempertahankan instansi pegawai dan akun terkait", async () => {
    const employee = await prisma.pegawai.create({ data: { name: "Pegawai Uji", nip: "199001012020011001", peran: "Notulis", instansiId, userId } });
    const response = await request(app).patch(`/api/pegawai/${employee.id}`).set("Authorization", `Bearer ${adminToken}`).send({ phone: "081234567890" });
    expect(response.status).toBe(200);
    expect((await prisma.pegawai.findUniqueOrThrow({ where: { id: employee.id } })).instansiId).toBe(instansiId);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).instansiId).toBe(instansiId);
  });

  it("tidak membuat akun secara diam-diam ketika mengubah nomor direktori lama", async () => {
    const employee = await prisma.pegawai.create({ data: { name: "Direktori Lama", nip: "199001012020011001", peran: "Peserta", email: "direktori@final.test", instansiId } });
    const response = await request(app).patch(`/api/pegawai/${employee.id}`).set("Authorization", `Bearer ${adminToken}`).send({ phone: "081234567890" });
    expect(response.status).toBe(200);
    expect((await prisma.pegawai.findUniqueOrThrow({ where: { id: employee.id } })).userId).toBeNull();
    expect(await prisma.user.count({ where: { emailNorm: "direktori@final.test" } })).toBe(0);
  });

  it("tidak meninggalkan akun login ketika penyimpanan pegawai gagal", async () => {
    const failure = vi.spyOn(prisma.pegawai, "create").mockRejectedValueOnce(new Error("Kegagalan database simulasi"));
    try {
      const response = await request(app).post("/api/pegawai").set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Pegawai Gagal", nip: "199001012020011001", peran: "Notulis", email: "gagal@final.test" });
      expect(response.status).toBe(500);
      expect(await prisma.user.count({ where: { emailNorm: "gagal@final.test" } })).toBe(0);
    } finally { failure.mockRestore(); }
  });

  it("tidak menampilkan sesi kedaluwarsa sebagai sesi aktif", async () => {
    const expired = await prisma.session.create({ data: { userId, refreshHash: "expired-test", expiresAt: new Date(0) } });
    const response = await request(app).get("/api/auth/sessions").set("Authorization", `Bearer ${userToken}`);
    expect(response.status).toBe(200);
    expect(response.body.rows.some((row: { id: string }) => row.id === expired.id)).toBe(false);
  });

  it("langsung menolak access token sesi yang diakhiri", async () => {
    const sessions = await request(app).get("/api/auth/sessions").set("Authorization", `Bearer ${userToken}`);
    const current = sessions.body.rows.find((row: { isCurrent: boolean }) => row.isCurrent);
    expect((await request(app).post("/api/auth/sessions/revoke").set("Authorization", `Bearer ${userToken}`).send({ id: current.id })).status).toBe(200);
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${userToken}`)).status).toBe(401);
  });

  it("langsung menerapkan status dan peran akun terbaru pada access token lama", async () => {
    await prisma.user.update({ where: { id: adminId }, data: { role: "petugas" } });
    expect((await request(app).get("/api/pegawai").set("Authorization", `Bearer ${adminToken}`)).status).toBe(403);
    await prisma.user.update({ where: { id: userId }, data: { status: "nonaktif" } });
    expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${userToken}`)).status).toBe(401);
  });

  it("menjaga detail rekap saat PATCH hanya mengubah IPH", async () => {
    const commodity = await prisma.komoditas.create({ data: { nama: "Komoditas Uji", namaNorm: "komoditas uji" } });
    const record = await prisma.rekap.create({ data: { tahun: 2026, bulan: 10, mingguIndeks: 1, indikator: 1, createdById: adminId,
      details: { create: [{ komoditasId: commodity.id, nilai: -0.5 }, { komoditasId: commodity.id, nilai: 1.5, isFluktuasi: true }] } } });
    const response = await request(app).patch(`/api/rekap/${record.id}`).set("Authorization", `Bearer ${adminToken}`).send({ nilaiIPH: 2 });
    expect(response.status).toBe(200);
    const details = await prisma.rekapDetail.findMany({ where: { rekapId: record.id } });
    expect(details).toHaveLength(2);
    expect(details.map(d => [d.komoditasId, d.nilai, d.isFluktuasi])).toEqual(expect.arrayContaining([[commodity.id, -0.5, false], [commodity.id, 1.5, true]]));
    expect((await prisma.rekap.findUniqueOrThrow({ where: { id: record.id } })).indikator).toBe(2);
  });

  it("mencatat notulis yang benar ketika notulis kedua mengirim notulensi", async () => {
    const first = await prisma.pegawai.create({ data: { name: "Notulis Pertama", nip: "199001012020011001", peran: "Notulis" } });
    const second = await prisma.pegawai.create({ data: { name: "Notulis Kedua", nip: "199001012020011002", peran: "Notulis", userId } });
    const meeting = await prisma.rapat.create({ data: { topik: "Rapat Dua Notulis", tanggal: new Date(), createdById: adminId,
      petugas: { create: [{ pegawaiId: first.id, peran: "notulis" }, { pegawaiId: second.id, peran: "notulis" }] } } });
    const response = await request(app).post(`/api/rapat/${meeting.id}/notulensi`).set("Authorization", `Bearer ${userToken}`).send({ isi: "Hasil rapat dicatat oleh notulis kedua." });
    expect(response.status).toBe(200);
    expect(response.body.rapat.notulensi.by).toBe(second.name);
    expect((await prisma.notulensi.findUniqueOrThrow({ where: { rapatId: meeting.id } })).notulisPegawaiId).toBe(second.id);
  });
});

describe("pengingat mengikuti kalender WIB", () => {
  it("memakai pergantian tanggal WIB meskipun kedua waktu masih satu tanggal UTC", () => {
    expect(selisihHari(new Date("2026-10-19T18:00:00Z"), new Date("2026-10-19T15:00:00Z"))).toBe(1);
    expect(formatTanggal(new Date("2026-10-19T18:00:00Z"))).toContain("20 Oktober 2026");
  });
  it("menyiapkan pengingat manual bagi seluruh notulis yang belum mengisi", () => {
    const rows = susunReminder({ rapatId: "test", topik: "Uji Pengingat", tanggal: new Date(Date.now() - 3 * 86_400_000), status: "terjadwal", notulensi: null,
      petugas: [{ id: "a", peran: "notulis", name: "A", phone: null }, { id: "b", peran: "notulis", name: "B", phone: null }, { id: "c", peran: "peserta", name: "C", phone: null }] });
    expect(rows.map(r => r.untuk)).toEqual(["A", "B"]);
  });
});
