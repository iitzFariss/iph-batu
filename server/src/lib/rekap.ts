import type { Komoditas, RekapDetail } from "@prisma/client";
import { BULAN, BULAN_SINGKAT, ROMAWI } from "./dates";
import { IphStatus } from "./enums";

export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export function computeStatusIPH(indikator: number): IphStatus {
  if (indikator < -1) return "deflasi-signifikan";
  if (indikator < 0) return "deflasi-terkendali";
  if (indikator === 0) return "stabil-terkendali";
  if (indikator < 1) return "inflasi-ringan";
  return "perlu-intervensi";
}

export interface CommodityTag {
  name: string;
  change: number;
}

export interface RekapGroups {
  deflasi: CommodityTag[];
  inflasi: CommodityTag[];
}

export function computeCommodityGroups(
  details: (RekapDetail & { komoditas: Komoditas })[]
): RekapGroups {
  const items = details.filter((d) => !d.isFluktuasi).map((d) => ({ name: d.komoditas.nama, nilai: d.nilai }));
  const fluktuasi = details.find((d) => d.isFluktuasi);

  const deflasi = items
    .filter((d) => d.nilai < 0)
    .sort((a, b) => a.nilai - b.nilai)
    .slice(0, 3)
    .map((d) => ({ name: d.name, change: round(d.nilai) }));
  const inflasi = items
    .filter((d) => d.nilai > 0)
    .sort((a, b) => b.nilai - a.nilai)
    .slice(0, 3)
    .map((d) => ({ name: d.name, change: round(d.nilai) }));

  if (fluktuasi) {
    const tag = { name: fluktuasi.komoditas.nama, change: round(fluktuasi.nilai) };
    if (fluktuasi.nilai < 0) deflasi.push(tag);
    else if (fluktuasi.nilai > 0) inflasi.push(tag);
  }
  return { deflasi, inflasi };
}

export interface Periodic {
  tahun: number;
  bulan: number;
  mingguIndeks: number;
}

export function periodeLabel(p: Periodic): string {
  return `Minggu ${ROMAWI[p.mingguIndeks - 1] ?? p.mingguIndeks} – ${BULAN[p.bulan - 1] ?? ""} ${p.tahun}`;
}

export function computeCutoff(p: Periodic): { cutoffStart: string; cutoffEnd: string } {
  const dayMulai = (p.mingguIndeks - 1) * 7 + 1;
  const daysInMonth = new Date(p.tahun, p.bulan, 0).getDate();
  const start = Math.min(dayMulai, daysInMonth);
  const end = Math.min(dayMulai + 6, daysInMonth);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    cutoffStart: `${pad(start)} ${BULAN_SINGKAT[p.bulan - 1]}`,
    cutoffEnd: `${pad(end)} ${BULAN_SINGKAT[p.bulan - 1]} ${p.tahun}`,
  };
}

const ROMAWI_TO_INDEX: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 };

export function parsePeriode(input: string): Periodic | null {
  const m = /Minggu\s+([IVX]+)\s*[–-]?\s*(\w+)\s+(\d{4})/i.exec(input.trim());
  if (!m) return null;
  const mingguIndeks = ROMAWI_TO_INDEX[m[1].toUpperCase()];
  const bulan = BULAN.findIndex((b) => b.toLowerCase().startsWith(m[2].toLowerCase())) + 1;
  if (!mingguIndeks || !bulan) return null;
  return { mingguIndeks, bulan, tahun: Number(m[3]) };
}

