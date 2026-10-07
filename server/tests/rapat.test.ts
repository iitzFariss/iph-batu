import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { PASSWORD, bersihkanSemua, buatRapatFixture, buatUser } from "./fixtures";

const app = createApp();

async function token(email: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(res.status, "login untuk token test").toBe(200);
  return res.body.accessToken as string;
}

const BODY_RAPAT = {
  topik: "Rapat Koordinasi Infrastruktur",
  tanggal: new Date(Date.now() + 24 * 3600_000).toISOString(),
  lokasi: "Kantor BPS",
  petugas: [] as { pegawaiId: string; peran: string }[],
};

describe("modul rapat", () => {
  let fx: Awaited<ReturnType<typeof buatRapatFixture>>;

  beforeAll(async () => {
    await bersihkanSemua();
    fx = await buatRapatFixture();
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("admin membuat rapat dengan petugas -> 201", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .post("/api/rapat")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        ...BODY_RAPAT,
        petugas: [
          { pegawaiId: fx.notulis.id, peran: "notulis" },
          { pegawaiId: fx.peserta.id, peran: "peserta" },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.rapat.topik).toBe(BODY_RAPAT.topik);
    expect(res.body.rapat.petugas).toHaveLength(2);
    expect(res.body.rapat.notulensi).toBeNull();
  });

  it("menolak rapat tanpa notulis", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .post("/api/rapat")
      .set("Authorization", `Bearer ${admin}`)
      .send({ ...BODY_RAPAT, petugas: [{ pegawaiId: fx.peserta.id, peran: "peserta" }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/notulis/i);
  });

  it("menolak petugas yang tidak aktif/tidak dikenal", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .post("/api/rapat")
      .set("Authorization", `Bearer ${admin}`)
      .send({ ...BODY_RAPAT, petugas: [{ pegawaiId: "id-tidak-ada", peran: "notulis" }] });

    expect(res.status).toBe(400);
  });

  it("petugas hanya melihat rapat yang menjadi bagiannya", async () => {
    const tidakTerlibat = await buatUser({ email: "lain@rapat.test", role: "petugas" });
    await request(app).post("/api/auth/login").send({ email: "lain@rapat.test", password: PASSWORD });

    const [adminT, pesertaT, lainT] = await Promise.all([
      token("admin@rapat.test"),
      token("peserta@rapat.test"),
      token("lain@rapat.test"),
    ]);

    const adminRes = await request(app).get("/api/rapat").set("Authorization", `Bearer ${adminT}`);
    expect(adminRes.body.rows.length).toBeGreaterThanOrEqual(4);

    const pesertaRes = await request(app).get("/api/rapat").set("Authorization", `Bearer ${pesertaT}`);
    expect(pesertaRes.status).toBe(200);
    expect(pesertaRes.body.rows.every((r: { petugas: { name: string }[] }) => r.petugas.some((p) => p.name === fx.peserta.name))).toBe(true);

    const lainRes = await request(app).get("/api/rapat").set("Authorization", `Bearer ${lainT}`);
    expect(lainRes.body.rows).toHaveLength(0);

    await prisma.user.delete({ where: { id: tidakTerlibat.id } }).catch(() => null);
  });

  it("peserta biasa tidak boleh mengisi notulensi -> 403", async () => {
    const pesertaT = await token("peserta@rapat.test");
    const res = await request(app)
      .post(`/api/rapat/${fx.rapatIni.id}/notulensi`)
      .set("Authorization", `Bearer ${pesertaT}`)
      .send({ isi: "Notulensi yang coba diisi peserta biasa." });

    expect(res.status).toBe(403);
  });

  it("notulis dapat menyimpan notulensi", async () => {
    const notulisT = await token("notulis@rapat.test");
    const res = await request(app)
      .post(`/api/rapat/${fx.rapatIni.id}/notulensi`)
      .set("Authorization", `Bearer ${notulisT}`)
      .send({ isi: "Pembahasan harga bahan pokok di minggu ini." });

    expect(res.status).toBe(200);
    expect(res.body.rapat.notulensi.by).toBe(fx.notulis.name);
    expect(res.body.rapat.notulensi.submittedAt).toBeTruthy();
    // Notulensi tersimpan menandai rapat selesai.
    expect(res.body.rapat.status).toBe("selesai");
  });

  it("reminder menurunkan item rapat (besok & hari ini) dan notulensi (H+1)", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app).get("/api/rapat/reminders").set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
    const tipeRapat = res.body.rows.filter((r: { tipe: string }) => r.tipe === "rapat");
    const tipeNotulensi = res.body.rows.filter((r: { tipe: string }) => r.tipe === "notulensi");

    expect(tipeRapat.some((r: { topik: string }) => r.topik === "Rapat Besok")).toBe(true);
    expect(tipeRapat.some((r: { topik: string }) => r.topik === "Rapat Hari Ini")).toBe(true);
    // Rapat kemarin tanpa notulensi memicu reminder notulensi.
    expect(tipeNotulensi.some((r: { topik: string }) => r.topik === "Rapat Kemarin")).toBe(true);
    // Rapat yang sudah punya notulensi tidak memicu reminder notulensi.
    expect(tipeNotulensi.some((r: { topik: string }) => r.topik === "Rapat Kelar")).toBe(false);
  });

  it("reminder membuat tautan wa.me dengan nomor bila ada", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app).get("/api/rapat/reminders").set("Authorization", `Bearer ${admin}`);

    const item = res.body.rows.find((r: { topik: string }) => r.topik === "Rapat Besok");
    expect(item.waLink).toMatch(/^https:\/\/wa\.me\//);
  });

  it("admin membatalkan rapat -> status dibatalkan dan reminder hilang", async () => {
    const admin = await token("admin@rapat.test");

    const patch = await request(app)
      .patch(`/api/rapat/${fx.rapatBesok.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ status: "dibatalkan" });
    expect(patch.status).toBe(200);
    expect(patch.body.rapat.status).toBe("dibatalkan");

    const reminders = await request(app)
      .get("/api/rapat/reminders")
      .set("Authorization", `Bearer ${admin}`);
    expect(
      reminders.body.rows.some((r: { topik: string }) => r.topik === "Rapat Besok")
    ).toBe(false);
  });

  it("menolak status rapat yang tidak dikenal -> 400", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .patch(`/api/rapat/${fx.rapatIni.id}`)
      .set("Authorization", `Bearer ${admin}`)
      .send({ status: "kadaluarsa" });

    expect(res.status).toBe(400);
  });

  it("menghapus pegawai biasa -> 200", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .delete(`/api/pegawai/${fx.peserta.id}`)
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(200);
  });

  it("menolak menghapus pegawai yang masih menjadi notulis -> 409", async () => {
    const admin = await token("admin@rapat.test");
    const res = await request(app)
      .delete(`/api/pegawai/${fx.notulis.id}`)
      .set("Authorization", `Bearer ${admin}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/notulis/i);
  });

  it("tamu tidak boleh membaca daftar instansi -> 403", async () => {
    await buatUser({ email: "tamu@rapat.test", role: "tamu" });
    const tamu = await token("tamu@rapat.test");
    const res = await request(app)
      .get("/api/instansi")
      .set("Authorization", `Bearer ${tamu}`);

    expect(res.status).toBe(403);
  });
});