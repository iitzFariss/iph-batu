import prisma from "./prisma";
import { computeStatusIPH } from "./rekap";
import { BULAN_SINGKAT } from "./dates";

export async function buildRekapSummary() {
  const records = await prisma.rekap.findMany({
    orderBy: [{ tahun: "asc" }, { bulan: "asc" }, { mingguIndeks: "asc" }],
    include: { details: { include: { komoditas: true } } },
  });

  const trend = records.map((r) => {
    const top = [...r.details].sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai))[0];
    return {
      tahun: r.tahun,
      bulan: r.bulan,
      mingguIndeks: r.mingguIndeks,
      iph: r.indikator,
      status: computeStatusIPH(r.indikator),
      pemicu: top ? top.komoditas.nama : null,
    };
  });

  const maxWeek = new Map<string, number>();
  for (const t of trend) {
    const k = `${t.tahun}-${t.bulan}`;
    maxWeek.set(k, Math.max(maxWeek.get(k) ?? 0, t.mingguIndeks));
  }
  const trendWith = trend.map((t) => ({
    ...t,
    penutupan: t.mingguIndeks === maxWeek.get(`${t.tahun}-${t.bulan}`),
  }));

  const weekly = new Map<number, Record<string, number | null>>();
  for (const r of records) {
    const key = `${BULAN_SINGKAT[r.bulan - 1].toLowerCase()}-m${r.mingguIndeks}`;
    const row = weekly.get(r.tahun) ?? {};
    row[key] = r.indikator;
    weekly.set(r.tahun, row);
  }

  const freqByYear = new Map<number, Map<string, number>>();
  for (const r of records) {
    const names = [...new Set(r.details.map((d) => d.komoditas.nama))];
    for (const name of names) {
      const m = freqByYear.get(r.tahun) ?? new Map<string, number>();
      m.set(name, (m.get(name) ?? 0) + 1);
      freqByYear.set(r.tahun, m);
    }
  }

  const latest = trendWith.length ? trendWith[trendWith.length - 1] : null;
  const latestRecord = records.length ? records[records.length - 1] : null;

  return {
    trend: trendWith,
    weekly: [...weekly.entries()]
      .map(([tahun, data]) => ({ tahun, data }))
      .sort((a, b) => a.tahun - b.tahun),
    frequency: [...freqByYear.entries()]
      .map(([tahun, m]) => ({
        tahun,
        items: [...m.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.tahun - b.tahun),
    latest,
    latestDetails: latestRecord
      ? [...latestRecord.details]
          .map((d) => ({
            name: d.komoditas.nama,
            nilai: d.nilai,
            isFluktuasi: d.isFluktuasi,
          }))
          .sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai))
      : [],
  };
}

export type RekapSummary = Awaited<ReturnType<typeof buildRekapSummary>>;