import request from "supertest";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import prisma from "../src/lib/prisma";
import { createApp } from "../src/app";
import { bersihkanSemua, buatRapatFixture, PASSWORD } from "./fixtures";
import { minutesDeadline, minutesLink, minutesToken, MINUTES_WINDOW_MS } from "../src/lib/minutesLink";
import { parseRekapWorkbook, templateWorkbook } from "../src/lib/rekapExcel";
import { DEFAULT_BROADCAST_TEMPLATE } from "../src/lib/broadcastTemplate";
import { computeStatusIPH } from "../src/lib/rekap";
import { meetingMessage, processNotifications } from "../src/lib/whatsapp";
import { invalidateSummary } from "../src/lib/rekapCache";
import { susunReminder } from "../src/lib/rapat";

const app = createApp();
let fx: Awaited<ReturnType<typeof buatRapatFixture>>, admin: string, staff: string;
beforeAll(async () => {
  await bersihkanSemua(); fx = await buatRapatFixture(); invalidateSummary();
  const login = async (email: string) => (await request(app).post("/api/auth/login").send({ email, password: PASSWORD })).body.accessToken as string;
  admin = await login("admin@rapat.test"); staff = await login("notulis@rapat.test");
});
afterAll(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await bersihkanSemua(); await prisma.$disconnect(); });
const auth = () => ({ Authorization: `Bearer ${admin}` });
const period = { tahun: 2040, bulan: 10, mingguKe: 1, indikator: 2.1100, andil: [{ nama: "Daging Sapi", nilai: .8342 }, { nama: "Cabai Rawit", nilai: .4935 }, { nama: "Cabai Merah", nilai: .3924 }, { nama: "Beras", nilai: .1234 }] };
async function workbook(rows: unknown[][]) {
  const book = new ExcelJS.Workbook(); await book.xlsx.load(await templateWorkbook());
  const sheet = book.getWorksheet("Data IPH")!;
  rows.forEach((row, i) => { sheet.getRow(i + 2).values = row as ExcelJS.CellValue[]; });
  return Buffer.from(await book.xlsx.writeBuffer());
}
async function createMeeting() {
  const result = await request(app).post("/api/rapat").set(auth()).send({
    topik: "Rapat pengujian notulensi", tanggal: new Date(Date.now() + 30 * 86400000).toISOString(), lokasi: "Ruang rapat", tautanRapat: "https://example.com/rapat",
    petugas: [{ pegawaiId: fx.notulis.id, peran: "notulis" }, { pegawaiId: fx.peserta.id, peran: "peserta" }],
  });
  expect(result.status).toBe(201); return result.body.rapat as { id: string; notulensiLink: string; notulensiDeadline: string };
}
describe("revisi laporan IPH", () => {
  it("kategori hanya mengikuti arah nilai; nol tidak disebut inflasi", () => {
    expect(computeStatusIPH(20)).toBe("inflasi"); expect(computeStatusIPH(-5)).toBe("deflasi"); expect(computeStatusIPH(0)).toBe("tidak-berubah");
  });
  it("menyimpan empat desimal dan mempertahankan seluruh komoditas", async () => {
    expect((await request(app).post("/api/rekap").set(auth()).send(period)).status).toBe(201);
    const response = await request(app).get("/api/rekap?tahun=2040").set(auth());
    expect(response.body.rows[0].inflasi).toHaveLength(4);
    expect(response.body.rows[0].inflasi[0].change).toBe(.8342);
    expect(response.body.rows[0].statusIPH).toBe("inflasi");
  });
  it("menolak lebih dari empat desimal tanpa menulis periode", async () => {
    const result = await request(app).post("/api/rekap").set(auth()).send({ ...period, mingguKe: 2, indikator: 1.23456 });
    expect(result.status).toBe(400); expect(await prisma.rekap.count({ where: { tahun: 2040, mingguIndeks: 2 } })).toBe(0);
  });
  it("frekuensi menyertakan bulan dan tidak menghitung ganda nama dalam satu pekan", async () => {
    invalidateSummary();
    const response = await request(app).get("/api/public/rekap/summary");
    const row = response.body.frequencyPeriods.find((p: { tahun: number }) => p.tahun === 2040);
    expect(row.bulan).toBe(10); expect(row.names).toContain("Daging Sapi");
  });
  it("CSV tanpa cutoff atau status, dengan presisi empat desimal", async () => {
    const response = await request(app).get("/api/rekap/export").set(auth());
    expect(response.status).toBe(200); expect(response.text.split("\n")[0]).not.toMatch(/cutoff|status/i); expect(response.text).toContain("0,8342");
  });
  it("ekspor Excel berupa workbook asli, bukan CSV berganti ekstensi", async () => {
    const response = await request(app).get("/api/rekap/export?format=xlsx").set(auth()).buffer(true).parse((res, callback) => {
      const chunks: Buffer[] = []; res.on("data", chunk => chunks.push(Buffer.from(chunk))); res.on("end", () => callback(null, Buffer.concat(chunks)));
    });
    expect(response.status).toBe(200);
    const book = new ExcelJS.Workbook(); await book.xlsx.load(response.body);
    const sheet = book.getWorksheet("Rekap IPH")!;
    expect(sheet.getRow(1).values).not.toEqual(expect.arrayContaining(["Status", "Cutoff Mulai"]));
    expect(sheet.getColumn(4).numFmt).toContain("0.0000"); expect(sheet.views[0].state).toBe("frozen");
  });
});
describe("impor Excel", () => {
  it("template memiliki panduan, validasi sel, dan format empat desimal", async () => {
    const book = new ExcelJS.Workbook(); await book.xlsx.load(await templateWorkbook());
    expect(book.getWorksheet("Panduan")).toBeDefined(); expect(book.getWorksheet("Data IPH")!.getCell("D2").numFmt).toContain("0.0000");
  });
  it("pratinjau tidak menulis; simpan bersifat atomik dan duplikasi ditolak", async () => {
    const file = await workbook([[2041, 1, 1, -1.2345, "Beras", -.8342, "andil"], [2041, 1, 2, 2.1100, "Cabai Rawit", .4935, "andil"]]);
    const body = { base64: file.toString("base64") };
    const preview = await request(app).post("/api/rekap/import").set(auth()).send(body);
    expect(preview.status).toBe(200); expect(preview.body.periods).toHaveLength(2); expect(await prisma.rekap.count({ where: { tahun: 2041 } })).toBe(0);
    const commit = await request(app).post("/api/rekap/import").set(auth()).send({ ...body, commit: true });
    expect(commit.status).toBe(200); expect(await prisma.rekap.count({ where: { tahun: 2041 } })).toBe(2);
    expect((await request(app).post("/api/rekap/import").set(auth()).send({ ...body, commit: true })).status).toBe(409);
  });
  it("menolak rumus, jenis tidak dikenal, duplikasi, dan angka terlalu presisi", async () => {
    for (const rows of [
      [[2042, 1, 1, 1.23456, "Beras", .1234, "andil"]],
      [[2042, 1, 1, 1.2345, "Beras", .1234, "lainnya"]],
      [[2042, 1, 1, 1.2345, "Beras", .1234, "andil"], [2042, 1, 1, 1.2345, "beras", .1234, "andil"]],
      [[2042, 1, 1, { formula: "1+1", result: 2 }, "Beras", .1234, "andil"]],
    ]) await expect(parseRekapWorkbook(await workbook(rows))).rejects.toThrow();
    expect(await prisma.rekap.count({ where: { tahun: 2042 } })).toBe(0);
  });
  it("pegawai tidak boleh mengimpor atau mengambil template admin", async () => {
    expect((await request(app).get("/api/rekap/template").set("Authorization", `Bearer ${staff}`)).status).toBe(403);
  });
});
describe("template siaran permanen", () => {
  it("template bawaan mengikuti format BPS dan perubahan bertahan pada GET berikutnya", async () => {
    const get = await request(app).get("/api/rekap/siaran-template").set(auth());
    expect(get.body.template).toBe(DEFAULT_BROADCAST_TEMPLATE);
    const template = DEFAULT_BROADCAST_TEMPLATE.replace("Yth. Bapak/Ibu,", "Yth. Peserta rapat,");
    expect((await request(app).put("/api/rekap/siaran-template").set(auth()).send({ template })).status).toBe(200);
    const reload = await request(app).get("/api/rekap/siaran-template").set(auth());
    expect(reload.body.template).toBe(template); expect(reload.body.custom).toBe(true);
  });
  it("menolak perubahan dari petugas atau hilangnya penanda data", async () => {
    expect((await request(app).put("/api/rekap/siaran-template").set("Authorization", `Bearer ${staff}`).send({ template: DEFAULT_BROADCAST_TEMPLATE })).status).toBe(403);
    expect((await request(app).put("/api/rekap/siaran-template").set(auth()).send({ template: "Semua data diganti menjadi angka tetap." })).status).toBe(400);
  });
});
describe("notulensi dari tautan undangan", () => {
  it("tautan dapat dibuka sebelum rapat, menyimpan sebagai notulis, dan tidak menutup rapat mendatang", async () => {
    const meeting = await createMeeting(), token = meeting.notulensiLink.split("#/notulensi/")[1];
    const read = await request(app).get(`/api/public/notulensi/${token}`);
    expect(read.status).toBe(200); expect(read.body.expired).toBe(false);
    const save = await request(app).post(`/api/public/notulensi/${token}`).send({ isi: "Hasil pembahasan dan tindak lanjut rapat pengujian." });
    expect(save.status).toBe(200);
    const stored = await prisma.rapat.findUniqueOrThrow({ where: { id: meeting.id }, include: { notulensi: true } });
    expect(stored.notulensi?.notulisPegawaiId).toBe(fx.notulis.id); expect(stored.status).toBe("terjadwal");
  });
  it("menolak token palsu dan token yang menunjuk peserta bukan notulis", async () => {
    const meeting = await createMeeting(), stored = await prisma.rapat.findUniqueOrThrow({ where: { id: meeting.id } });
    expect((await request(app).get(`/api/public/notulensi/${minutesToken(stored.notulensiKey!, fx.peserta.id)}`)).status).toBe(404);
    expect((await request(app).get(`/api/public/notulensi/${minutesToken(randomUUID(), fx.notulis.id)}x`)).status).toBe(404);
  });
  it("batas tujuh hari dihitung dari pengiriman undangan, bukan tanggal rapat", async () => {
    const meeting = await createMeeting();
    const sent = new Date(Date.now() - 8 * 86400000);
    const stored = await prisma.rapat.update({ where: { id: meeting.id }, data: { notulensiInvitedAt: sent } });
    expect(minutesDeadline(stored).getTime()).toBe(sent.getTime() + MINUTES_WINDOW_MS);
    const token = meeting.notulensiLink.split("#/notulensi/")[1];
    expect((await request(app).get(`/api/public/notulensi/${token}`)).body.expired).toBe(true);
    expect((await request(app).post(`/api/public/notulensi/${token}`).send({ isi: "Tidak boleh disimpan setelah batas berakhir." })).status).toBe(410);
    expect((await request(app).post(`/api/rapat/${meeting.id}/notulensi`).set(auth()).send({ isi: "Tidak boleh melewati batas dari endpoint lain." })).status).toBe(410);
    expect((await request(app).get(`/api/rapat/${meeting.id}`).set(auth())).body.rapat.dapatNotulensi).toBe(false);
  });
  it("perubahan penugasan dan pembatalan mencabut akses tautan lama", async () => {
    const meeting = await createMeeting(), token = meeting.notulensiLink.split("#/notulensi/")[1];
    await prisma.petugasRapat.updateMany({ where: { rapatId: meeting.id, pegawaiId: fx.notulis.id }, data: { peran: "peserta" } });
    expect((await request(app).get(`/api/public/notulensi/${token}`)).status).toBe(404);
    await prisma.rapat.update({ where: { id: meeting.id }, data: { status: "dibatalkan" } });
    expect((await request(app).post(`/api/public/notulensi/${token}`).send({ isi: "Tautan tidak boleh berlaku lagi setelah rapat dibatalkan." })).status).toBe(404);
  });
  it("pengingat manual notulensi berhenti sesudah batas pengisian", () => {
    expect(susunReminder({ rapatId: "test", topik: "Rapat lama", tanggal: new Date(Date.now() - 2 * 86400000), status: "terjadwal", notulensi: null, notulensiDeadline: new Date(Date.now() - 1000), petugas: [{ id: fx.notulis.id, peran: "notulis", name: "Notulis", phone: null }] })).toEqual([]);
  });
  it("tautan pengisian hanya ada pada pesan notulis", () => {
    const meeting = { topik: "Pengujian", tanggal: new Date(), lokasi: "Kantor", notulensiKey: randomUUID() };
    expect(meetingMessage(meeting, "Notulis", "notulis", "invitation", fx.notulis.id)).toContain(minutesLink(meeting.notulensiKey, fx.notulis.id));
    expect(meetingMessage(meeting, "Peserta", "peserta", "invitation", fx.peserta.id)).not.toContain("#/notulensi/");
  });
  it("tautan tetap valid pada backend lain meskipun JWT login berbeda", async () => {
    const key = randomUUID(), token = minutesToken(key, fx.notulis.id);
    vi.stubEnv("JWT_REFRESH_SECRET", "different-backend-login-secret");
    vi.resetModules();
    const otherBackend = await import("../src/lib/minutesLink");
    const otherPrisma = (await import("../src/lib/prisma")).default;
    try {
      await otherBackend.prepareMinutesLinks();
      expect(otherBackend.readMinutesToken(token)).toEqual({ key, pegawaiId: fx.notulis.id });
    } finally { await otherPrisma.$disconnect(); vi.unstubAllEnvs(); }
  });
  it("pengiriman undangan terkonfirmasi mencatat awal batas waktu tanpa mengirim pesan nyata", async () => {
    await prisma.whatsAppNotification.deleteMany();
    await prisma.pegawai.update({ where: { id: fx.notulis.id }, data: { phone: "081234567890" } });
    vi.stubEnv("WHATSAPP_AUTOMATION_ENABLED", "true"); vi.stubEnv("N8N_WHATSAPP_WEBHOOK_URL", "https://example.test/webhook"); vi.stubEnv("N8N_WHATSAPP_TOKEN", "test-only");
    vi.stubGlobal("fetch", vi.fn(async (_url, init) => { const data = JSON.parse(String(init.body)); return new Response(JSON.stringify({ ok: true, eventId: data.eventId, messageId: "test-receipt" }), { status: 200 }); }));
    const meeting = await createMeeting();
    await processNotifications();
    const stored = await prisma.rapat.findUniqueOrThrow({ where: { id: meeting.id } });
    expect(stored.notulensiInvitedAt).not.toBeNull();
    expect(minutesDeadline(stored).getTime()).toBe(stored.notulensiInvitedAt!.getTime() + MINUTES_WINDOW_MS);
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });
});
