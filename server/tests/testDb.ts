import path from "node:path";

// Prisma menyelesaikan URL relatif `file:` terhadap lokasi schema.prisma
// (server/prisma/), jadi file ini berakhir di server/prisma/test.db.
// Path dihitung dari process.cwd() karena vitest menjalankan test dari root server.
const SERVER_DIR = process.cwd();

export const TEST_DATABASE_URL = "file:./test.db";
export const PRISMA_DIR = path.join(SERVER_DIR, "prisma");
export const TEST_DB_PATH = path.join(PRISMA_DIR, "test.db");
export const DEV_DB_PATH = path.join(PRISMA_DIR, "dev.db");

// Jalankan CLI prisma lewat binary node, bukan `npx` yang tidak selalu ada di PATH.
export const PRISMA_CLI = path.join(SERVER_DIR, "node_modules", "prisma", "build", "index.js");