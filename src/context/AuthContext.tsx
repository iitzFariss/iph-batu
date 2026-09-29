import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, UserRole, AuthState } from "../types/auth";
import { api, ApiError, clearTokens, getTokens, setTokens } from "../lib/api";

// ─── Tipe data dari server ───────────────────────────────────────────────────

interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  nip: string | null;
  phone: string | null;
  bio: string | null;
  instansi: { id: string; nama: string } | null;
}

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

function toAppUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    instansi: u.instansi?.nama,
    nip: u.nip ?? undefined,
    phone: u.phone ?? undefined,
    bio: u.bio ?? undefined,
    status: u.status,
  };
}

// ─── Context definition ───────────────────────────────────────────────────────

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  instansi?: string;
  nip?: string;
}

interface AuthContextValue extends AuthState {
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginAsGuest: () => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((user: User) => {
    setState({ user, isAuthenticated: true });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { access, refresh } = getTokens();
        if (!access && !refresh) return;
        if (!access) {
          const ok = await refreshTokensDirect();
          if (!ok) return;
        }
        const data = await api.get<{ user: ApiUser }>("/auth/me");
        applyUser(toAppUser(data.user));
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshTokensDirect(): Promise<boolean> {
    const { refresh } = getTokens();
    if (!refresh) return false;
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async function login(email: string, password: string) {
    try {
      const data = await api.post<AuthResponse>("/auth/login", { email, password });
      setTokens(data.accessToken, data.refreshToken);
      applyUser(toAppUser(data.user));
      return { success: true, message: "Login berhasil." };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : "Login gagal." };
    }
  }

  async function register(data: RegisterData) {
    try {
      await api.post<{ message: string }>("/auth/register", data);
      return {
        success: true,
        message:
          "Pendaftaran berhasil. Akun petugas Anda akan diverifikasi dan diaktifkan oleh Administrator TPID melalui menu Kelola Pegawai sebelum dapat digunakan.",
      };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : "Pendaftaran gagal." };
    }
  }

  async function loginAsGuest() {
    try {
      const data = await api.post<AuthResponse>("/auth/guest");
      setTokens(data.accessToken, data.refreshToken);
      applyUser(toAppUser(data.user));
      return { success: true, message: "Berhasil masuk sebagai tamu." };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : "Gagal masuk sebagai tamu." };
    }
  }

  async function logout() {
    try {
      const { refresh } = getTokens();
      if (refresh) {
        await api.post("/auth/logout", { refreshToken: refresh }).catch(() => null);
      }
    } finally {
      clearTokens();
      setState({ user: null, isAuthenticated: false });
    }
  }

  async function refresh() {
    return refreshTokensDirect().then((ok) => {
      if (!ok) setState({ user: null, isAuthenticated: false });
      return ok;
    });
  }

  return (
    <AuthContext.Provider value={{ ...state, loading, login, loginAsGuest, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook shares context with provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}