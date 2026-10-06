import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { invalidateSummary } from "../src/lib/rekapCache";
import { PASSWORD, bersihkanSemua, buatRekapFixture, hash } from "./fixtures";

const app = createApp();

async function token(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

/**
 * Cache summary punya TTL 60 detik dan hidup di level modul, jadi harus
 * dibersihkan eksplisit. Kalau tidak, satu test bisa membaca ringkasan
 * milik test lain yang kebetulan jalan sebelum cache-nya kedaluwarsa.
 */
function cacheBersih() {
  invalidateSummary();
}

describe("GET /api/rekap/summary", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
    await prisma.user.create({
      data: {
        name: "tamu",
        email: "tamu@uji.test",
        emailNorm: "tamu@uji.test",
        password: await hash(PASSWORD),
        role: "tamu",
        status: "aktif",
      },
    });
    cacheBersih();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  beforeEach(() => cacheBersih());

  it("menolak request tanpa token", async () => {
    const res = await request(app).get("/api/rekap/summary");

    expect(res.status).toBe(401);
  });

  it("mengembalikan tren, mingguan, dan frekuensi dari data rekap", async () => {
    const accessToken = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trend)).toBe(true);
    expect(Array.isArray(res.body.weekly)).toBe(true);
    expect(Array.isArray(res.body.frequency)).toBe(true);
    expect(res.body.latestDetails).toBeDefined();

    // Fixture punya dua rekap: 2026 dan 2023.
    const tahunTrend = res.body.trend.map((t: { tahun: number }) => t.tahun);
    expect(tahunTrend).toContain(2026);
    expect(tahunTrend).toContain(2023);
  });

  it("menandai cache HIT pada request kedua dalam TTL", async () => {
    const accessToken = await token("admin@uji.test");

    await request(app)
      .get("/api/rekap/summary")
      .set("Authorization", `Bearer ${accessToken}`);
    const kedua = await request(app)
      .get("/api/rekap/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(kedua.headers["x-cache"]).toBe("HIT");
  });

  it("membolehkan role tamu membaca ringkasan", async () => {
    const accessToken = await token("tamu@uji.test");

    const res = await request(app)
      .get("/api/rekap/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/public/rekap/summary", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
    cacheBersih();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  beforeEach(() => cacheBersih());

  it("tersedia tanpa login untuk halaman publik", async () => {
    const res = await request(app).get("/api/public/rekap/summary");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.trend)).toBe(true);
  });

  it("mengembalikan ringkasan yang sama dengan endpoint yang butuh login", async () => {
    const publik = await request(app).get("/api/public/rekap/summary");
    const accessToken = await token("admin@uji.test");
    const privat = await request(app)
      .get("/api/rekap/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(publik.status).toBe(200);
    expect(privat.status).toBe(200);
    // Endpoint publik sengaja memakai cache yang sama supaya tidak ada dua
    // sumber angka yang bisa berbeda.
    expect(publik.body.trend).toEqual(privat.body.trend);
    expect(publik.body.latest).toEqual(privat.body.latest);
  });

  it("tidak membocorkan data sensitif", async () => {
    const res = await request(app).get("/api/public/rekap/summary");

    const json = JSON.stringify(res.body);
    expect(json).not.toMatch(/password/i);
    expect(json).not.toMatch(/emailNorm|refreshHash|auditLog|preferences/);
  });
});

describe("POST /api/auth/guest", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await prisma.user.create({
      data: {
        name: "tamu",
        email: "tamu@uji.test",
        emailNorm: "tamu@uji.test",
        password: await hash(PASSWORD),
        role: "tamu",
        status: "aktif",
      },
    });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("memberi sesi tamu tanpa perlu kredensial", async () => {
    const res = await request(app).post("/api/auth/guest");

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.role).toBe("tamu");
  });

  it("tidak pernah mengirim refresh token di body", async () => {
    const res = await request(app).post("/api/auth/guest");

    expect(res.body).not.toHaveProperty("refreshToken");
  });

  it("memberi 404 dan jelas kalau akun tamu belum disiapkan", async () => {
    await bersihkanSemua();

    const res = await request(app).post("/api/auth/guest");

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/tamu/i);
  });
});

describe("POST /api/auth/change-password", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await prisma.user.create({
      data: {
        name: "ganti",
        email: "ganti@uji.test",
        emailNorm: "ganti@uji.test",
        password: await hash(PASSWORD),
        role: "petugas",
        status: "aktif",
      },
    });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  const baru = { passwordSaatIni: PASSWORD, passwordBaru: "sandi-baru-456", konfirmasi: "sandi-baru-456" };

  it("menolak request tanpa token", async () => {
    const res = await request(app).post("/api/auth/change-password").send(baru);

    expect(res.status).toBe(401);
  });

  it("menolak password lama yang salah", async () => {
    const accessToken = await token("ganti@uji.test");

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...baru, passwordSaatIni: "salah-total" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/salah/i);
  });

  it("menolak konfirmasi yang tidak sama", async () => {
    const accessToken = await token("ganti@uji.test");

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ ...baru, konfirmasi: "beda-123" });

    expect(res.status).toBe(400);
  });

  it("menolak password baru yang terlalu pendek", async () => {
    const accessToken = await token("ganti@uji.test");

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ passwordSaatIni: PASSWORD, passwordBaru: "pendek", konfirmasi: "pendek" });

    expect(res.status).toBe(400);
  });

  it("menyimpan password baru dan menolaknya di login berikutnya", async () => {
    const accessToken = await token("ganti@uji.test");

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(baru);
    expect(res.status).toBe(200);

    // Password lama tidak boleh masih berlaku.
    const lama = await request(app)
      .post("/api/auth/login")
      .send({ email: "ganti@uji.test", password: PASSWORD });
    expect(lama.status).toBe(401);

    const baruIni = await request(app)
      .post("/api/auth/login")
      .send({ email: "ganti@uji.test", password: baru.passwordBaru });
    expect(baruIni.status).toBe(200);
  });
});

describe("GET /api/instansi", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await prisma.instansi.create({ data: { nama: "DinasPSL" } });
    await prisma.instansi.create({ data: { nama: "Bappeda" } });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.instansi.deleteMany();
    await prisma.$disconnect();
  });

  it("menolak request tanpa token", async () => {
    const res = await request(app).get("/api/instansi");

    expect(res.status).toBe(401);
  });

  it("mengembalikan daftar instansi urut nama", async () => {
    await prisma.user.create({
      data: {
        name: "petugas",
        email: "petugas@uji.test",
        emailNorm: "petugas@uji.test",
        password: await hash(PASSWORD),
        role: "petugas",
        status: "aktif",
      },
    });
    const accessToken = await token("petugas@uji.test");

    const res = await request(app)
      .get("/api/instansi")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.rows.map((i: { nama: string }) => i.nama)).toEqual(["Bappeda", "DinasPSL"]);
  });

  it("hanya mengembalikan id dan nama, bukan kolom internal", async () => {
    await prisma.user.create({
      data: {
        name: "petugas2",
        email: "petugas2@uji.test",
        emailNorm: "petugas2@uji.test",
        password: await hash(PASSWORD),
        role: "petugas",
        status: "aktif",
      },
    });
    const accessToken = await token("petugas2@uji.test");

    const res = await request(app)
      .get("/api/instansi")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.rows[0]).sort()).toEqual(["id", "nama"]);
  });
});

describe("GET /api/auth/me/activity", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    const { admin } = await buatRekapFixture();
    await prisma.rekap.create({
      data: {
        tahun: 2026,
        bulan: 10,
        mingguIndeks: 1,
        indikator: 2.5,
        status: "draft",
        createdById: admin.id,
      },
    });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menyertakan ringkasan jumlah rekap dan perangkat", async () => {
    const accessToken = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ringkasan).toBeDefined();
    // buatRekapFixture membuat 2 rekap, test ini menambah 1 lagi.
    expect(res.body.ringkasan.rekap).toBe(3);
    expect(res.body.ringkasan.perangkat).toBeGreaterThanOrEqual(1);
    expect(res.body.ringkasan.terakhirMasuk).toEqual(expect.any(String));
  });

  it("ringkasan mencerminkan rekap yang dibuat kemudian", async () => {
    const accessToken = await token("admin@uji.test");

    const sebelum = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${accessToken}`);

    await prisma.rekap.create({
      data: {
        tahun: 2026,
        bulan: 10,
        mingguIndeks: 2,
        indikator: 2.9,
        status: "draft",
        createdById: (await prisma.user.findUniqueOrThrow({ where: { emailNorm: "admin@uji.test" } })).id,
      },
    });

    const sesudah = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(sesudah.body.ringkasan.rekap).toBe(sebelum.body.ringkasan.rekap + 1);
  });

  it("menolak akses tanpa token", async () => {
    const res = await request(app).get("/api/auth/me/activity");

    expect(res.status).toBe(401);
  });
});

describe("rute preferences sudah dihapus", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("tidak lagi tersedia dan tidak menyimpan apa pun", async () => {
    const accessToken = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/auth/preferences")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ preferences: { gelap: true } });

    // 404: route-nya dihapus, bukan diam-diam diam-diam menerima.
    expect(res.status).toBe(404);

    // Dan DTO user tidak lagi mengirim kolom config internal.
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(me.body.user).not.toHaveProperty("preferences");
    expect(me.body.user).not.toHaveProperty("auditLog");
  });
});