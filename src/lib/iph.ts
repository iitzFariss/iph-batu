export const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const iphDirection = (value: number) => value > 0 ? "Inflasi" : value < 0 ? "Deflasi" : "Tidak berubah";
export const decimal4 = (value: number) => value.toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
export interface FrequencyPeriod { tahun: number; bulan: number; names: string[] }
export function commodityFrequency(periods: FrequencyPeriod[], year: string, month: string) {
  const counts = new Map<string, number>();
  for (const period of periods.filter(p => (!year || p.tahun === Number(year)) && (!month || p.bulan === Number(month)))) {
    for (const name of new Set(period.names)) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "id"));
}
