export const PUBLIC_DASHBOARD_HASH = "#/publik";

// Tautan siaran memakai domain publik agar dapat dibuka dari ponsel.
export function buildPublicDashboardLink(period?: { tahun: number; bulan: number; minggu: number }): string {
  const url = new URL("https://iph.bpskotabatu.com/");
  url.hash = PUBLIC_DASHBOARD_HASH + (period ? `?tahun=${period.tahun}&bulan=${period.bulan}&minggu=${period.minggu}` : "");
  return url.toString();
}

export function isPublicDashboard(): boolean {
  return window.location.hash.split("?")[0] === PUBLIC_DASHBOARD_HASH;
}
