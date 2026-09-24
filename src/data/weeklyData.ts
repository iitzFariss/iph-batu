// ─── Tipe data tabel mingguan ────────────────────────────────────────────────
// Data sengaja dipisah dari komponen UI supaya mudah diganti sumber API/PostgreSQL.

export interface WeeklyColumn {
  id: string;
  label: string;
}

export interface WeeklyRow {
  tahun: number;
  data: Record<string, number | null>;
}

// Kolom mingguan (label sesuai referensi: urutan pekan per bulan)
export const weeklyColumns: WeeklyColumn[] = [
  { id: "m2",         label: "M2"       },
  { id: "feb-m3",     label: "Feb M3"   },
  { id: "feb-m4",     label: "Feb M4"   },
  { id: "feb-m5",     label: "Feb M5"   },
  { id: "mar-m1",     label: "Mar M1"   },
  { id: "mar-m2",     label: "Mar M2"   },
  { id: "mar-m3",     label: "Mar M3"   },
  { id: "mar-m4",     label: "Mar M4"   },
  { id: "mar-m5",     label: "Mar M5"   },
  { id: "apr-m1",     label: "Apr M1"   },
  { id: "apr-m2",     label: "Apr M2"   },
  { id: "apr-m3",     label: "Apr M3"   },
  { id: "apr-m4",     label: "Apr M4"   },
  { id: "mei-m1",     label: "Mei M1"   },
  { id: "mei-m2",     label: "Mei M2"   },
  { id: "mei-m3",     label: "Mei M3"   },
  { id: "mei-m4",     label: "Mei M4"   },
  { id: "mei-m5",     label: "Mei M5"   },
  { id: "jun-m1",     label: "Jun M1"   },
  { id: "jun-m2",     label: "Jun M2"   },
  { id: "jun-m3",     label: "Jun M3"   },
  { id: "jun-m4",     label: "Jun M4"   },
  { id: "jul-m1",     label: "Jul M1"   },
  { id: "jul-m2",     label: "Jul M2"   },
  { id: "jul-m3",     label: "Jul M3"   },
  { id: "agu-m1",     label: "Agu M1"   },
  { id: "agu-m2",     label: "Agu M2"   },
  { id: "agu-m3",     label: "Agu M3"   },
  { id: "agu-m4",     label: "Agu M4"   },
  { id: "sep-m1",     label: "Sep M1"   },
  { id: "sep-m2",     label: "Sep M2"   },
  { id: "sep-m3",     label: "Sep M3"   },
  { id: "sep-m4",     label: "Sep M4"   },
  { id: "okt-m1",     label: "Okt M1"   },
  { id: "okt-m2",     label: "Okt M2"   },
  { id: "okt-m3",     label: "Okt M3"   },
  { id: "okt-m4",     label: "Okt M4"   },
  { id: "nov-m1",     label: "Nov M1"   },
  { id: "nov-m2",     label: "Nov M2"   },
  { id: "nov-m3",     label: "Nov M3"   },
  { id: "nov-m4",     label: "Nov M4"   },
  { id: "des-m1",     label: "Des M1"   },
  { id: "des-m2",     label: "Des M2"   },
  { id: "des-m3",     label: "Des M3"   },
  { id: "des-m4",     label: "Des M4"   },
];

// Data dummy menyerupai gambar referensi (ada sel kosong → null → tampil "None")
export const weeklyRows: WeeklyRow[] = [
  {
    tahun: 2023,
    data: {
      m2: 0.42,   "feb-m3": null, "feb-m4": 0.18, "feb-m5": -0.12,
      "mar-m1": 0.55, "mar-m2": 0.88, "mar-m3": -0.05, "mar-m4": 0.31, "mar-m5": null,
      "apr-m1": 0.62, "apr-m2": 0.24, "apr-m3": -0.41, "apr-m4": 0.08,
      "mei-m1": -0.22, "mei-m2": 0.15, "mei-m3": 0.45, "mei-m4": -0.33, "mei-m5": 0.02,
      "jun-m1": 0.38, "jun-m2": -0.09, "jun-m3": 0.11, "jun-m4": null,
      "jul-m1": 0.27, "jul-m2": -0.04, "jul-m3": 0.19,
      "agu-m1": 0.33, "agu-m2": 0.09, "agu-m3": -0.06, "agu-m4": 0.14,
      "sep-m1": 0.21, "sep-m2": -0.18, "sep-m3": 0.07, "sep-m4": 0.29,
      "okt-m1": 0.16, "okt-m2": 0.42, "okt-m3": -0.02, "okt-m4": 0.11,
      "nov-m1": 0.25, "nov-m2": 0.05, "nov-m3": -0.13, "nov-m4": 0.36,
      "des-m1": 0.48, "des-m2": 0.20, "des-m3": 0.09, "des-m4": -0.03,
    },
  },
  {
    tahun: 2024,
    data: {
      m2: -0.08,  "feb-m3": 0.35, "feb-m4": null, "feb-m5": 0.12,
      "mar-m1": 0.49, "mar-m2": -0.15, "mar-m3": 0.68, "mar-m4": 0.21, "mar-m5": 0.03,
      "apr-m1": 0.44, "apr-m2": 0.52, "apr-m3": -0.28, "apr-m4": null,
      "mei-m1": 0.06, "mei-m2": -0.19, "mei-m3": 0.33, "mei-m4": 0.09, "mei-m5": 0.27,
      "jun-m1": 0.41, "jun-m2": 0.14, "jun-m3": -0.07, "jun-m4": 0.05,
      "jul-m1": 0.18, "jul-m2": 0.24, "jul-m3": -0.11,
      "agu-m1": 0.31, "agu-m2": -0.02, "agu-m3": 0.12, "agu-m4": 0.22,
      "sep-m1": 0.08, "sep-m2": -0.20, "sep-m3": 0.04, "sep-m4": 0.35,
      "okt-m1": 0.44, "okt-m2": 0.13, "okt-m3": 0.27, "okt-m4": -0.01,
      "nov-m1": 0.06, "nov-m2": 0.38, "nov-m3": 0.19, "nov-m4": -0.15,
      "des-m1": 0.52, "des-m2": 0.30, "des-m3": -0.08, "des-m4": 0.17,
    },
  },
  {
    tahun: 2025,
    data: {
      m2: 0.23,   "feb-m3": 0.51, "feb-m4": 0.08, "feb-m5": -0.16,
      "mar-m1": null, "mar-m2": 0.72, "mar-m3": 1.05, "mar-m4": 0.38, "mar-m5": 0.61,
      "apr-m1": 0.29, "apr-m2": 0.17, "apr-m3": 0.54, "apr-m4": -0.10,
      "mei-m1": 0.35, "mei-m2": 0.43, "mei-m3": null, "mei-m4": 0.13, "mei-m5": -0.05,
      "jun-m1": 0.22, "jun-m2": 0.31, "jun-m3": -0.13, "jun-m4": 0.16,
      "jul-m1": 0.47, "jul-m2": 0.03, "jul-m3": 0.26,
      "agu-m1": 0.15, "agu-m2": 0.29, "agu-m3": null, "agu-m4": 0.40,
      "sep-m1": 0.33, "sep-m2": 0.07, "sep-m3": -0.09, "sep-m4": 0.24,
      "okt-m1": 0.19, "okt-m2": -0.05, "okt-m3": 0.46, "okt-m4": 0.10,
      "nov-m1": 0.28, "nov-m2": 0.35, "nov-m3": -0.02, "nov-m4": 0.43,
      "des-m1": null, "des-m2": 0.18, "des-m3": 0.37, "des-m4": -0.06,
    },
  },
  {
    tahun: 2026,
    data: {
      m2: 0.15,   "feb-m3": 0.25, "feb-m4": 0.70, "feb-m5": 0.50,
      "mar-m1": 0.00, "mar-m2": 0.88, "mar-m3": 1.28, "mar-m4": 0.62, "mar-m5": null,
      "apr-m1": 0.48, "apr-m2": 0.15, "apr-m3": -0.42, "apr-m4": null,
      "mei-m1": null, "mei-m2": null, "mei-m3": null, "mei-m4": null, "mei-m5": null,
      "jun-m1": null, "jun-m2": null, "jun-m3": null, "jun-m4": null,
      "jul-m1": null, "jul-m2": null, "jul-m3": null,
      "agu-m1": null, "agu-m2": null, "agu-m3": null, "agu-m4": null,
      "sep-m1": null, "sep-m2": null, "sep-m3": null, "sep-m4": null,
      "okt-m1": null, "okt-m2": null, "okt-m3": null, "okt-m4": null,
      "nov-m1": null, "nov-m2": null, "nov-m3": null, "nov-m4": null,
      "des-m1": null, "des-m2": null, "des-m3": null, "des-m4": null,
    },
  },
];