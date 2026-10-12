import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { getPostgresUrl } from "../src/lib/database";

try {
  const command = process.argv[2];
  if (command !== "deploy" && command !== "status") throw new Error("Perintah database tidak dikenal.");
  const url = getPostgresUrl();
  const result = spawnSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "migrate", command], {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
  if (result.error) throw new Error("Prisma CLI tidak dapat dijalankan. Jalankan npm install di server.");
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Konfigurasi database tidak valid.");
  process.exitCode = 1;
}
