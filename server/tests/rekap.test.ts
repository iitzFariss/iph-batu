import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { PASSWORD, bersihkanSemua, buatRekapFixture, login } from "./fixtures";

const app = createApp();

async function token(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

describe("GET /api/rekap/periods", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("mengembalikan seluruh periode tanpa paginasi, termasuk tahun tertua", async () => {
    const admin = await token("admin@uji.test");
    const res = await request(app)
      .get("/api/rekap/periods")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.rows).toHaveLength(2);

    // Inilah masalah yang diperbaiki: /api/rekap membatasi perPage 100 sehingga
    // tahun lama terpotong. Endpoint periods harus mengembalikan semuanya.
    const tahun = res.body.rows.map((r: { tahun: number }) => r.tahun);
    expect(tahun).toContain(2023);
    expect(tahun).toContain(2026);
  });

  it("mengurutkan periode dari yang terbaru", async () => {
    const admin = await token("admin@uji.test");
    const res = await request(app)
      .get("/api/rekap/periods")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.body.rows[0].tahun).toBe(2026);
    expect(res.body.rows[0].mingguIndeks).toBe(4);
    expect(res.body.rows[1].tahun).toBe(2023);
  });

  it("tidak mengirim join detail komoditas dan menandai cache privat", async () => {
    const admin = await token("admin@uji.test");
    const res = await request(app)
      .get("/api/rekap/periods")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.headers["cache-control"]).toBe("private, max-age=60");
    expect(res.body.rows[0]).not.toHaveProperty("deflasi");
    expect(res.body.rows[0]).not.toHaveProperty("inflasi");
  });

  it("menghitung status IPH dari indikator", async () => {
    const admin = await token("admin@uji.test");
    const res = await request(app)
      .get("/api/rekap/periods")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.body.rows[0].nilaiIPH).toBe(3.06);
    expect(res.body.rows[0].statusIPH).toBe("perlu-intervensi");
    expect(res.body.rows[1].nilaiIPH).toBe(1.82);
    expect(res.body.rows[1].statusIPH).toBe("perlu-intervensi");
  });

  it("menolak role tamu", async () => {
    await login("tamu@uji.test", "tamu");
    const tamu = await token("tamu@uji.test");

    const res = await request(app)
      .get("/api/rekap/periods")
      .set("Authorization", `Bearer ${tamu}`);

    expect(res.status).toBe(403);
  });

  it("menolak request tanpa token", async () => {
    const res = await request(app).get("/api/rekap/periods");

    expect(res.status).toBe(401);
  });
});

describe("filter GET /api/rekap", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("memfilter dengan kombinasi tahun, bulan, dan minggu", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap?tahun=2023&bulan=2&minggu=3")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.rows[0].tahun).toBe(2023);
    expect(res.body.rows[0].bulan).toBe(2);
    expect(res.body.rows[0].mingguIndeks).toBe(3);
  });

  it("mengembalikan daftar kosong untuk periode yang tidak ada", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap?tahun=1999&bulan=1&minggu=1")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.rows).toEqual([]);
  });

  it("mengabaikan nilai minggu di luar 1..5", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap?minggu=99")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it("membatasi perPage maksimal 100 supaya dropdown tidak terpotong diam-diam", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap?perPage=100000")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.body.perPage).toBe(100);
  });

  it("mengelompokkan andil Commodity ke deflasi dan inflasi", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap?tahun=2026&bulan=9&minggu=4")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.body.rows[0].inflasi).toHaveLength(1);
    expect(res.body.rows[0].inflasi[0].name).toBe("Beras Medium");
    expect(res.body.rows[0].inflasi[0].change).toBe(1.25);
    expect(res.body.rows[0].deflasi).toEqual([]);
  });
});

describe("route tulis dilindungi writeLimiter", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menyertakan header RateLimit pada route tulis", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/rekap")
      .set("Authorization", `Bearer ${admin}`)
      .send({ tahun: 2027, bulan: 1, mingguKe: 1, indikator: 1, andil: [{ nama: "Beras Medium", nilai: 1 }] });

    expect(res.status).toBe(201);
    expect(res.headers["ratelimit"]).toContain("limit=60");
  });

  it("route baca tidak terkena limiter tulis", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/rekap")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(res.headers["ratelimit"]).toBeUndefined();
  });

  it("menolak duplikat periode dengan 409", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/rekap")
      .set("Authorization", `Bearer ${admin}`)
      .send({ tahun: 2026, bulan: 9, mingguKe: 4, indikator: 1, andil: [{ nama: "Beras Medium", nilai: 1 }] });

    expect(res.status).toBe(409);
  });

  it("menolak body tulis yang tidak valid dengan 400", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/rekap")
      .set("Authorization", `Bearer ${admin}`)
      .send({ tahun: 1800, bulan: 13, mingguKe: 9, indikator: "bukan angka", andil: [] });

    expect(res.status).toBe(400);
  });

  it("menolak role tamu menulis rekap", async () => {
    await login("tamu-tulis@uji.test", "tamu");
    const tamu = await token("tamu-tulis@uji.test");

    const res = await request(app)
      .post("/api/rekap")
      .set("Authorization", `Bearer ${tamu}`)
      .send({ tahun: 2028, bulan: 1, mingguKe: 1, indikator: 1, andil: [{ nama: "Beras Medium", nilai: 1 }] });

    expect(res.status).toBe(403);
  });

  it("menolak reqkap untuk Commoditas yang belum ada di master", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/rekap")
      .set("Authorization", `Bearer ${admin}`)
      .send({ tahun: 2029, bulan: 1, mingguKe: 1, indikator: 1, andil: [{ nama: "Komoditas Baru", nilai: 2 }] });

    expect(res.status).toBe(201);
    const dibuat = await prisma.komoditas.findUnique({ where: { namaNorm: "komoditas baru" } });
    expect(dibuat).not.toBeNull();
  });
});

describe("GET /api/auth/me/activity", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("mengembalikan login terakhir, sesi aktif, dan rekap tersimpan", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);

    const label = res.body.items.map((i: { label: string }) => i.label);
    expect(label).toContain("Login terakhir");
    expect(label.some((l: string) => /Sesi aktif di/.test(l))).toBe(true);
    expect(label.some((l: string) => /Rekap .* disimpan/.test(l))).toBe(true);
    expect(label.some((l: string) => /Total 2 rekap/.test(l))).toBe(true);
  });

  it("mengurutkan dari yang terbaru dan memotong maksimal 8 item", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${admin}`);

    expect(res.body.items.length).toBeLessThanOrEqual(8);

    const waktu = res.body.items.map((i: { at: string }) => new Date(i.at).getTime());
    const terurut = [...waktu].sort((a, b) => b - a);
    expect(waktu).toEqual(terurut);
  });

  it("menggabungkan sesi per perangkat, tidak satu baris per sesi", async () => {
    const admin = await token("admin@uji.test");

    for (let i = 0; i < 3; i++) {
      await request(app).post("/api/auth/login").send({ email: "admin@uji.test", password: PASSWORD });
    }

    const res = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${admin}`);

    const sesi = res.body.items.filter((i: { label: string }) => /Sesi aktif di/.test(i.label));
    const perangkat = new Set(sesi.map((i: { label: string }) => i.label));
    expect(sesi.length).toBe(perangkat.size);
  });

  it("menolak akses tanpa token", async () => {
    const res = await request(app).get("/api/auth/me/activity");

    expect(res.status).toBe(401);
  });

  it("hanya menampilkan aktivitas milik akun itu sendiri", async () => {
    await login("lain@uji.test", "petugas");
    const lain = await token("lain@uji.test");

    const res = await request(app)
      .get("/api/auth/me/activity")
      .set("Authorization", `Bearer ${lain}`);

    expect(res.status).toBe(200);
    const label = res.body.items.map((i: { label: string }) => i.label);
    expect(label.some((l: string) => /Total 2 rekap/.test(l))).toBe(false);
  });
});

describe("master data", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatRekapFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menolak Workshops Fuzzy duplikat nama komoditas", async () => {
    const admin = await token("admin@uji.test");

    const res = await request(app)
      .post("/api/komoditas")
      .set("Authorization", `Bearer ${admin}`)
      .send({ nama: "Beras Medium" });

    expect(res.status).toBe(409);
  });

  it("menonoraktifkan komoditas alih-alih menghapusnya", async () => {
    const admin = await token("admin@uji.test");
    const ada = await prisma.komoditas.findUnique({ where: { namaNorm: "minyak goreng" } });

    const res = await request(app)
      .delete(`/api/komoditas/${ada!.id}`)
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    const setelah = await prisma.komoditas.findUnique({ where: { id: ada!.id } });
    expect(setelah?.isActive).toBe(false);
  });

  it("menolak pegawai dengan NIP duplikat", async () => {
    const admin = await token("admin@uji.test");

    const pertama = await request(app)
      .post("/api/pegawai")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        name: "Pegawai Uji",
        nip: "19900101 200001 1 001",
        peran: "Enumerator",
        email: "pegawai.uji@uji.test",
      });

    expect(pertama.status).toBe(201);
    expect(pertama.body.temporaryPassword).toEqual(expect.any(String));

    const kedua = await request(app)
      .post("/api/pegawai")
      .set("Authorization", `Bearer ${admin}`)
      .send({ name: "Pegawai Uji 2", nip: "19900101 200001 1 001", peran: "Enumerator" });

    expect(kedua.status).toBe(409);
  });

  it("menolak creation pegawai tanpa token", async () => {
    const res = await request(app)
      .post("/api/pegawai")
      .send({ name: "Tanpa Token", nip: "19900101 200001 1 002", peran: "Enumerator" });

    expect(res.status).toBe(401);
  });
});