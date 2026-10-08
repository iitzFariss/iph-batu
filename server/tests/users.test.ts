import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { REFRESH_COOKIE } from "../src/lib/env";
import { PASSWORD, bersihkanSemua, buatUser, hash, login } from "./fixtures";

const app = createApp();

function cookieRefresh(res: request.Response): string {
  const header = res.headers["set-cookie"];
  const list = Array.isArray(header) ? header : header ? [header] : [];
  const match = list.find((c) => c.startsWith(`${REFRESH_COOKIE}=`));
  return match ? match.slice(REFRESH_COOKIE.length + 1).split(";")[0] : "";
}

async function token(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.accessToken as string;
}

async function buatUserStatus(email: string, status: "pending" | "aktif" | "nonaktif") {
  return prisma.user.create({
    data: {
      name: email.split("@")[0],
      email,
      emailNorm: email.toLowerCase(),
      password: await hash(PASSWORD),
      role: "petugas",
      status,
    },
  });
}

describe("POST /api/pegawai/:id/reset-password (admin)", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("admin@reset.test", "admin");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  async function buatPegawaiDenganAkun(email: string, nip: string, userId: string) {
    return prisma.pegawai.create({
      data: { name: "Pegawai Reset", nip, peran: "Staf Data", status: "aktif", email, userId },
    });
  }

  it("mengembalikan sandi baru, mencabut sesi lama, dan bisa masuk dengan sandi baru", async () => {
    const target = await buatUserStatus("korban@reset.test", "aktif");
    const pegawai = await buatPegawaiDenganAkun("korban@reset.test", "199001012010011002", target.id);

    const masukLama = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@reset.test", password: PASSWORD });
    const refreshLama = cookieRefresh(masukLama);

    const res = await request(app)
      .post(`/api/pegawai/${pegawai.id}/reset-password`)
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("korban@reset.test");
    expect(res.body.temporaryPassword).toEqual(expect.any(String));
    expect(res.body.temporaryPassword).toHaveLength(8);

    // Sesi lama mati.
    const ulang = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${refreshLama}`);
    expect(ulang.status).toBe(401);

    // Sandi lama tidak berlaku (401 karena sandi salah), sandi baru berlaku
    // dan status kembali aktif.
    const masukLamaSandi = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@reset.test", password: PASSWORD });
    expect(masukLamaSandi.status).toBe(401);

    const masukBaru = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@reset.test", password: res.body.temporaryPassword });
    expect(masukBaru.status).toBe(200);
  });

  it("menolak reset untuk pegawai yang belum punya akun login", async () => {
    const pegawai = await prisma.pegawai.create({
      data: { name: "Tanpa Akun", nip: "197804102003121002", peran: "Staf Data", status: "aktif" },
    });

    const res = await request(app)
      .post(`/api/pegawai/${pegawai.id}/reset-password`)
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/email/i);
  });

  it("admin tidak bisa mereset kata sandi akun loginnya sendiri", async () => {
    const saya = await buatUser({ email: "admin@resetsendiri.test", role: "admin" });
    const pegawai = await buatPegawaiDenganAkun("admin@resetsendiri.test", "197804102003121011", saya.id);

    const res = await request(app)
      .post(`/api/pegawai/${pegawai.id}/reset-password`)
      .set("Authorization", `Bearer ${await token("admin@resetsendiri.test")}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Pengaturan Akun/);
  });

  it("mengembalikan 404 untuk pegawai yang tidak ada", async () => {
    const res = await request(app)
      .post("/api/pegawai/tidak-ada/reset-password")
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it("petugas ditolak mereset kata sandi", async () => {
    await buatUserStatus("blockir@reset.test", "aktif");
    const res = await request(app)
      .post("/api/pegawai/tidak-ada/reset-password")
      .set("Authorization", `Bearer ${await token("blockir@reset.test")}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

describe("sinkronisasi Pegawai ke akun login (master)", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("admin@sync.test", "admin");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  async function buatPegawai(email: string | null, status = "aktif", nip = "199001012010011002") {
    return prisma.pegawai.create({
      data: {
        name: "Petugas Sinkron",
        nip,
        peran: "Staf Data",
        status,
        email,
      },
      include: { user: { select: { id: true, email: true, name: true, status: true } } },
    });
  }

  it("menambahkan email pada pegawai tanpa akun membuat akun login baru", async () => {
    const pegawai = await buatPegawai(null);

    const res = await request(app)
      .patch(`/api/pegawai/${pegawai.id}`)
      .set("Authorization", `Bearer ${await token("admin@sync.test")}`)
      .send({ email: "baru@sync.test" });

    expect(res.status).toBe(200);
    expect(res.body.temporaryPassword).toEqual(expect.any(String));
    expect(res.body.pegawai.isAccountCreated).toBe(true);

    // Pegawai terhubung ke akun yang baru dibuat.
    const tersimpan = await prisma.pegawai.findUnique({
      where: { id: pegawai.id },
      include: { user: { select: { id: true } } },
    });
    expect(tersimpan!.userId).not.toBeNull();

    // Akun itu betul-betul bisa dipakai login.
    const masuk = await request(app)
      .post("/api/auth/login")
      .send({ email: "baru@sync.test", password: res.body.temporaryPassword });
    expect(masuk.status).toBe(200);
  });

  it("mengubah email pegawai juga mengganti email akun loginnya", async () => {
    const user = await buatUserStatus("lama@sync.test", "aktif");
    await prisma.pegawai.create({
      data: {
        name: "Petugas Ganti Email",
        nip: "198509202009022004",
        peran: "Staf Data",
        status: "aktif",
        email: "lama@sync.test",
        userId: user.id,
      },
    });
    const pegawai = await prisma.pegawai.findUnique({ where: { userId: user.id } });

    const res = await request(app)
      .patch(`/api/pegawai/${pegawai!.id}`)
      .set("Authorization", `Bearer ${await token("admin@sync.test")}`)
      .send({ email: "baru2@sync.test" });

    expect(res.status).toBe(200);

    // Email lama tak berlaku, email baru bisa login.
    const lama = await request(app)
      .post("/api/auth/login")
      .send({ email: "lama@sync.test", password: PASSWORD });
    expect(lama.status).toBe(401);

    const baru = await request(app)
      .post("/api/auth/login")
      .send({ email: "baru2@sync.test", password: PASSWORD });
    expect(baru.status).toBe(200);
  });

  it("menolak email yang sudah dipakai akun lain", async () => {
    await buatUserStatus("dipakai@sync.test", "aktif");
    const pegawai = await buatPegawai(null, "aktif", "199001012010019991");

    const res = await request(app)
      .patch(`/api/pegawai/${pegawai.id}`)
      .set("Authorization", `Bearer ${await token("admin@sync.test")}`)
      .send({ email: "DIPAKAI@sync.test" });

    expect(res.status).toBe(409);
  });

  it("pegawai yang diubah nonaktif menonaktifkan akun loginnya", async () => {
    const user = await buatUserStatus("cuti@sync.test", "aktif");
    await prisma.pegawai.create({
      data: {
        name: "Petugas Cuti",
        nip: "197804102003121002",
        peran: "Staf Data",
        status: "aktif",
        email: "cuti@sync.test",
        userId: user.id,
      },
    });
    const pegawai = await prisma.pegawai.findUnique({ where: { userId: user.id } });

    const res = await request(app)
      .patch(`/api/pegawai/${pegawai!.id}`)
      .set("Authorization", `Bearer ${await token("admin@sync.test")}`)
      .send({ status: "cuti" });

    expect(res.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "cuti@sync.test", password: PASSWORD });
    expect(login.status).toBe(403);
  });
});