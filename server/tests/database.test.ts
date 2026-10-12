import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPostgresUrl } from "../src/lib/database";

describe("Konfigurasi PostgreSQL kantor", () => {
  it("memakai tunnel dan schema project sebagai default", () => {
    const url = new URL(getPostgresUrl({ PGPASSWORD: "test-only" }));
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.port).toBe("15433");
    expect(url.pathname).toBe("/db_magang");
    expect(url.username).toBe("magang");
    expect(url.searchParams.get("schema")).toBe("iph_batu");
  });

  it("mendukung akses LAN dengan schema tetap terisolasi", () => {
    const url = new URL(getPostgresUrl({ PGHOST: "192.168.100.10", PGPORT: "5432", PGPASSWORD: "test-only", PGSCHEMA: "presensi" }));
    expect(url.hostname).toBe("192.168.100.10");
    expect(url.port).toBe("5432");
    expect(url.searchParams.get("schema")).toBe("iph_batu");
  });

  it("mengencode karakter khusus password tanpa mengubah nilainya", () => {
    const password = 'a@b:/?#% &"';
    const url = new URL(getPostgresUrl({ PGPASSWORD: password }));
    expect(decodeURIComponent(url.password)).toBe(password);
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.searchParams.get("schema")).toBe("iph_batu");
  });

  it("tidak memakai DATABASE_URL lama untuk mengakses schema lain", () => {
    const url = new URL(getPostgresUrl({ PGPASSWORD: "test-only", DATABASE_URL: "postgresql://unused@localhost/db_magang?schema=presensi" }));
    expect(url.searchParams.get("schema")).toBe("iph_batu");
    expect(url.username).toBe("magang");
  });

  it("menolak password kosong pada koneksi runtime", () => {
    expect(() => getPostgresUrl({})).toThrow("PGPASSWORD");
    expect(() => getPostgresUrl({}, true)).not.toThrow();
  });

  it.each(["0", "65536", "5432/x", "abc"])("menolak port tidak valid %s", (port) => {
    expect(() => getPostgresUrl({ PGPORT: port, PGPASSWORD: "test-only" })).toThrow("PGPORT");
  });

  it("menolak protokol dan opsi SSL yang tidak didukung", () => {
    expect(() => getPostgresUrl({ PGHOST: "postgresql://localhost", PGPASSWORD: "test-only" })).toThrow("PGHOST");
    expect(() => getPostgresUrl({ PGSSLMODE: "wrong", PGPASSWORD: "test-only" })).toThrow("PGSSLMODE");
  });

  it("migration awal hanya merujuk schema iph_batu", () => {
    const sql = readFileSync(path.resolve("prisma/migrations/20261011000000_init_iph_batu/migration.sql"), "utf8");
    expect(sql.match(/CREATE TABLE "iph_batu"\./g)).toHaveLength(11);
    expect(sql).not.toMatch(/(?:CREATE TABLE|ALTER TABLE|REFERENCES|ON) "(?!iph_batu"\.)/);
    expect(sql).not.toMatch(/presensi|DROP\s|TRUNCATE\s|ALTER ROLE|ALTER DATABASE|GRANT .*DATABASE/i);
    expect(sql.trim().startsWith("BEGIN;")).toBe(true);
    expect(sql.trim().endsWith("COMMIT;")).toBe(true);
  });
});
