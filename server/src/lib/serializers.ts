import type { Instansi, User } from "@prisma/client";

type UserWithInstansi = User & { instansi?: Instansi | null };

export function toUserDTO(user: UserWithInstansi) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    nip: user.nip ?? null,
    phone: user.phone ?? null,
    bio: user.bio ?? null,
    instansi: user.instansi ? { id: user.instansi.id, nama: user.instansi.nama } : null,
    createdAt: user.createdAt,
  };
}

const PALETTE = [
  "bg-gray-700",
  "bg-emerald-600",
  "bg-blue-600",
  "bg-teal-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-cyan-600",
];

export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}