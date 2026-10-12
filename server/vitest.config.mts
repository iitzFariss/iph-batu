import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/testDb.ts";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [{ find: /^@prisma\/client$/, replacement: path.resolve("node_modules/.prisma/iph-test-client/index.js") }],
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/globalSetup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      CLIENT_ORIGIN: "http://localhost:5173",
      NODE_ENV: "test",
    },
    // Limiter menyimpan state rate limit di memori per proses. File dipisah dan
    // paralelisme dimatikan supaya test rate limit tidak mengotori test lain.
    pool: "forks",
    isolate: true,
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
