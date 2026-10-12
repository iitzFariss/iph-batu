import { defineConfig } from "prisma/config";
import path from "node:path";

process.env.DATABASE_URL = "file:./test.db";
export default defineConfig({
  schema: "prisma/schema.test.prisma",
  engine: "classic",
  datasource: { url: `file:${path.resolve("prisma/test.db").replaceAll("\\", "/")}` },
});
