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
  { id: "jan-m1",     label: "Jan M1"   },
  { id: "jan-m2",     label: "Jan M2"   },
  { id: "jan-m3",     label: "Jan M3"   },
  { id: "jan-m4",     label: "Jan M4"   },
  { id: "jan-m5",     label: "Jan M5"   },
  { id: "feb-m1",     label: "Feb M1"   },
  { id: "feb-m2",     label: "Feb M2"   },
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
  { id: "apr-m5",     label: "Apr M5"   },
  { id: "mei-m1",     label: "Mei M1"   },
  { id: "mei-m2",     label: "Mei M2"   },
  { id: "mei-m3",     label: "Mei M3"   },
  { id: "mei-m4",     label: "Mei M4"   },
  { id: "mei-m5",     label: "Mei M5"   },
  { id: "jun-m1",     label: "Jun M1"   },
  { id: "jun-m2",     label: "Jun M2"   },
  { id: "jun-m3",     label: "Jun M3"   },
  { id: "jun-m4",     label: "Jun M4"   },
  { id: "jun-m5",     label: "Jun M5"   },
  { id: "jul-m1",     label: "Jul M1"   },
  { id: "jul-m2",     label: "Jul M2"   },
  { id: "jul-m3",     label: "Jul M3"   },
  { id: "jul-m4",     label: "Jul M4"   },
  { id: "jul-m5",     label: "Jul M5"   },
  { id: "agu-m1",     label: "Agu M1"   },
  { id: "agu-m2",     label: "Agu M2"   },
  { id: "agu-m3",     label: "Agu M3"   },
  { id: "agu-m4",     label: "Agu M4"   },
  { id: "agu-m5",     label: "Agu M5"   },
  { id: "sep-m1",     label: "Sep M1"   },
  { id: "sep-m2",     label: "Sep M2"   },
  { id: "sep-m3",     label: "Sep M3"   },
  { id: "sep-m4",     label: "Sep M4"   },
  { id: "sep-m5",     label: "Sep M5"   },
  { id: "okt-m1",     label: "Okt M1"   },
  { id: "okt-m2",     label: "Okt M2"   },
  { id: "okt-m3",     label: "Okt M3"   },
  { id: "okt-m4",     label: "Okt M4"   },
  { id: "okt-m5",     label: "Okt M5"   },
  { id: "nov-m1",     label: "Nov M1"   },
  { id: "nov-m2",     label: "Nov M2"   },
  { id: "nov-m3",     label: "Nov M3"   },
  { id: "nov-m4",     label: "Nov M4"   },
  { id: "nov-m5",     label: "Nov M5"   },
  { id: "des-m1",     label: "Des M1"   },
  { id: "des-m2",     label: "Des M2"   },
  { id: "des-m3",     label: "Des M3"   },
  { id: "des-m4",     label: "Des M4"   },
  { id: "des-m5",     label: "Des M5"   },
];