import ExcelJS from "exceljs";
import { z } from "zod";
import { rekapCreateSchema } from "./schemas";

const HEADERS = ["Tahun", "Bulan", "Minggu", "IPH", "Komoditas", "Andil", "Jenis"];
export function styledWorkbook() {
  const book = new ExcelJS.Workbook();
  book.creator = "BPS Kota Batu";
  return book;
}
export function styleSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).height = 30;
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C4B3C" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    row.height = 28;
    row.eachCell(cell => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: "FFDCE3DE" } } };
      if (i % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F2" } };
    });
  });
  sheet.autoFilter = { from: "A1", to: { row: Math.max(1, sheet.rowCount), column: sheet.columnCount } };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}
export async function templateWorkbook() {
  const book = styledWorkbook();
  const data = book.addWorksheet("Data IPH");
  data.columns = HEADERS.map((header, i) => ({ header, width: i === 4 ? 36 : i === 6 ? 20 : 16 }));
  for (let row = 2; row <= 101; row++) {
    for (const column of [4, 6]) data.getCell(row, column).numFmt = "0.0000;-0.0000;0.0000";
    for (const [col, min, max] of [[1, 2000, 2100], [2, 1, 12], [3, 1, 5]]) data.getCell(row, col).dataValidation = { type: "whole", operator: "between", formulae: [min, max], allowBlank: true, showErrorMessage: true, error: `Isi angka ${min} sampai ${max}.` };
    data.getCell(row, 7).dataValidation = { type: "list", formulae: ['"andil,fluktuasi"'], allowBlank: true, showErrorMessage: true };
  }
  styleSheet(data);
  const guide = book.addWorksheet("Panduan");
  guide.columns = [{ header: "Kolom / aturan", width: 27 }, { header: "Petunjuk pengisian", width: 95 }];
  guide.addRows([
    ["Satu baris = satu komoditas", "Isi data pada sheet Data IPH. Biarkan nama sheet dan judul kolom tetap sama."],
    ["Tahun, Bulan, Minggu", "Tahun 2000–2100, bulan berupa angka 1–12, minggu 1–5. Ulangi ketiganya pada setiap baris."],
    ["IPH", "IPH gabungan yang sama untuk semua komoditas dalam satu periode. Isi sampai empat angka di belakang koma, contoh 2,1100."],
    ["Komoditas dan Andil", "Nama komoditas dan nilai andil (persen poin), contoh 0,8342. Negatif untuk deflasi, positif untuk inflasi."],
    ["Jenis", "Pilih andil atau fluktuasi. Per periode: 1–10 komoditas andil dan maksimal satu fluktuasi."],
    ["Banyak periode", "Satu file dapat berisi beberapa periode. Periode yang sudah tersimpan ditolak; impor tidak menimpa data."],
    ["Validasi", "Tidak menerima rumus, makro, duplikasi komoditas dalam jenis yang sama, atau lebih dari empat desimal."],
    ["Batas file", "Format .xlsx, maksimal 1 MB dan 1.000 baris data. Pratinjau diperiksa sebelum disimpan."],
  ]);
  styleSheet(guide);
  return book.xlsx.writeBuffer();
}

function validateZip(buffer: Buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > buffer.length) throw new Error("File bukan workbook XLSX yang valid.");
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16), total = 0;
  if (count > 1000) throw new Error("Workbook memiliki terlalu banyak bagian.");
  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Struktur XLSX tidak valid.");
    total += buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if (/vbaProject|externalLinks/i.test(name) || total > 20_000_000) throw new Error("Workbook terlalu besar setelah dibuka, atau berisi makro/tautan eksternal.");
    offset += 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}
export type ImportPeriod = z.infer<typeof rekapCreateSchema>;
export async function parseRekapWorkbook(buffer: Buffer): Promise<ImportPeriod[]> {
  if (!buffer.length || buffer.length > 1_000_000) throw new Error("File maksimal 1 MB.");
  validateZip(buffer);
  const book = new ExcelJS.Workbook();
  try { await book.xlsx.load(buffer as unknown as ExcelJS.Buffer); } catch { throw new Error("File Excel tidak dapat dibaca. Gunakan template .xlsx yang tersedia."); }
  const sheet = book.getWorksheet("Data IPH");
  if (!sheet || HEADERS.some((header, i) => sheet.getCell(1, i + 1).text.trim() !== header)) throw new Error("Sheet Data IPH atau judul kolom tidak sesuai template.");
  if (sheet.rowCount > 1001) throw new Error("Maksimal 1.000 baris data per file.");
  const periods = new Map<string, ImportPeriod>();
  const duplicates = new Set<string>();
  sheet.eachRow((row, index) => {
    if (index === 1 || HEADERS.every((_, i) => row.getCell(i + 1).value == null || row.getCell(i + 1).text.trim() === "")) return;
    const values = HEADERS.map((_, i) => {
      const value = row.getCell(i + 1).value;
      if (value != null && typeof value !== "number" && typeof value !== "string") throw new Error(`Baris ${index}: rumus dan objek sel tidak diterima.`);
      return value;
    });
    const [tahun, bulan, minggu, indikator, nama, nilai, jenis] = values;
    const result = rekapCreateSchema.safeParse({ tahun: Number(tahun), bulan: Number(bulan), mingguKe: Number(minggu), indikator, andil: [{ nama: typeof nama === "string" ? nama : "", nilai }] });
    if (!result.success) throw new Error(`Baris ${index}: ${result.error.issues[0].message}`);
    const kind = String(jenis ?? "").trim().toLowerCase();
    if (!["andil", "fluktuasi"].includes(kind)) throw new Error(`Baris ${index}: Jenis harus andil atau fluktuasi.`);
    const data = result.data, key = `${data.tahun}-${data.bulan}-${data.mingguKe}`;
    const duplicateKey = `${key}:${kind}:${data.andil[0].nama.toLocaleLowerCase("id")}`;
    if (duplicates.has(duplicateKey)) throw new Error(`Baris ${index}: komoditas yang sama terisi dua kali pada periode ini.`);
    duplicates.add(duplicateKey);
    const group = periods.get(key) ?? { ...data, andil: [], fluktuasi: null };
    if (group.indikator !== data.indikator) throw new Error(`Baris ${index}: IPH gabungan dalam periode yang sama harus identik.`);
    if (kind === "andil") group.andil.push(data.andil[0]);
    else { if (group.fluktuasi) throw new Error(`Baris ${index}: hanya satu komoditas fluktuasi per periode.`); group.fluktuasi = data.andil[0]; }
    periods.set(key, group);
  });
  if (!periods.size) throw new Error("Belum ada data pada sheet Data IPH.");
  for (const period of periods.values()) rekapCreateSchema.parse(period);
  return [...periods.values()];
}
