import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getRuntimeDatabaseUrl } from "./database";

const prisma = new PrismaClient({ datasources: { db: { url: getRuntimeDatabaseUrl() } } });
export default prisma;
