import prisma from "./prisma";
import { log } from "./logger";

export async function checkDatabase(): Promise<{ up: boolean; latencyMs: number }> {
  const mulai = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { up: true, latencyMs: Date.now() - mulai };
  } catch (err) {
    log.error("health.db.gagal", { message: (err as Error).message });
    return { up: false, latencyMs: Date.now() - mulai };
  }
}