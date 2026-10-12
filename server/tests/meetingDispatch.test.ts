import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../src/lib/prisma";
import { createApp } from "../src/app";
import { queueDispatch, publicPeriodLink, wibDay } from "../src/lib/meetingDispatch";
import { processNotifications } from "../src/lib/whatsapp";
import { bersihkanSemua, buatRekapFixture, PASSWORD } from "./fixtures";

const app = createApp();
const now = new Date("2026-10-20T10:00:00+07:00");
let admin: string;
let recordId: string;
let ownerId: string;
beforeAll(async () => {
  await bersihkanSemua();
  const fixture = await buatRekapFixture();
  recordId = fixture.lampau.id; ownerId = fixture.admin.id;
  admin = (await request(app).post("/api/auth/login").send({ email: fixture.admin.email, password: PASSWORD })).body.accessToken;
});
beforeEach(async () => { await prisma.rapat.deleteMany(); await prisma.pegawai.deleteMany(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
afterAll(async () => { await bersihkanSemua(); await prisma.$disconnect(); });
async function setup(date = new Date("2026-10-20T09:00:00+07:00")) {
  const phones = ["081234567890", null, "+6281234567890", "081234567891"];
  const employees = [];
  for (let i = 0; i < phones.length; i++) employees.push(await prisma.pegawai.create({ data: { name: `Peserta ${i}`, nip: `19900101202001100${i}`, peran: "Peserta", phone: phones[i] } }));
  const meeting = await prisma.rapat.create({ data: { topik: "Koordinasi IPH", tanggal: date, createdById: ownerId, petugas: { create: employees.map((e, i) => ({ pegawaiId: e.id, peran: i === 0 ? "notulis" : "peserta" })) } } });
  return { meeting, employees };
}
function enable() {
  vi.stubEnv("WHATSAPP_AUTOMATION_ENABLED", "true"); vi.stubEnv("N8N_WHATSAPP_WEBHOOK_URL", "https://example.invalid/send"); vi.stubEnv("N8N_WHATSAPP_TOKEN", "test-token");
  vi.stubEnv("PUBLIC_APP_URL", "https://iph.example.test/");
}
describe("meeting dispatch", () => {
  it("uses WIB days and prevents unusable localhost links", () => {
    expect(wibDay(new Date("2026-10-19T18:00:00Z"))).toBe("2026-10-20");
    vi.stubEnv("PUBLIC_APP_URL", "http://localhost:5173");
    expect(() => publicPeriodLink({ tahun: 2023, bulan: 2, mingguIndeks: 3 })).toThrow("ponsel");
  });
  it("restricts recipient preview and dispatch to administrators", async () => {
    expect((await request(app).get("/api/rapat/example/recipients")).status).toBe(401);
    expect((await request(app).post("/api/rapat/example/broadcast")).status).toBe(401);
    enable();
    const { meeting } = await setup();
    const response = await request(app).get(`/api/rapat/${meeting.id}/recipients?rekapId=${recordId}`).set("Authorization", `Bearer ${admin}`);
    expect(response.status).toBe(200);
    expect(response.body.rows.filter((r: { reason: string | null }) => !r.reason)).toHaveLength(2);
    expect(response.body.dashboardLink).toContain("#/publik?tahun=2023&bulan=2&minggu=3");
  });
  it("queues only valid distinct phones and prevents repeated reminder clicks", async () => {
    const { meeting } = await setup(new Date("2026-10-21T09:00:00+07:00"));
    const first = await prisma.$transaction(tx => queueDispatch(tx, meeting.id, undefined, now));
    expect(first).toMatchObject({ queued: 2, skipped: 2, alreadyQueued: 0 });
    const repeat = await prisma.$transaction(tx => queueDispatch(tx, meeting.id, undefined, now));
    expect(repeat).toMatchObject({ queued: 0, alreadyQueued: 2 });
    const jobs = await prisma.whatsAppNotification.findMany();
    expect(jobs).toHaveLength(2); expect(jobs[0].message).toContain("Pengingat jadwal rapat");
    expect(jobs[0].message).not.toContain("hari ini");
  });
  it("sends the edited draft with a link to the exact period and keeps it valid after meeting start", async () => {
    enable(); const { meeting } = await setup();
    const result = await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis yang telah disunting." }, now));
    expect(result).toMatchObject({ queued: 2, skipped: 2 });
    const jobs = await prisma.whatsAppNotification.findMany();
    expect(jobs[0].message).toContain("Ringkasan hasil analisis yang telah disunting.");
    expect(jobs[0].message).toContain("tahun=2023&bulan=2&minggu=3");
    expect(jobs[0].expiresAt.toISOString()).toBe("2026-10-20T16:59:59.999Z");
    expect(await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis yang telah disunting." }, now))).toMatchObject({ queued: 0, alreadyQueued: 2 });
  });
  it("rejects broadcasts on another day, cancelled meetings and missing public URL without creating jobs", async () => {
    enable(); const { meeting } = await setup();
    expect(await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis" }, new Date("2026-10-19T10:00:00+07:00")))).toMatchObject({ code: 409 });
    vi.stubEnv("PUBLIC_APP_URL", "");
    expect(await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis" }, now))).toMatchObject({ code: 400 });
    await prisma.rapat.update({ where: { id: meeting.id }, data: { status: "dibatalkan" } });
    expect(await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis" }, now))).toMatchObject({ code: 409 });
    expect(await prisma.whatsAppNotification.count()).toBe(0);
  });
  it("processes broadcast for a completed meeting using the broadcast gateway kind", async () => {
    enable(); const { meeting } = await setup();
    await prisma.$transaction(tx => queueDispatch(tx, meeting.id, { rekapId: recordId, text: "Ringkasan hasil analisis" }, now));
    await prisma.rapat.update({ where: { id: meeting.id }, data: { status: "selesai" } });
    const send = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const payload = JSON.parse(String(options?.body));
      expect(payload.kind).toBe("broadcast");
      return new Response(JSON.stringify({ ok: true, eventId: payload.eventId, messageId: "mock-message" }));
    });
    vi.stubGlobal("fetch", send);
    await processNotifications(now);
    expect(send).toHaveBeenCalledTimes(2);
    expect(await prisma.whatsAppNotification.count({ where: { status: "sent" } })).toBe(2);
  });
  it("keeps a queued broadcast when notulensi marks the meeting completed", async () => {
    enable(); const { meeting } = await setup(new Date());
    const payload = { rekapId: recordId, text: "Ringkasan hasil analisis periode terpilih." };
    const first = await request(app).post(`/api/rapat/${meeting.id}/broadcast`).set("Authorization", `Bearer ${admin}`).send(payload);
    expect(first.status).toBe(200); expect(first.body.queued).toBe(2);
    const again = await request(app).post(`/api/rapat/${meeting.id}/broadcast`).set("Authorization", `Bearer ${admin}`).send(payload);
    expect(again.body.alreadyQueued).toBe(2);
    const notes = await request(app).post(`/api/rapat/${meeting.id}/notulensi`).set("Authorization", `Bearer ${admin}`).send({ isi: "Hasil rapat koordinasi telah disepakati." });
    expect(notes.status).toBe(200);
    expect(await prisma.whatsAppNotification.count({ where: { status: "pending", kind: { startsWith: "broadcast:" } } })).toBe(2);
  });
  it("serves an exact historical dashboard without login and rejects unknown periods", async () => {
    const response = await request(app).get("/api/public/rekap/summary?tahun=2023&bulan=2&minggu=3");
    expect(response.status).toBe(200);
    expect(response.body.latest).toMatchObject({ tahun: 2023, bulan: 2, mingguIndeks: 3, iph: 1.82 });
    expect(response.body.trend).toHaveLength(1); expect(response.body.latestDetails[0].name).toBe("Beras Medium");
    expect((await request(app).get("/api/public/rekap/summary?tahun=2024&bulan=2&minggu=3")).status).toBe(404);
    expect((await request(app).get("/api/public/rekap/summary?tahun=2023")).status).toBe(400);
  });
});
