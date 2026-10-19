import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "../src/lib/prisma";
import { createApp } from "../src/app";
import { automationEnabled, meetingMessage, processNotifications, queueMeetingNotifications, queueMinutesReminders, reminderTime, sendViaN8n } from "../src/lib/whatsapp";
import { bersihkanSemua, buatUser, PASSWORD } from "./fixtures";

const app = createApp();
const originalEnv = { enabled: process.env.WHATSAPP_AUTOMATION_ENABLED, url: process.env.N8N_WHATSAPP_WEBHOOK_URL, token: process.env.N8N_WHATSAPP_TOKEN };
const job = { id: "test-event", rapatId: "test-meeting", phone: "6281234567890", message: "Undangan rapat", kind: "invitation", expiresAt: new Date("2099-01-01Z") };

afterEach(() => {
  vi.unstubAllGlobals();
  for (const [key, value] of Object.entries({ WHATSAPP_AUTOMATION_ENABLED: originalEnv.enabled, N8N_WHATSAPP_WEBHOOK_URL: originalEnv.url, N8N_WHATSAPP_TOKEN: originalEnv.token })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

function enableWorker() {
  process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
  process.env.N8N_WHATSAPP_WEBHOOK_URL = "https://example.invalid/meeting";
  process.env.N8N_WHATSAPP_TOKEN = "test-only-token";
}

describe("WhatsApp scheduling and gateway", () => {
  it("schedules 07:00 WIB regardless of server timezone", () => {
    expect(reminderTime(new Date("2026-10-20T09:00:00+07:00")).toISOString()).toBe("2026-10-20T00:00:00.000Z");
  });
  it("schedules early meetings one hour beforehand on the same day", () => {
    expect(reminderTime(new Date("2026-10-20T06:30:00+07:00")).toISOString()).toBe("2026-10-19T22:30:00.000Z");
  });
  it("keeps the reminder on the meeting day for meetings just after midnight", () => {
    expect(reminderTime(new Date("2026-10-20T00:30:00+07:00")).toISOString()).toBe("2026-10-19T17:00:00.000Z");
  });
  it("formats the participant role, place and time in WIB", () => {
    const text = meetingMessage({ topik: "Koordinasi", tanggal: new Date("2026-10-20T09:00:00+07:00"), lokasi: "Aula" }, "Rina", "notulis", "reminder");
    expect(text).toContain("Pengingat rapat hari ini"); expect(text).toContain("notulis");
    expect(text).toMatch(/09[.:]00 WIB/); expect(text).toContain("Aula");
  });
  it("requires an explicit switch and both gateway settings", () => {
    enableWorker(); expect(automationEnabled()).toBe(true);
    delete process.env.N8N_WHATSAPP_TOKEN; expect(automationEnabled()).toBe(false);
  });
  it("accepts only an acknowledgement matching the event and provider message ID", async () => {
    enableWorker();
    const mock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true, eventId: job.id, messageId: "wa-id" })));
    expect(await sendViaN8n(job, mock)).toEqual({ status: "sent", messageId: "wa-id" });
    expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toMatchObject({ eventId: job.id, phone: job.phone, expiresAt: job.expiresAt.toISOString() });
    mock.mockResolvedValue(new Response(JSON.stringify({ ok: true, eventId: "wrong", messageId: "wa-id" })));
    expect((await sendViaN8n(job, mock)).status).toBe("unknown");
  });
  it("distinguishes definite rejection from an uncertain server error", async () => {
    const mock = vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 401 }));
    expect((await sendViaN8n(job, mock)).status).toBe("failed");
    mock.mockResolvedValue(new Response("", { status: 500 }));
    expect((await sendViaN8n(job, mock)).status).toBe("unknown");
    mock.mockRejectedValue(new Error("connection lost"));
    expect((await sendViaN8n(job, mock)).status).toBe("unknown");
  });
});

describe("Meeting notification API and persisted queue", () => {
  let admin: string;
  let petugas: string;
  beforeAll(async () => {
    await bersihkanSemua();
    await buatUser({ email: "admin@wa.test", role: "admin" });
    await buatUser({ email: "petugas@wa.test", role: "petugas" });
    admin = (await request(app).post("/api/auth/login").send({ email: "admin@wa.test", password: PASSWORD })).body.accessToken;
    petugas = (await request(app).post("/api/auth/login").send({ email: "petugas@wa.test", password: PASSWORD })).body.accessToken;
  });
  beforeEach(async () => {
    await prisma.rapat.deleteMany(); await prisma.pegawai.deleteMany();
    process.env.WHATSAPP_AUTOMATION_ENABLED = "false";
  });
  afterAll(async () => { await bersihkanSemua(); await prisma.$disconnect(); });

  async function meeting(phone: string | null = "0812 3456 7890") {
    const employee = await prisma.pegawai.create({ data: { name: "Notulis Uji", nip: "199001012020011001", peran: "Notulis", phone } });
    const response = await request(app).post("/api/rapat").set("Authorization", `Bearer ${admin}`).send({ topik: "Rapat Pengujian", tanggal: new Date(Date.now() + 3 * 86400_000).toISOString(), lokasi: "Ruang Rapat", petugas: [{ pegawaiId: employee.id, peran: "notulis" }] });
    expect(response.status).toBe(201);
    return { employee, rapat: response.body.rapat };
  }
  it("lets an admin add, edit and clear a phone number without creating a login", async () => {
    const create = await request(app).post("/api/pegawai").set("Authorization", `Bearer ${admin}`).send({ name: "Pegawai Tanpa Akun", nip: "199001012020011002", peran: "Peserta", phone: "081234567890" });
    expect(create.status).toBe(201); expect(create.body.pegawai.phone).toBe("081234567890"); expect(create.body.pegawai.isAccountCreated).toBe(false);
    const id = create.body.pegawai.id;
    const edit = await request(app).patch(`/api/pegawai/${id}`).set("Authorization", `Bearer ${admin}`).send({ phone: "+62 812 3456 7891" });
    expect(edit.status).toBe(200); expect(edit.body.pegawai.phone).toBe("+62 812 3456 7891");
    const invalid = await request(app).patch(`/api/pegawai/${id}`).set("Authorization", `Bearer ${admin}`).send({ phone: "abc" });
    expect(invalid.status).toBe(400);
    expect((await request(app).patch(`/api/pegawai/${id}`).set("Authorization", `Bearer ${admin}`).send({ phone: null })).status).toBe(200);
    expect((await prisma.pegawai.findUniqueOrThrow({ where: { id } })).phone).toBeNull();
  });
  it("restricts delivery history to administrators", async () => {
    expect((await request(app).get("/api/rapat/notifications")).status).toBe(401);
    expect((await request(app).get("/api/rapat/notifications").set("Authorization", `Bearer ${petugas}`)).status).toBe(403);
  });
  it("only offers a retry while a failed job is still eligible", async () => {
    const { rapat } = await meeting();
    const job = await prisma.whatsAppNotification.findFirstOrThrow({ where: { rapatId: rapat.id, kind: "invitation" } });
    await prisma.whatsAppNotification.update({ where: { id: job.id }, data: { status: "failed" } });
    const history = () => request(app).get("/api/rapat/notifications").set("Authorization", `Bearer ${admin}`);
    expect((await history()).body.rows.find((row: { id: string }) => row.id === job.id).canRetry).toBe(true);
    await prisma.whatsAppNotification.update({ where: { id: job.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await history()).body.rows.find((row: { id: string }) => row.id === job.id).canRetry).toBe(false);
  });
  it("queues invitation and reminder once, atomically with meeting creation", async () => {
    const { rapat } = await meeting();
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id));
    const rows = await prisma.whatsAppNotification.findMany({ where: { rapatId: rapat.id } });
    expect(rows).toHaveLength(2); expect(rows.map(row => row.kind).sort()).toEqual(["invitation", "reminder"]);
    expect(rows.every(row => row.phone === "6281234567890")).toBe(true);
  });
  it("retains a missing-number job and uses the number entered later", async () => {
    const { employee, rapat } = await meeting(null);
    enableWorker(); const mock = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", mock);
    await processNotifications(); expect(mock).not.toHaveBeenCalled();
    await prisma.pegawai.update({ where: { id: employee.id }, data: { phone: "081234567891" } });
    mock.mockImplementation(async (_url, options) => { const data = JSON.parse(String(options?.body)); return new Response(JSON.stringify({ ok: true, eventId: data.eventId, messageId: "wa-id" })); });
    await processNotifications(new Date(Date.now() + 2 * 60_000));
    expect(mock).toHaveBeenCalledTimes(1);
    const sent = await prisma.whatsAppNotification.findFirstOrThrow({ where: { rapatId: rapat.id, kind: "invitation" } });
    expect(sent.status).toBe("sent"); expect(sent.phone).toBe("6281234567891");
  });
  it.each(["invitation", "updated"] as const)("queues only the immediate %s after the reminder time has passed", async kind => {
    const { rapat } = await meeting();
    await prisma.whatsAppNotification.deleteMany({ where: { rapatId: rapat.id } });
    const start = new Date("2099-10-20T11:00:00+07:00");
    const now = new Date("2099-10-20T10:00:00+07:00");
    await prisma.rapat.update({ where: { id: rapat.id }, data: { tanggal: start } });
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id, kind, now));
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id, kind, now));
    const rows = await prisma.whatsAppNotification.findMany({ where: { rapatId: rapat.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe(kind);
    expect(rows[0].scheduledAt).toEqual(now);
    expect(rows[0].expiresAt).toEqual(start);
  });
  it("does not queue an invitation and reminder together at exactly 07:00 WIB", async () => {
    const { rapat } = await meeting();
    await prisma.whatsAppNotification.deleteMany({ where: { rapatId: rapat.id } });
    await prisma.rapat.update({ where: { id: rapat.id }, data: { tanggal: new Date("2099-10-20T11:00:00+07:00") } });
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id, "invitation", new Date("2099-10-20T07:00:00+07:00")));
    const rows = await prisma.whatsAppNotification.findMany({ where: { rapatId: rapat.id } });
    expect(rows.map(row => row.kind)).toEqual(["invitation"]);
  });
  it("queues a reminder when the meeting is saved exactly at its reminder time", async () => {
    const { rapat } = await meeting();
    await prisma.whatsAppNotification.deleteMany({ where: { rapatId: rapat.id } });
    await prisma.rapat.update({ where: { id: rapat.id }, data: { tanggal: new Date("2099-10-20T11:00:00+07:00") } });
    const now = new Date("2099-10-20T07:00:00+07:00");
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id, "reminder_only", now));
    expect(await prisma.whatsAppNotification.count({ where: { rapatId: rapat.id, kind: "reminder", scheduledAt: now } })).toBe(1);
  });
  it.each(["pending", "failed"])("suppresses an old redundant %s reminder without sending a second message", async status => {
    const { rapat } = await meeting();
    await prisma.whatsAppNotification.deleteMany({ where: { rapatId: rapat.id } });
    const now = new Date("2099-10-20T10:00:00+07:00");
    const start = new Date("2099-10-20T11:00:00+07:00");
    await prisma.rapat.update({ where: { id: rapat.id }, data: { tanggal: start } });
    await prisma.$transaction(tx => queueMeetingNotifications(tx, rapat.id, "invitation", now));
    const invitation = await prisma.whatsAppNotification.findFirstOrThrow({ where: { rapatId: rapat.id, kind: "invitation" } });
    await prisma.whatsAppNotification.update({ where: { id: invitation.id }, data: { createdAt: now } });
    const reminder = await prisma.whatsAppNotification.create({ data: {
      rapatId: rapat.id, pegawaiId: invitation.pegawaiId, revision: invitation.revision, kind: "reminder",
      recipientName: invitation.recipientName, phone: invitation.phone, message: "Pengingat uji versi sebelumnya",
      status, scheduledAt: now, createdAt: now, expiresAt: start,
    } });
    enableWorker();
    const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      return new Response(JSON.stringify({ ok: true, eventId: body.eventId, messageId: "test-provider-id" }));
    });
    vi.stubGlobal("fetch", mock);
    await processNotifications(now);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mock.mock.calls[0][1]?.body)).kind).toBe("invitation");
    expect((await prisma.whatsAppNotification.findUniqueOrThrow({ where: { id: reminder.id } })).status).toBe("cancelled");
  });
  it("still sends a future scheduled reminder after its earlier invitation", async () => {
    const { rapat } = await meeting();
    enableWorker();
    const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      return new Response(JSON.stringify({ ok: true, eventId: body.eventId, messageId: "test-provider-id" }));
    });
    vi.stubGlobal("fetch", mock);
    await processNotifications();
    await processNotifications(new Date(reminderTime(new Date(rapat.tanggal)).getTime() + 1000));
    expect(mock.mock.calls.map(call => JSON.parse(String(call[1]?.body)).kind)).toEqual(["invitation", "reminder"]);
    expect((await prisma.whatsAppNotification.findMany({ where: { rapatId: rapat.id } })).every(row => row.status === "sent")).toBe(true);
  });
  it("refreshes queued recipient numbers when the admin edits the employee", async () => {
    const { employee } = await meeting(null);
    const result = await request(app).patch(`/api/pegawai/${employee.id}`).set("Authorization", `Bearer ${admin}`).send({ phone: "081234567893" });
    expect(result.status).toBe(200);
    const rows = await prisma.whatsAppNotification.findMany();
    expect(rows.every(row => row.status === "pending" && row.phone === "6281234567893")).toBe(true);
  });
  it("cancels the old revision and returns the latest participant assignments", async () => {
    const { employee, rapat } = await meeting();
    const other = await prisma.pegawai.create({ data: { name: "Notulis Baru", nip: "199001012020011003", peran: "Notulis", phone: "081234567892" } });
    const response = await request(app).patch(`/api/rapat/${rapat.id}`).set("Authorization", `Bearer ${admin}`).send({ lokasi: "Aula Baru", petugas: [{ pegawaiId: other.id, peran: "notulis" }] });
    expect(response.status).toBe(200); expect(response.body.rapat.petugas[0].pegawaiId).toBe(other.id);
    const rows = await prisma.whatsAppNotification.findMany();
    expect(rows.filter(row => row.pegawaiId === employee.id).every(row => row.status === "cancelled")).toBe(true);
    expect(rows.filter(row => row.pegawaiId === other.id)).toHaveLength(2);
  });
  it("does not broadcast again for an unchanged edit", async () => {
    const { rapat } = await meeting();
    await request(app).patch(`/api/rapat/${rapat.id}`).set("Authorization", `Bearer ${admin}`).send({ topik: rapat.topik });
    expect(await prisma.whatsAppNotification.count()).toBe(2);
  });
  it("cancels pending messages when the meeting is cancelled", async () => {
    const { rapat } = await meeting();
    await request(app).patch(`/api/rapat/${rapat.id}`).set("Authorization", `Bearer ${admin}`).send({ status: "dibatalkan" });
    enableWorker(); const mock = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", mock);
    await processNotifications(); expect(mock).not.toHaveBeenCalled();
    expect((await prisma.whatsAppNotification.findMany()).every(row => row.status === "cancelled")).toBe(true);
  });
  it("does not resend when the gateway outcome is uncertain", async () => {
    await meeting(); enableWorker();
    const mock = vi.fn<typeof fetch>().mockRejectedValue(new Error("response lost")); vi.stubGlobal("fetch", mock);
    await processNotifications(); await processNotifications();
    expect(mock).toHaveBeenCalledTimes(1);
    const uncertain = await prisma.whatsAppNotification.findFirstOrThrow({ where: { status: "unknown" } });
    expect((await request(app).post(`/api/rapat/notifications/${uncertain.id}/retry`).set("Authorization", `Bearer ${admin}`)).status).toBe(409);
  });
  it("uses an atomic claim so concurrent workers do not duplicate a message", async () => {
    await meeting(); enableWorker();
    const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => { const data = JSON.parse(String(options?.body)); return new Response(JSON.stringify({ ok: true, eventId: data.eventId, messageId: "wa-id" })); }); vi.stubGlobal("fetch", mock);
    await Promise.all([processNotifications(), processNotifications()]);
    expect(mock).toHaveBeenCalledTimes(1);
    await processNotifications(); expect(mock).toHaveBeenCalledTimes(1);
  });
  it("expires pending messages without contacting the gateway", async () => {
    const { rapat } = await meeting(); enableWorker();
    const mock = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", mock);
    await processNotifications(new Date(new Date(rapat.tanggal).getTime() + 1));
    expect(mock).not.toHaveBeenCalled();
    expect((await prisma.whatsAppNotification.findMany()).every(row => row.status === "expired")).toBe(true);
  });

  const minutesNow = new Date("2026-10-21T09:00:00+07:00");
  async function overdueMeeting(phone: string | null = "081234567890") {
    const fixture = await meeting(phone);
    await prisma.whatsAppNotification.deleteMany();
    await prisma.rapat.update({ where: { id: fixture.rapat.id }, data: { tanggal: new Date("2026-10-20T23:30:00+07:00") } });
    return fixture;
  }
  it("queues only H+1 at 09 WIB, once per assigned notulis", async () => {
    const { rapat } = await overdueMeeting();
    const guest = await prisma.pegawai.create({ data: { name: "Peserta", nip: "minutes-guest", peran: "Peserta", phone: "081234567891" } });
    await prisma.petugasRapat.create({ data: { rapatId: rapat.id, pegawaiId: guest.id, peran: "peserta" } });
    await queueMinutesReminders(new Date(minutesNow.getTime() - 1));
    expect(await prisma.whatsAppNotification.count()).toBe(0);
    await queueMinutesReminders(minutesNow);
    await queueMinutesReminders(minutesNow);
    const rows = await prisma.whatsAppNotification.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("minutes_reminder");
    expect(rows[0].scheduledAt.toISOString()).toBe("2026-10-21T02:00:00.000Z");
    expect(rows[0].expiresAt.toISOString()).toBe("2026-10-21T17:00:00.000Z");
    expect(rows[0].message).toContain("belum diisi");
    await prisma.whatsAppNotification.deleteMany();
    await queueMinutesReminders(new Date("2026-10-22T09:00:00+07:00"));
    expect(await prisma.whatsAppNotification.count()).toBe(0);
  });
  it("sends minutes through the existing reminder gateway without resending", async () => {
    await overdueMeeting(); enableWorker();
    const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body));
      return new Response(JSON.stringify({ ok: true, eventId: body.eventId, messageId: "minutes-test-id" }));
    });
    vi.stubGlobal("fetch", mock);
    await processNotifications(minutesNow); await processNotifications(minutesNow);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toMatchObject({ kind: "reminder", phone: "6281234567890" });
  });
  it.each(["dibatalkan", "filled", "inactive"])("skips minutes when %s", async state => {
    const { rapat, employee } = await overdueMeeting();
    if (state === "filled") await prisma.notulensi.create({ data: { rapatId: rapat.id, notulisPegawaiId: employee.id, isi: "Sudah lengkap" } });
    else if (state === "inactive") await prisma.pegawai.update({ where: { id: employee.id }, data: { status: "nonaktif" } });
    else await prisma.rapat.update({ where: { id: rapat.id }, data: { status: state } });
    await queueMinutesReminders(minutesNow);
    expect(await prisma.whatsAppNotification.count()).toBe(0);
  });
  it("cancels queued minutes if the minutes were filled or the role changed before delivery", async () => {
    const { rapat, employee } = await overdueMeeting();
    await queueMinutesReminders(minutesNow);
    await prisma.notulensi.create({ data: { rapatId: rapat.id, notulisPegawaiId: employee.id, isi: "Sudah lengkap" } });
    enableWorker(); const mock = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", mock);
    await processNotifications(minutesNow);
    expect(mock).not.toHaveBeenCalled();
    expect((await prisma.whatsAppNotification.findFirstOrThrow()).status).toBe("cancelled");
    await prisma.notulensi.deleteMany(); await prisma.whatsAppNotification.deleteMany();
    await queueMinutesReminders(minutesNow);
    await prisma.petugasRapat.updateMany({ data: { peran: "peserta" } });
    await processNotifications(minutesNow);
    expect(mock).not.toHaveBeenCalled();
    expect((await prisma.whatsAppNotification.findFirstOrThrow()).status).toBe("cancelled");
  });
  it("waits for a missing phone and uses the corrected directory number", async () => {
    const { employee } = await overdueMeeting(null);
    enableWorker(); const mock = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
      const body = JSON.parse(String(options?.body)); return new Response(JSON.stringify({ ok: true, eventId: body.eventId, messageId: "minutes-test-id" }));
    }); vi.stubGlobal("fetch", mock);
    await processNotifications(minutesNow);
    expect(mock).not.toHaveBeenCalled();
    expect((await prisma.whatsAppNotification.findFirstOrThrow()).status).toBe("missing_phone");
    await prisma.pegawai.update({ where: { id: employee.id }, data: { phone: "081234567892" } });
    await processNotifications(new Date(minutesNow.getTime() + 60_000));
    expect(mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(mock.mock.calls[0][1]?.body)).phone).toBe("6281234567892");
  });
});
