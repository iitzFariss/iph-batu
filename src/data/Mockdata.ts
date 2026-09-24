export interface Commodity {
  id: string;
  name: string;
  unit: string;
  price: number;
  change: number; // percent week-on-week
  status: "deflasi" | "waspada" | "terkendali" | "stabil";
}

export interface ActivityLog {
  id: string;
  datetime: string;
  officer: string;
  agency: string;
  description: string;
  status: "terverifikasi-bps" | "disetujui-asisten" | "terverifikasi" | "terproses-ai";
}

export interface AgendaItem {
  id: string;
  title: string;
  type: "mendesak" | "rutin";
  urgency: "wajib" | "internal";
  datetime: string;
  location: string;
  actions: string[];
}

export interface CommodityFrequency {
  name: string;
  count: number;
}

export interface TrendPoint {
  label: string;
  iph: number;
}

export const iphTrend: TrendPoint[] = [
  { label: "Jan M1", iph: 0.20  },
  { label: "Jan M2", iph: 0.45  },
  { label: "Jan M3", iph: 1.10  },
  { label: "Jan M4", iph: 0.90  },
  { label: "Feb M1", iph: 0.60  },
  { label: "Feb M2", iph: 0.25  },
  { label: "Feb M3", iph: 0.70  },
  { label: "Feb M4", iph: 0.50  },
  { label: "Mar M1", iph: 0.0   },
  { label: "Mar M2", iph: 0.88  },
  { label: "Mar M3", iph: 1.28  },
  { label: "Mar M4", iph: 0.62  },
  { label: "Apr M1", iph: 0.48  },
  { label: "Apr M2", iph: 0.15  },
  { label: "Apr M3", iph: -0.42 },
];

export const commodities: Commodity[] = [
  { id: "1", name: "Beras Medium", unit: "Satuan / kg", price: 13200, change: -0.25, status: "deflasi" },
  { id: "2", name: "Cabai Rawit", unit: "Satuan / kg", price: 38500, change: 0.18, status: "waspada" },
  { id: "3", name: "Daging Ayam Ras", unit: "Satuan / kg", price: 34800, change: -0.12, status: "terkendali" },
  { id: "4", name: "Minyak Goreng Curah", unit: "Satuan / liter", price: 15700, change: 0.0, status: "stabil" },
  { id: "5", name: "Telur Ayam Ras", unit: "Satuan / kg", price: 27500, change: 0.0, status: "stabil" },
];

export const commodityFrequency: CommodityFrequency[] = [
  { name: "Beras Medium",      count: 24 },
  { name: "Cabai Rawit",       count: 31 },
  { name: "Daging Ayam Ras",   count: 18 },
  { name: "Minyak Goreng Curah", count: 22 },
  { name: "Telur Ayam Ras",    count: 15 },
];

export const activityLogs: ActivityLog[] = [
  {
    id: "1",
    datetime: "24 Apr 2026, 08:15 WIB",
    officer: "Bambang Setyadi, S.Stat.",
    agency: "BPS Kota Batu",
    description: "Pengunggahan Tabel Komoditas IPH Minggu III Periode April",
    status: "terverifikasi-bps",
  },
  {
    id: "2",
    datetime: "23 Apr 2026, 15:40 WIB",
    officer: "Ratna Dewi, M.Si.",
    agency: "Bagian Perekonomian Setda Kota Batu",
    description: "Finalisasi Notulensi Evaluasi Pasar Murah Kecamatan Junrejo",
    status: "disetujui-asisten",
  },
  {
    id: "3",
    datetime: "23 Apr 2026, 11:20 WIB",
    officer: "Ahmad Fauzi, S.E.",
    agency: "Disperindag Kota Batu",
    description: "Pembaruan Harga Harian Pasar Besar Batu (Survei Lapangan Pagi)",
    status: "terverifikasi",
  },
  {
    id: "4",
    datetime: "22 Apr 2026, 16:05 WIB",
    officer: "Sistem Otomasi TPID",
    agency: "Dinas Kominfo Kota Batu",
    description: "Generate Draf Otomatis Analisis Siaran Pers IPH Mingguan via Modul AI",
    status: "terproses-ai",
  },
];

export const agendaItems: AgendaItem[] = [
  {
    id: "1",
    title: "Rakor Pengendalian Inflasi Daerah Kemendagri",
    type: "mendesak",
    urgency: "wajib",
    datetime: "Senin, 28 April 2026 • 08.00 WIB (Virtual Zoom)",
    location: "Virtual Zoom",
    actions: ["Radiogram Kemendagri", "Bahan Paparan Pj. Walikota"],
  },
  {
    id: "2",
    title: "Evaluasi Operasi Pasar Murah & Subsidi Angkutan",
    type: "rutin",
    urgency: "internal",
    datetime: "Rabu, 30 April 2026 • 13.00 WIB (Ruang Rapat Utama)",
    location: "Ruang Rapat Utama",
    actions: ["Notulensi Sebelumnya"],
  },
];