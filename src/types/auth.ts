export type UserRole = "admin" | "petugas" | "tamu";

export type UserStatus = "pending" | "aktif" | "nonaktif";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instansi?: string;
  nip?: string;
  phone?: string;
  bio?: string;
  status?: string;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  instansi: string | null;
  nip: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  isSelf: boolean;
  pegawaiId: string | null;
  pegawaiName: string | null;
  sessionCount: number;
}

export interface UsersResponse {
  rows: AdminUserRow[];
  ringkasan: { total: number; pending: number; aktif: number };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}