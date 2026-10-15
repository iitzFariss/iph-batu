import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../src/app";

let directory: string;
beforeAll(() => {
  directory = mkdtempSync(path.join(tmpdir(), "iph-frontend-"));
  mkdirSync(path.join(directory, "assets"));
  writeFileSync(path.join(directory, "index.html"), '<!doctype html><div id="root">IPH</div>');
  writeFileSync(path.join(directory, "assets", "app.js"), 'console.log("IPH");');
  writeFileSync(path.join(directory, ".env"), "NOT_PUBLIC=true");
  mkdirSync(path.join(directory, "api"));
  writeFileSync(path.join(directory, "api", "not-a-route"), "should not serve");
});
afterEach(() => vi.unstubAllEnvs());
afterAll(() => rmSync(directory, { recursive: true, force: true }));
function enable() { vi.stubEnv("SERVE_FRONTEND", "true"); vi.stubEnv("FRONTEND_DIST_DIR", directory); }
describe("single-port frontend deployment", () => {
  it("keeps the development backend API-only by default", async () => {
    vi.stubEnv("SERVE_FRONTEND", "false");
    expect((await request(createApp()).get("/")).status).toBe(404);
  });
  it("serves built HTML and scripts without requiring login", async () => {
    enable(); const app = createApp();
    const html = await request(app).get("/");
    expect(html.status).toBe(200); expect(html.headers["content-type"]).toContain("text/html");
    expect(html.headers["cache-control"]).toBe("no-cache");
    const script = await request(app).get("/assets/app.js");
    expect(script.status).toBe(200); expect(script.text).toContain("IPH");
  });
  it("does not expose dotfiles or serve frontend files for unknown API paths", async () => {
    enable(); const app = createApp();
    expect((await request(app).get("/.env")).status).not.toBe(200);
    const result = await request(app).get("/api/not-a-route");
    expect(result.status).toBe(404); expect(result.headers["content-type"]).toContain("application/json");
  });
  it("fails clearly when deployment is enabled without a frontend build", () => {
    enable(); vi.stubEnv("FRONTEND_DIST_DIR", path.join(directory, "not-built"));
    expect(() => createApp()).toThrow("Build frontend belum tersedia");
  });
});
