export const DATABASE_SCHEMA = "iph_batu";

type Environment = Record<string, string | undefined>;

export function getPostgresUrl(env: Environment = process.env, allowEmptyPassword = false): string {
  const host = env.PGHOST?.trim() || "127.0.0.1";
  const port = env.PGPORT?.trim() || "15433";
  const database = env.PGDATABASE?.trim() || "db_magang";
  const user = env.PGUSER?.trim() || "magang";
  const password = env.PGPASSWORD ?? "";
  const sslmode = env.PGSSLMODE?.trim() || "prefer";

  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("PGPORT harus berupa port 1–65535.");
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(host) && !/^\[[a-fA-F0-9:]+\]$/.test(host)) {
    throw new Error("PGHOST harus berupa hostname atau alamat IP tanpa protokol.");
  }
  if (!["prefer", "require", "disable"].includes(sslmode)) {
    throw new Error("PGSSLMODE harus prefer, require, atau disable.");
  }
  if (!password && !allowEmptyPassword) {
    throw new Error("Isi PGPASSWORD di server/.env lokal. Koneksi memakai PGHOST, PGPORT, PGDATABASE, dan PGUSER; DATABASE_URL lama tidak dipakai.");
  }

  const url = new URL(`postgresql://${host}:${port}`);
  url.username = encodeURIComponent(user);
  url.password = encodeURIComponent(password);
  url.pathname = `/${encodeURIComponent(database)}`;
  url.searchParams.set("schema", DATABASE_SCHEMA);
  url.searchParams.set("sslmode", sslmode);
  url.searchParams.set("connect_timeout", "10");
  url.searchParams.set("connection_limit", "5");
  return url.toString();
}

export function getRuntimeDatabaseUrl(): string {
  // The test runner aliases Prisma to a separate SQLite client and overrides this URL.
  if (process.env.NODE_ENV === "test" && process.env.DATABASE_URL === "file:./test.db") {
    return process.env.DATABASE_URL;
  }
  return getPostgresUrl();
}
