import { createContext, useContext, useState, type ReactNode } from "react";
import type { User, UserRole, AuthState } from "../types/auth";

// ─── Mock user accounts ───────────────────────────────────────────────────────

interface MockAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  instansi?: string;
  nip?: string;
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: "1",
    email: "admin@tpid-batu.go.id",
    password: "admin123",
    name: "Administrator TPID",
    role: "admin",
    instansi: "TPID Kota Batu",
    nip: "196501011990031001",
  },
  {
    id: "2",
    email: "siti.rahmawati@bps-batu.go.id",
    password: "petugas123",
    name: "Siti Rahmawati, S.E.",
    role: "petugas",
    instansi: "BPS Kota Batu",
    nip: "198203142006042001",
  },
  {
    id: "3",
    email: "bambang@diskoperindag-batu.go.id",
    password: "petugas123",
    name: "Bambang Wijaya",
    role: "petugas",
    instansi: "Diskumperindag Kota Batu",
    nip: "197708212003121002",
  },
  {
    id: "4",
    email: "masyarakat@gmail.com",
    password: "masyarakat123",
    name: "Budi Santoso",
    role: "masyarakat",
  },
];

// ─── Context definition ───────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  instansi?: string;
  nip?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  async function login(email: string, password: string) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    const account = MOCK_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (!account) {
      return { success: false, message: "Email atau kata sandi tidak valid." };
    }

    const user: User = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      instansi: account.instansi,
      nip: account.nip,
    };

    setState({ user, isAuthenticated: true });
    return { success: true, message: "Login berhasil." };
  }

  async function register(data: RegisterData) {
    await new Promise((r) => setTimeout(r, 900));

    const exists = MOCK_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === data.email.toLowerCase()
    );
    if (exists) {
      return { success: false, message: "Email sudah terdaftar." };
    }

    // For demo: auto-login after register as masyarakat only
    if (data.role !== "masyarakat") {
      return {
        success: true,
        message:
          "Pendaftaran berhasil. Akun petugas/admin memerlukan verifikasi oleh Administrator TPID sebelum dapat digunakan.",
      };
    }

    const user: User = {
      id: String(Date.now()),
      name: data.name,
      email: data.email,
      role: "masyarakat",
    };
    setState({ user, isAuthenticated: true });
    return { success: true, message: "Pendaftaran berhasil." };
  }

  function logout() {
    setState({ user: null, isAuthenticated: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
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