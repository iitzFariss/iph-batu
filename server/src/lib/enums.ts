export const USER_ROLES = ["admin", "petugas", "tamu"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["pending", "aktif", "nonaktif"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const PEGAWAI_STATUSES = ["aktif", "nonaktif", "cuti"] as const;
export type PegawaiStatus = (typeof PEGAWAI_STATUSES)[number];

export const REKAP_STATUSES = ["draft", "submitted"] as const;
export type RekapStatus = (typeof REKAP_STATUSES)[number];

export const IPH_STATUSES = [
  "deflasi-signifikan",
  "deflasi-terkendali",
  "stabil-terkendali",
  "inflasi-ringan",
  "perlu-intervensi",
] as const;
export type IphStatus = (typeof IPH_STATUSES)[number];