import { execFileSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import {
  DEV_DB_PATH,
  PRISMA_CLI,
  TEST_DATABASE_URL,
  TEST_DB_PATH,
} from "./testDb";

type DbStamp = { size: number; mtimeMs: number } | null;

function sidikJari(file: string): DbStamp {
  if (!existsSync(file)) return null;
  const s = statSync(file);
  return { size: s.size, mtimeMs: s.mtimeMs };
}

function bersihkanTestDb() {
  for (const file of [TEST_DB_PATH, `${TEST_DB_PATH}-journal`, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`]) {
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

/** Sidik jari dev.db untuk membuktikan test tidak pernah menyentuhnya. */
let devDbAwal: DbStamp = null;

export async function setup() {
  // Override, bukan baca: URL dari .env development sengaja diabaikan supaya
  // test tidak mungkin menulis ke dev.db.
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  if (!process.env.DATABASE_URL.endsWith("test.db")) {
    throw new Error(`DATABASE_URL test tidak valid: ${process.env.DATABASE_URL}`);
  }
  if (!existsSync(PRISMA_CLI)) {
    throw new Error(`CLI prisma tidak ditemukan di ${PRISMA_CLI}. Jalankan npm install di server/.`);
  }

  devDbAwal = sidikJari(DEV_DB_PATH);
  bersihkanTestDb();

  // Terapkan schema ke database test. Sengaja TIDAK memanggil prisma/seed.ts:
  // seed menjalankan deleteMany di semua tabel lalu mengisi 178 rekap.
  execFileSync(
    process.execPath,
    [PRISMA_CLI, "db", "push", "--skip-generate", "--accept-data-loss"],
    { env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }, stdio: "pipe" }
  );
}

export async function teardown() {
  bersihkanTestDb();

  const devDbAkhir = sidikJari(DEV_DB_PATH);
  const berubah =
    (devDbAwal === null) !== (devDbAkhir === null) ||
    !!(devDbAwal &&
      devDbAkhir &&
      (devDbAwal.size !== devDbAkhir.size || devDbAwal.mtimeMs !== devDbAkhir.mtimeMs));

  if (berubah) {
    throw new Error(`dev.db berubah selama test (${DEV_DB_PATH}). Test tidak boleh menyentuh DB development.`);
  }
}