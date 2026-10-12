import prisma from "../src/lib/prisma";

async function main() {
  const [connection] = await prisma.$queryRaw<{ database: string; schema: string }[]>`
    SELECT current_database() AS database, current_schema() AS schema
  `;
  if (connection.schema !== "iph_batu") throw new Error("Schema aktif bukan iph_batu. Terapkan migration terlebih dahulu.");
  await prisma.user.count();
  console.log(`Koneksi berhasil: database=${connection.database}, schema=${connection.schema}. Tabel User tersedia.`);
}

main().catch(() => {
  console.error("Koneksi/tabel belum siap. Periksa tunnel, konfigurasi PG*, izin schema iph_batu, dan npm run db:migrate.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
