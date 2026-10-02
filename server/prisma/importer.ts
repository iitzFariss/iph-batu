import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BULAN_MAP: Record<string, number> = {
  Januari: 1,
  Februari: 2,
  Maret: 3,
  April: 4,
  Mei: 5,
  Juni: 6,
  Juli: 7,
  Agustus: 8,
  September: 9,
  Oktober: 10,
  November: 11,
  Desember: 12,
};

const VARIAN_BULAN: Record<string, string> = {
  may: "Mei",
  june: "Juni",
  nopember: "November",
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = []; 
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseBulan(raw: string): number | null {
  const t = raw.trim();
  const base = BULAN_MAP[t] ?? BULAN_MAP[VARIAN_BULAN[t.toLowerCase()]];
  return base ?? null;
}

function parseIntOrNull(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseFloatOrNull(raw: string): number | null {
  const t = (raw ?? "").trim().replace(/^"(.*)"$/, "$1").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toTitleCase(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface AndilItem {
  nama: string;
  nilai: number;
}

function parseAndil(cell: string): AndilItem[] {
  const parts = cell.split(/;\s*|\s*,\s+/).filter((p) => p.trim() !== "");
  const items: AndilItem[] = [];
  for (const part of parts) {
    const m = /^([^(]+)\(([-0-9.,]+)\)$/.exec(part.trim());
    if (!m) continue;
    const nilai = parseFloatOrNull(m[2]);
    const nama = m[1].replace(/\s+/g, " ").trim().toUpperCase();
    if (nilai === null || !nama || Math.abs(nilai) > MAX_WAJAR) continue;
    items.push({ nama, nilai });
  }
  return items;
}

interface RekapInput {
  tahun: number;
  bulan: number;
  mingguIndeks: number;
  indikator: number;
  andil: AndilItem[];
  fluktuasi?: AndilItem;
}

const MAX_WAJAR = 100;

// Kolom fluktuasi di CSV kadang berisi label kondisi, bukan nama komoditas
// (mis. "STABIL,0" pada 2023 Mei/Sept/Okt/Nov/Des M1).
const BUKAN_KOMODITAS = new Set(["STABIL", "TETAP", "N/A", "NA", "-", "--"]);

function parseFluktuasi(name: string | undefined, value: string | undefined): AndilItem | undefined {
  const nama = (name ?? "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!nama || BUKAN_KOMODITAS.has(nama)) return undefined;
  const nilai = parseFloatOrNull(value);
  if (nilai === null || Math.abs(nilai) > MAX_WAJAR) return undefined;
  return { nama, nilai };
}

function main() {
  const file = path.resolve(__dirname, "../data/Rekap IPH Kota Batu.xlsx - Data IPH Kota Batu.csv");
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCSV(text);
  if (rows.length === 0) throw new Error("CSV kosong");

  const inputs: RekapInput[] = [];
  const skipped: string[] = [];
  for (const r of rows) {
    const tahun = parseIntOrNull(r[0]?.trim());
    const bulan = parseBulan(r[1]);
    const minggu = /^M([1-5])$/i.exec(r[2]?.trim());
    const indikator = parseFloatOrNull(r[4]);
    if (tahun === null || tahun < 1000) {
      skipped.push(r.join(","));
      continue;
    }
    if (bulan === null || !minggu || indikator === null) {
      skipped.push(r.join(","));
      continue;
    }
    inputs.push({
      tahun,
      bulan,
      mingguIndeks: Number(minggu[1]),
      indikator,
      andil: parseAndil(r[5] ?? ""),
      fluktuasi: parseFluktuasi(r[6], r[7]),
    });
  }

  void (async () => {
    const admin = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!admin) throw new Error("Tidak ada user admin untuk createdBy.");

    let created = 0;
    let updated = 0;
    let fluktuasiCount = 0;

    for (const inp of inputs) {
      const existing = await prisma.rekap.findUnique({
        where: { tahun_bulan_mingguIndeks: { tahun: inp.tahun, bulan: inp.bulan, mingguIndeks: inp.mingguIndeks } },
      });
      if (existing) updated++;
      else created++;

      const rekap = await prisma.rekap.upsert({
        where: { tahun_bulan_mingguIndeks: { tahun: inp.tahun, bulan: inp.bulan, mingguIndeks: inp.mingguIndeks } },
        update: { indikator: inp.indikator, status: "submitted" },
        create: {
          tahun: inp.tahun,
          bulan: inp.bulan,
          mingguIndeks: inp.mingguIndeks,
          indikator: inp.indikator,
          status: "submitted",
          createdById: admin.id,
        },
      });

      await prisma.rekapDetail.deleteMany({ where: { rekapId: rekap.id } });

      const detailRows: {
        nama: string;
        nilai: number;
        isFluktuasi: boolean;
      }[] = [...inp.andil.map((a) => ({ ...a, isFluktuasi: false }))];
      if (inp.fluktuasi) {
        detailRows.push({ ...inp.fluktuasi, isFluktuasi: true });
        fluktuasiCount++;
      }

      for (const d of detailRows) {
        const nama = d.nama;
        const komoditas = await prisma.komoditas.upsert({
          where: { namaNorm: nama.toLowerCase() },
          update: {},
          create: { nama: toTitleCase(nama), namaNorm: nama.toLowerCase() },
        });
        await prisma.rekapDetail.create({
          data: {
            rekapId: rekap.id,
            komoditasId: komoditas.id,
            nilai: d.nilai,
            isFluktuasi: d.isFluktuasi,
          },
        });
      }
    }

    console.log(`Selesai. Baris CSV: ${rows.length - 1}`);
    console.log(`Rekap dibuat: ${created}, ditimpa: ${updated}, di-skip: ${skipped.length}`);
    console.log(`Detail fluktuasi: ${fluktuasiCount}`);
    console.log(`Total rekap di DB: ${await prisma.rekap.count()}`);
  })()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

main();