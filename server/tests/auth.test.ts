import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { PASSWORD, bersihkanSemua, hash, login } from "./fixtures";

const app = createApp();

async function token(email: string, password = PASSWORD) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("petugas@uji.test", "petugas");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menolak email atau sandi yang salah", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "petugas@uji.test", password: "salah-sekali" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Email atau kata sandi tidak valid.");
  });

  it("menolak email yang tidak terdaftar", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bukan@ada.test", password: PASSWORD });

    expect(res.status).toBe(401);
  });

  it("menolak body kosong", async () => {
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(400);
  });

  it("menerima kredensial benar dan mengembalikan token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "petugas@uji.test", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("petugas@uji.test");
  });

  it("menolak akun yang belum diaktifkan", async () => {
    await prisma.user.create({
      data: {
        name: "pending",
        email: "pending@uji.test",
        emailNorm: "pending@uji.test",
        password: await hash(PASSWORD),
        role: "petugas",
        status: "pending",
      },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "pending@uji.test", password: PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body).not.toHaveProperty("accessToken");
  });

  // Password benar tapi akun belum aktif harus memberi respons yang sama
  // dengan password salah. Kalau berbeda, siapa pun bisa memetakan email
  // mana yang terdaftar hanya dari teks respons, tanpa perlu menebak sandi.
  it("menyamakan respons untuk akun belum aktif dan password salah", async () => {
    await prisma.user.create({
      data: {
        name: "nonaktif",
        email: "nonaktif@uji.test",
        emailNorm: "nonaktif@uji.test",
        password: await hash(PASSWORD),
        role: "petugas",
        status: "nonaktif",
      },
    });

    const akunNonaktif = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonaktif@uji.test", password: PASSWORD });

    const sandiSalah = await request(app)
      .post("/api/auth/login")
      .send({ email: "petugas@uji.test", password: "salah-sekali" });

    expect(akunNonaktif.status).toBe(sandiSalah.status);
    expect(akunNonaktif.body).toEqual(sandiSalah.body);
  });
});

describe("token dan sesi", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("aman@uji.test", "petugas");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menolak akses ke /me tanpa token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("menolak token yang dimanipulasi", async () => {
    const asli = await token("aman@uji.test");
    const rusak = asli.slice(0, -3) + "abc";

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${rusak}`);

    expect(res.status).toBe(401);
  });

  it("mencatat sesi aktif dan bisa dicabut", async () => {
    const accessToken = await token("aman@uji.test");

    const sesi = await request(app)
      .get("/api/auth/sessions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(sesi.status).toBe(200);
    expect(sesi.body.rows.length).toBeGreaterThan(0);

    const idSesi = sesi.body.rows[0].id as string;
    const cabut = await request(app)
      .post("/api/auth/sessions/revoke")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ id: idSesi });

    expect(cabut.status).toBe(200);
    expect(cabut.body.message).toMatch(/diakhiri/i);
  });
});