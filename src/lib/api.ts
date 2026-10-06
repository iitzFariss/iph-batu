// ─── API client untuk backend khusus TPID ────────────────────────────────────

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const ACCESS_KEY = "tpid_access_token";

// Hanya access token yang disimpan di sini. Refresh token hidup di cookie
// httpOnly yang tidak bisa dibaca JavaScript, jadi satu XSS tidak cukup untuk
// mencuri sesi yang bertahan 30 hari. Access token hanya 15 menit, jadi
// risikonya kecil selama tidak disimpan persisten bersama refresh token.
export function getAccessToken(): string {
  return localStorage.getItem(ACCESS_KEY) ?? "";
}

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
}

async function refreshTokens(): Promise<boolean> {
  try {
    // Refresh token dikirim lewat cookie, bukan body. credentials wajib
    // supaya browser ikut mengirimnya.
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}, sudahCobaRefresh = false): Promise<T> {
  const access = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Pastikan backend berjalan.");
  }

  // Refresh token hanya dicoba SEKALI. Jika setelah refresh masih 401, biarkan
  // error diteruskan — kalau tidak, sesi lama yang kedaluwarsa bisa memicu
  // perulangan refresh tanpa batas.
  if (res.status === 401 && !sudahCobaRefresh && !path.includes("/auth/login") && !path.includes("/auth/refresh")) {
    if (await refreshTokens()) {
      return request<T>(path, options, true);
    }
  }

  const data = (await res.json().catch(() => ({}))) as { message?: string } & T;

  if (!res.ok) {
    throw new ApiError(res.status, data.message ?? "Terjadi kesalahan pada server.");
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  download: (path: string) => unduh(path),
};

async function unduh(path: string, sudahCobaRefresh = false): Promise<Blob> {
  const access = getAccessToken();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: "GET",
      credentials: "include",
      headers: access ? { Authorization: `Bearer ${access}` } : {},
    });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Pastikan backend berjalan.");
  }

  if (res.status === 401 && !sudahCobaRefresh && !path.includes("/auth/login")) {
    if (await refreshTokens()) {
      return unduh(path, true);
    }
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(res.status, data.message ?? "Gagal mengunduh data.");
  }

  return res.blob();
}