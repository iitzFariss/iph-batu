import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { bersihkanSemua, buatUser } from "./fixtures";

// authLimiter menyimpan state di memori. Test yang exhausting kuota hidup di file
// ini saja; test "login sukses tidak dihitung" dipisah ke file lain karena
// instance limiter bersifat singleton per modul dan tidak menyediakan resetAll.
const app = createApp();

/** Header RateLimit memakai structured fields (draft-7). */
export function rateLimit(res: request.Response) {
  const header = res.headers["ratelimit"] ?? "";
  const ambil = (key: string) => Number(new RegExp(`${key}=\\s*(\\d+)`).exec(header)?.[1] ?? NaN);
  return { mentah: header, limit: ambil("limit"), remaining: ambil("remaining") };
}

describe("authLimiter menghabisi kuota login gagal", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatUser({ email: "limit@uji.test", role: "admin" });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menerima 10 kegagalan lalu membalas 429 pada percobaan ke-11", async () => {
    const kirim = () =>
      request(app).post("/api/auth/login").send({ email: "limit@uji.test", password: "salah" });

    // authLimiter: limit 10 per 15 menit dengan skipSuccessfulRequests.
    for (let i = 0; i < 10; i++) {
      const res = await kirim();
      expect(res.status, `percobaan ke-${i + 1} seharusnya 401`).toBe(401);
    }

    const diblokir = await kirim();
    expect(diblokir.status).toBe(429);
    expect(diblokir.body.message).toMatch(/terlalu banyak/i);
  });

  it("menandai kuota habis pada header respons 429", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "limit@uji.test", password: "salah" });

    expect(res.status).toBe(429);
    const rl = rateLimit(res);
    expect(rl.limit).toBe(10);
    expect(rl.remaining).toBe(0);
  });
});