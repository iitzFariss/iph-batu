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

describe("GET /api/users (admin)", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("admin@users.test", "admin");
    await buatUserStatus("pending@users.test", "pending");
    await buatUserStatus("zulkifli@users.test", "aktif");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("admin bisa melihat daftar akun lengkap dengan ringkasan", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${await token("admin@users.test")}`);

    expect(res.status).toBe(200);
    expect(res.body.rows).toBeInstanceOf(Array);
    expect(res.body.ringkasan.total).toBe(3);
    expect(res.body.ringkasan.pending).toBe(1);

    const pending = res.body.rows.find((r: { email: string }) => r.email === "pending@users.test");
    expect(pending.status).toBe("pending");
    expect(pending.isSelf).toBe(false);
  });

  it("akun pending selalu tampil di urutan paling depan", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${await token("admin@users.test")}`);

    expect(res.body.rows[0].email).toBe("pending@users.test");
  });

  it("petugas ditolak mengakses daftar akun", async () => {
    await buatUserStatus("petugas@users.test", "aktif");
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${await token("petugas@users.test")}`);

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/users/:id (admin)", () => {
  beforeAll(async () => {
    await bersihkanSemua();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("menyetujui akun pending sehingga bisa login", async () => {
    await login("admin@approve.test", "admin");
    const petugas = await buatUserStatus("petugas@approve.test", "pending");

    const res = await request(app)
      .patch(`/api/users/${petugas.id}`)
      .set("Authorization", `Bearer ${await token("admin@approve.test")}`)
      .send({ status: "aktif" });

    expect(res.status).toBe(200);
    expect(res.body.user.status).toBe("aktif");

    const masuk = await request(app)
      .post("/api/auth/login")
      .send({ email: "petugas@approve.test", password: PASSWORD });
    expect(masuk.status).toBe(200);
  });

  it("menonaktifkan akun dan langsung mencabut semua sesinya", async () => {
    await login("admin@ban.test", "admin");
    const target = await buatUserStatus("korban@ban.test", "aktif");

    const sesiAwal = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@ban.test", password: PASSWORD });
    const refresh = cookieRefresh(sesiAwal);

    const res = await request(app)
      .patch(`/api/users/${target.id}`)
      .set("Authorization", `Bearer ${await token("admin@ban.test")}`)
      .send({ status: "nonaktif" });

    expect(res.status).toBe(200);

    // Cookie refresh lama sudah dicabut: tidak bisa menukar access token.
    const ulang = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `${REFRESH_COOKIE}=${refresh}`);
    expect(ulang.status).toBe(401);

    // Akun nonaktif tidak bisa login lagi.
    const masuk = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@ban.test", password: PASSWORD });
    expect(masuk.status).toBe(403);
  });

  it("admin tidak bisa mengubah akun diri sendiri", async () => {
    await login("admin@saya.test", "admin");
    const saya = await prisma.user.findUnique({ where: { emailNorm: "admin@saya.test" } });

    const res = await request(app)
      .patch(`/api/users/${saya!.id}`)
      .set("Authorization", `Bearer ${await token("admin@saya.test")}`)
      .send({ status: "nonaktif" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sendiri/i);
  });

  it("role dan status akun administrator tidak bisa diubah", async () => {
    await login("admin@pengubah.test", "admin");
    const adminLain = await buatUser({ email: "admin@sasaran.test", role: "admin" });

    const res = await request(app)
      .patch(`/api/users/${adminLain.id}`)
      .set("Authorization", `Bearer ${await token("admin@pengubah.test")}`)
      .send({ status: "nonaktif" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/administrator/i);
  });

  it("role akun tamu tidak bisa diubah, status boleh diatur", async () => {
    await login("admin@tamu.test", "admin");
    const tamu = await buatUser({ email: "tamu@guard.test", role: "tamu" });

    const ubahRole = await request(app)
      .patch(`/api/users/${tamu.id}`)
      .set("Authorization", `Bearer ${await token("admin@tamu.test")}`)
      .send({ role: "petugas" });
    expect(ubahRole.status).toBe(400);
    expect(ubahRole.body.message).toMatch(/tamu/i);

    const ubahStatus = await request(app)
      .patch(`/api/users/${tamu.id}`)
      .set("Authorization", `Bearer ${await token("admin@tamu.test")}`)
      .send({ status: "nonaktif" });
    expect(ubahStatus.status).toBe(200);
  });

  it("menolak body tanpa role atau status", async () => {
    await login("admin@body.test", "admin");
    await buatUserStatus("sasaran@body.test", "aktif");
    const sasaran = await prisma.user.findUnique({ where: { emailNorm: "sasaran@body.test" } });

    const res = await request(app)
      .patch(`/api/users/${sasaran!.id}`)
      .set("Authorization", `Bearer ${await token("admin@body.test")}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("POST /api/users/:id/reset-password (admin)", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await login("admin@reset.test", "admin");
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("mengembalikan kata sandi baru, mencabut sesi lama, dan bisa masuk dengan sandi baru", async () => {
    const target = await buatUserStatus("korban@reset.test", "aktif");

    const masukLama = await request(app)
      .post("/api/auth/login")
      .send({ email: "korban@reset.test", password: PASSWORD });
    const refreshLama = cookieRefresh(masukLama);

    const res = await request(app)
      .post(`/api/users/${target.id}/reset-password`)
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(200);
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

  it("admin tidak bisa mereset kata sandi dirinya sendiri", async () => {
    const saya = await prisma.user.findUnique({ where: { emailNorm: "admin@reset.test" } });

    const res = await request(app)
      .post(`/api/users/${saya!.id}/reset-password`)
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("mengembalikan 404 untuk akun yang tidak ada", async () => {
    const res = await request(app)
      .post("/api/users/tidak-ada/reset-password")
      .set("Authorization", `Bearer ${await token("admin@reset.test")}`)
      .send({});

    expect(res.status).toBe(404);
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