import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { REFRESH_COOKIE } from "../src/lib/env";
import { PASSWORD, bersihkanSemua, hash, login } from "./fixtures";

const app = createApp();

/** Ambil nilai cookie refresh dari header Set-Cookie, bukan dari body. */
function cookieRefresh(res: request.Response): string {
  const header = res.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  const match = list.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
  return match ? match.slice(REFRESH_COOKIE.length + 1).split(";")[0] : "";
}

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
    expect(res.body.user.email).toBe("petugas@uji.test");

    // Refresh token tidak boleh muncul di body; kalau bocor ke localStorage
    // frontend, satu XSS bisa mencuri sesi 30 hari.
    expect(res.body).not.toHaveProperty("refreshToken");
    expect(cookieRefresh(res)).toEqual(expect.any(String));
  });

  it("mengganti refresh token saat login berhasil", async () => {
    const sebelum = cookieRefresh(
      await request(app)
        .post("/api/auth/login")
        .send({ email: "petugas@uji.test", password: PASSWORD })
    );

    const sesudah = cookieRefresh(
      await request(app)
        .post("/api/auth/login")
        .send({ email: "petugas@uji.test", password: PASSWORD })
    );

    expect(sesudah).not.toBe(sebelum);
    expect(sesudah).toEqual(expect.any(String));
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

describe("refresh token lewat cookie httpOnly", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("kuki@uji.test", "petugas");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  /** Login fresh lalu kembalikan access token dan nilai cookie refresh. */
  async function masuk() {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "kuki@uji.test", password: PASSWORD });
    expect(res.status).toBe(200);
    return { accessToken: res.body.accessToken as string, refresh: cookieRefresh(res) };
  }

  it("menyimpan refresh token di cookie httpOnly, bukan di body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "kuki@uji.test", password: PASSWORD });

    expect(res.body).not.toHaveProperty("refreshToken");

    const header = res.headers["set-cookie"];
    const daftar = Array.isArray(header) ? header : header ? [header] : [];
    const mentah = daftar.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));

    expect(mentah).toBeDefined();
    expect(mentah).toMatch(/HttpOnly/i);
    expect(mentah).toMatch(/SameSite=Lax/i);
    expect(mentah).toMatch(/Path=\/api\/auth/i);
  });

  it("memberi access token baru dari cookie dan merotasi refresh token", async () => {
    const awal = await masuk();

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${awal.refresh}`);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body).not.toHaveProperty("refreshToken");

    const baru = cookieRefresh(res);
    expect(baru).toEqual(expect.any(String));
    expect(baru).not.toBe(awal.refresh);
  });

  it("menolak refresh token lama yang sudah dipakai", async () => {
    const awal = await masuk();

    const dipakai = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${awal.refresh}`);
    expect(dipakai.status).toBe(200);

    // Rotasi harus membuat token lama tidak bisa dipakai ulang.
    const ulang = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${awal.refresh}`);

    expect(ulang.status).toBe(401);
  });

  it("menolak refresh tanpa cookie dan dengan cookie sampah", async () => {
    const tanpa = await request(app).post("/api/auth/refresh");
    expect(tanpa.status).toBe(401);

    const sampah = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=bukan-token`);
    expect(sampah.status).toBe(401);
  });

  it("melepas cookie saat refresh ditolak, supaya browser tidak mengulang gagal terus", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=bukan-token`);

    const header = res.headers["set-cookie"];
    const daftar = Array.isArray(header) ? header : header ? [header] : [];
    const mentah = daftar.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));

    expect(mentah).toBeDefined();
    // Nilai dikosongkan dan tanggal kedaluwarsa dipindah ke masa lalu.
    expect(mentah).toMatch(new RegExp(`^${REFRESH_COOKIE}=;`));
    const kedaluwarsa = new Date((mentah!.match(/Expires=([^;]+)/i)?.[1] ?? "") || 0);
    expect(kedaluwarsa.getTime()).toBeLessThan(Date.now());
  });

  it("mencabut sesi dan mengosongkan cookie saat logout tanpa access token", async () => {
    // Sengaja tanpa Authorization: access token bisa kedaluwarsa lebih dulu
    // daripada cookie, dan logout tetap harus membersihkan sesi di server.
    const { refresh } = await masuk();

    const sebelum = await prisma.session.count({ where: { revokedAt: null } });
    expect(sebelum).toBeGreaterThan(0);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `${REFRESH_COOKIE}=${refresh}`);

    expect(res.status).toBe(200);
    expect(cookieRefresh(res)).toBe("");

    const sesudah = await prisma.session.count({ where: { revokedAt: null } });
    expect(sesudah).toBe(sebelum - 1);
  });

  it("mencabut hanya sesi yang dipakai, bukan semua sesi pengguna", async () => {
    const pertama = await masuk();
    const kedua = await masuk();
    expect(pertama.refresh).not.toBe(kedua.refresh);

    const keluar = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `${REFRESH_COOKIE}=${pertama.refresh}`);
    expect(keluar.status).toBe(200);

    // Sesi pertama sudah mati.
    const mati = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${pertama.refresh}`);
    expect(mati.status).toBe(401);

    // Sesi kedua dari perangkat lain harus tetap hidup: keluar dari satu
    // perangkat tidak boleh mencabut login di perangkat yang lain.
    const hidup = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${kedua.refresh}`);
    expect(hidup.status).toBe(200);
  });
});