export type UserRole = "admin" | "petugas" | "masyarakat";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  instansi?: string;
  nip?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}