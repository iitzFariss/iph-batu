/**
 * Validasi environment di satu tempat.
 *
 * Nilai yang hilang saat development sengaja punya fallback supaya repo bisa
 * dijalankan tanpa .env. Di produksi fallback itu berbahaya: JWT secret
 * "dev-access-secret" ada di repositori publik, jadi siapa pun bisa memalsukan
 * token admin tanpa knowing password siapa pun. Karena itu produksi tidak
 * boleh start dengan fallback.
 */

const IS_PROD = process.env.NODE_ENV === "production";

const SECRET_PLACEHOLDERS = new Set(["change-me", "dev-access-secret", "dev-refresh-secret"]);

function wajib(nama: string, fallback: string): string {
  const nilai = process.env[nama]?.trim();
  if (!nilai) {
    if (IS_PROD) {
      throw new Error(
        `${nama} wajib diisi saat NODE_ENV=production. ` +
          `Salin server/.env.example ke server/.env lalu isi dengan nilai acak.`
      );
    }
    return fallback;
  }
  if (IS_PROD && SECRET_PLACEHOLDERS.has(nilai)) {
    throw new Error(
      `${nama} masih memakai nilai contoh "${nilai}". ` +
        `Ganti dengan string acak, misalnya: openssl rand -hex 32`
    );
  }
  return nilai;
}

/**
 * Origin browser yang diizinkan. Wajib eksplisit di produksi karena CORS yang
 * salah diam-diam tidak mengirim cookie, dan gejalanya jauh dari jelas.
 */
export const CLIENT_ORIGIN = (() => {
  const nilai = process.env.CLIENT_ORIGIN?.trim();
  if (nilai) return nilai;
  if (IS_PROD) {
    throw new Error(
      "CLIENT_ORIGIN wajib diisi saat NODE_ENV=production, " +
        'contoh: CLIENT_ORIGIN="https://tpid.batu kab.go.id"'
    );
  }
  return "http://localhost:5173";
})();

export const JWT_ACCESS_SECRET = wajib("JWT_ACCESS_SECRET", "dev-access-secret");
export const JWT_REFRESH_SECRET = wajib("JWT_REFRESH_SECRET", "dev-refresh-secret");

/** True kalau token disimpan di cookie httpOnly, bukan di localStorage. */
export const COOKIE_AUTH = IS_PROD;