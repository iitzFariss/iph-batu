import "dotenv/config";
import { createApp } from "./app";
import { log } from "./lib/logger";
import prisma from "./lib/prisma";
import { bersihkanSesiLama } from "./lib/session";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

const server = app.listen(port, () => {
  log.info("server.start", { port, clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" });
});

// Rumah tangga: buang sesi kedaluwarsa/cabut lama sekali sehari. unref() agar
// interval tidak menahan proses tetap hidup saat server lain sudah ditutup.
const bersihBerkala = async () => {
  try {
    await bersihkanSesiLama();
  } catch (err) {
    log.warn("session.bersihGagal", { message: (err as Error)?.message ?? String(err) });
  }
};
bersihBerkala();
setInterval(bersihBerkala, 24 * 60 * 60 * 1000).unref();

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    log.error("server.port.terpakai", { port });
    process.exit(1);
  }
  log.error("server.error", { message: err.message });
  process.exit(1);
});

let shuttingDown = false;

async function shutdown(sinyal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info("server.shutdown.mulai", { sinyal });

  const batas = setTimeout(() => {
    log.warn("server.shutdown.paksa");
    process.exit(1);
  }, 10_000);
  batas.unref();

  server.close(async () => {
    await prisma.$disconnect();
    clearTimeout(batas);
    log.info("server.shutdown.selesai");
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  log.error("process.unhandledRejection", { reason: String(reason) });
});