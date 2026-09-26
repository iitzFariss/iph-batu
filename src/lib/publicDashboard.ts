// Hash link dashboard publik (sama dengan yang dilihat masyarakat / tamu)
export const PUBLIC_DASHBOARD_HASH = "#/publik";

// Bangun URL lengkap dashboard publik dari alamat aplikasi saat ini
export function buildPublicDashboardLink(): string {
  const url = new URL(window.location.href);
  url.hash = PUBLIC_DASHBOARD_HASH;
  return url.toString();
}