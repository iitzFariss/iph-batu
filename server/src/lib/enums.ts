export const PEGAWAI_STATUSES = ["aktif", "nonaktif", "cuti"] as const;
export type PegawaiStatus = (typeof PEGAWAI_STATUSES)[number];

export const RAPAT_STATUSES = ["terjadwal", "selesai", "dibatalkan"] as const;
export type RapatStatus = (typeof RAPAT_STATUSES)[number];

export const IPH_STATUSES = [
  "deflasi-signifikan",
  "deflasi-terkendali",
  "stabil-terkendali",
  "inflasi-ringan",
  "perlu-intervensi",
] as const;
export type IphStatus = (typeof IPH_STATUSES)[number];