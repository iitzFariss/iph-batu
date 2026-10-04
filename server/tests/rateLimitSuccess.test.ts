import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { PASSWORD, bersihkanSemua, login } from "./fixtures";

// File terpisah karena authLimiter bersifat singleton: test yang menghabisi kuota
// di rateLimit.test.ts akan membuat test di sini menerima 429 sejak attempt pertama.
const app = createApp();

describe("authLimiter hanya menghitung login gagal", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("aman@uji.test", "petugas");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("12 login berhasil berturut-turut tidak memicu 429", async () => {
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "aman@uji.test", password: PASSWORD });
      expect(res.status, `login ke-${i + 1} seharusnya 200`).toBe(200);
    }
  });
});

describe("writeLimiter di route tulis", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("tulis@uji.test", "admin");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("memancarkan header RateLimit pada route tulis", async () => {
    const res = await request(app).post("/api/rekap").send({});

    // writeLimiter dipasang sebelum requireAuth, jadi 401 pun tetap terhitung.
    expect(res.status).toBe(401);
    expect(res.headers["ratelimit"]).toContain("limit=60");
    expect(res.headers["ratelimit"]).toMatch(/remaining=\d+/);
  });

  it("route baca tidak terkena writeLimiter", async () => {
    const res = await request(app).get("/api/rekap/periods");

    expect(res.headers["ratelimit"]).toBeUndefined();
  });

  it("route tulis master ikut dilindungi", async () => {
    for (const req of [
      request(app).post("/api/komoditas").send({ nama: "Tanpa Token" }),
      request(app).post("/api/pegawai").send({ nip: "1" }),
    ]) {
      const res = await req;
      expect(res.status).toBe(401);
      expect(res.headers["ratelimit"]).toContain("limit=60");
    }
  });
});