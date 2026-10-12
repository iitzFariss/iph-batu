import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getPostgresUrl } from "./src/lib/database";

const url = getPostgresUrl(process.env, true);
process.env.DATABASE_URL = url;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  engine: "classic",
  // Generating/validating a client does not need database credentials.
  datasource: { url },
});
