import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import prisma from "../src/lib/prisma";
import { bersihkanSemua, buatUser } from "./fixtures";

const app = createApp();

describe("GET /api/health", () => {
  beforeAll(async () => {
    await bersihkanSemua();
    await buatUser({ email: "health@uji.test", role: "admin" });
  });

  afterAll(async () => {
    await bersihkanSemua();
    await prisma.$disconnect();
  });

  it("melaporkan database hidup", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("up");
    expect(res.body.service).toBe("tpid-iph-api");
  });

  it("menyertakan header keamanan helmet", async () => {
    const res = await request(app).get("/api/health");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
  });

  it("menolak body JSON yang melebihi batas 1 MB", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "a@b.test", password: "x".repeat(1024 * 1024 + 64) }));

    expect(res.status).toBe(413);
  });

  it("memberi 404 JSON untuk route yang tidak dikenal", async () => {
    const res = await request(app).get("/api/tidak-ada");

    expect(res.status).toBe(404);
    expect(res.body.message).toBeTruthy();
  });
});