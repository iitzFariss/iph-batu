import "dotenv/config";
import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { planLegacy, sameRow, type Row, type Table } from "./lib/legacy-plan";

const order = ["Instansi", "Komoditas", "User", "Pegawai", "Rekap", "RekapDetail", "Rapat", "PetugasRapat", "Notulensi", "Session", "AuditLog", "WhatsAppNotification"];
const models = Prisma.dmmf.datamodel.models;
if (models.length !== order.length || models.some(model => !order.includes(model.name))) {
  throw new Error("Daftar tabel migrator harus diperbarui agar mencakup semua model project.");
}
const tables: Table[] = order.map(name => {
  const model = models.find(model => model.name === name)!;
  const references: Record<string, string> = {};
  for (const field of model.fields) {
    for (const foreignKey of field.relationFromFields ?? []) references[foreignKey] = field.type;
  }
  // These fields intentionally have no database FK, but still refer to users.
  if (name === "Rapat") references.createdById = "User";
  if (name === "AuditLog") references.actorId = "User";
  return { name, references, unique: [...model.uniqueFields.map(keys => [...keys]), ...model.fields.filter(field => field.isUnique).map(field => [field.name])] };
});

function readSource(db: DatabaseSync): Record<string, Row[]> {
  const actual = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => String(row.name));
  if (actual.some(name => !order.includes(name) && name !== "_prisma_migrations")) throw new Error("Ada tabel sumber di luar model project; periksa sebelum melanjutkan.");
  const foreignKeys = db.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeys.length) throw new Error("Database lama memiliki relasi tidak valid; migrasi dihentikan.");
  const source: Record<string, Row[]> = {};
  for (const name of order) {
    if (name === "WhatsAppNotification" && !actual.includes(name)) { source[name] = []; continue; }
    const model = models.find(model => model.name === name)!;
    source[name] = db.prepare(`SELECT * FROM "${name}" ORDER BY "id"`).all().map(raw => {
      const row: Record<string, unknown> = {};
      const fields = model.fields.filter(field => field.kind !== "object");
      if (Object.keys(raw).some(key => !fields.some(field => field.name === key))) throw new Error(`Kolom sumber ${name} tidak dikenali.`);
      for (const field of fields) {
        let value: unknown = raw[field.name];
        // Explicit additive changes introduced after the original SQLite database.
        if (value === undefined && name === "Pegawai" && field.name === "phone") value = null;
        if (value === undefined && name === "Rapat" && field.name === "notificationRevision") value = 1;
        if (value === undefined) throw new Error(`Kolom ${name}.${field.name} tidak tersedia di database lama.`);
        if (value != null && field.type === "DateTime") {
          value = new Date(value as string | number);
          if (!Number.isFinite((value as Date).getTime())) throw new Error(`Tanggal ${name}.${field.name} tidak valid.`);
        }
        if (value != null && field.type === "Boolean") {
          if (value !== 0 && value !== 1) throw new Error(`Boolean ${name}.${field.name} tidak valid.`);
          value = value === 1;
        }
        row[field.name] = value;
      }
      return row as Row;
    });
  }
  return source;
}

// Delegates share these operations; table names come exclusively from the fixed allowlist.
type Delegate = { findMany(): Promise<Row[]>; createMany(args: { data: Row[] }): Promise<{ count: number }> };
function delegate(tx: Prisma.TransactionClient, name: string): Delegate {
  return (tx as unknown as Record<string, Delegate>)[name[0].toLowerCase() + name.slice(1)];
}

async function main() {
  const apply = process.argv.includes("--apply");
  if (apply && process.argv.includes("--source-only")) throw new Error("Pilih salah satu: --source-only atau --apply.");
  if (process.argv.slice(2).some(arg => !["--apply", "--source-only"].includes(arg))) throw new Error("Gunakan --source-only untuk inspeksi, tanpa opsi untuk preview, atau --apply untuk pemindahan.");
  const db = new DatabaseSync(path.resolve("prisma/dev.db"), { readOnly: true });
  try {
    // Backup API includes committed WAL data and creates a consistent SQLite snapshot.
    // Read the snapshot for apply so the report and imported records describe the same data.
    let source: Record<string, Row[]>;
    let backupPath: string | undefined;
    if (apply) {
      mkdirSync("backups", { recursive: true });
      backupPath = path.resolve("backups", `legacy-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.db`);
      await backup(db, backupPath);
      const snapshot = new DatabaseSync(backupPath, { readOnly: true });
      try { source = readSource(snapshot); } finally { snapshot.close(); }
      console.log(`Backup SQLite: ${backupPath}`);
    } else {
      db.exec("BEGIN");
      try { source = readSource(db); } finally { db.exec("ROLLBACK"); }
    }
    console.table(order.map(name => ({ tabel: name, sumber: source[name].length })));
    if (process.argv.includes("--source-only")) return;

    const summary = await prisma.$transaction(async tx => {
      const [connection] = await tx.$queryRaw<{ database: string; schema: string }[]>`SELECT current_database() AS database, current_schema() AS schema`;
      if (connection.database !== "db_magang" || connection.schema !== "iph_batu") throw new Error("Target wajib db_magang dengan schema iph_batu.");
      // Prevent concurrent writes while checking conflicts, inserting and verifying.
      if (apply) await tx.$executeRawUnsafe(`LOCK TABLE ${order.map(name => `"iph_batu"."${name}"`).join(", ")} IN SHARE ROW EXCLUSIVE MODE`);
      const target: Record<string, Row[]> = {};
      for (const name of order) target[name] = await delegate(tx, name).findMany();
      const plan = planLegacy(tables, source, target);
      if (apply) {
        for (const table of plan) {
          for (let offset = 0; offset < table.insert.length; offset += 250) {
            await delegate(tx, table.name).createMany({ data: table.insert.slice(offset, offset + 250) });
          }
        }
        for (const table of plan) {
          const actual = await delegate(tx, table.name).findMany();
          const byId = new Map(actual.map(row => [row.id, row]));
          if (actual.length !== table.before + table.insert.length || table.expected.some(row => !byId.has(row.id) || !sameRow(row, byId.get(row.id)!))) {
            throw new Error(`Verifikasi ${table.name} gagal; seluruh transaksi dibatalkan.`);
          }
        }
      }
      return plan.map(table => ({ tabel: table.name, sumber: table.source, targetSebelum: table.before, ditambahkan: table.insert.length, sudahAda: table.source - table.insert.length, akunTargetDipertahankan: table.preservedAccounts, targetSesudah: table.before + (apply ? table.insert.length : 0) }));
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 180_000 });
    console.table(summary);
    if (apply) {
      writeFileSync(`${backupPath}.report.json`, JSON.stringify({ completedAt: new Date().toISOString(), database: "db_magang", schema: "iph_batu", summary }, null, 2));
      console.log("Migrasi selesai dan semua record sumber sudah diverifikasi. Akun dengan email yang sama mempertahankan seluruh nilai target, termasuk password; ID relasi disesuaikan. Schema lain tidak diakses.");
    } else console.log("Preview selesai. Belum ada data ditulis. Jalankan dengan --apply untuk memindahkan.");
  } finally { db.close(); }
}

main().catch(error => {
  // Prisma error messages can contain query data; never log raw database errors.
  const known = error instanceof Prisma.PrismaClientKnownRequestError;
  console.error(known ? `Migrasi gagal (${error.code}). Tidak ada perubahan transaksi yang disimpan.`
    : error instanceof Prisma.PrismaClientInitializationError ? "Koneksi PostgreSQL gagal. Periksa tunnel dan PG* lokal."
    : error instanceof Error && !error.constructor.name.startsWith("Prisma") ? error.message
    : "Migrasi gagal; transaksi tidak disimpan. Periksa konfigurasi dan struktur database.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
