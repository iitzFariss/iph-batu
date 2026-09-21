import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type VerifStatus = "selesai-terverifikasi" | "belum-diisi";

interface RapatRow {
  id: string;
  rapat_id: string;
  tanggal: string;
  agenda: string;
  agendaSub: string;
  notulis: string;
  status: VerifStatus;
  terakhirDisunting?: string;
}

interface RisalahPreview {
  rapat_id: string;
  tanggal: string;
  title: string;
  pemimpin: string;
  notulis: string;
  statusValidasi: string;
  indikatorIPH: string;
  nomor: string;
  poinKesepakatan: { no: number; text: string }[];
  catatanBPS: string;
  divalidasiOleh: string;
  token: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const rapatRows: RapatRow[] = [
  {
    id: "1",
    rapat_id: "#RPT-018",
    tanggal: "26 Apr 2026",
    agenda: "Rakor Inflasi Kemendagri",
    agendaSub: "Evaluasi Mingguan M4 April • Ruang Balai Kota Among Tani",
    notulis: "Siti Rahmawati, S.E.",
    status: "selesai-terverifikasi",
    terakhirDisunting: "26 Apr, 14:15",
  },
  {
    id: "2",
    rapat_id: "#RPT-017",
    tanggal: "19 Apr 2026",
    agenda: "Rakor Internal TPID & Diskumperindag",
    agendaSub: "Pemantauan Pasokan Bapokting & Kesiapan Stok Pasar",
    notulis: "Agus Sudrajat, S.Sos.",
    status: "belum-diisi",
    terakhirDisunting: undefined,
  },
  {
    id: "3",
    rapat_id: "#RPT-016",
    tanggal: "12 Apr 2026",
    agenda: "Rakor Pengendalian Angkutan & BBM",
    agendaSub: "Sinergi Dishub & Pertamina Wilayah Malang Raya",
    notulis: "Diana Lestari, M.Si.",
    status: "selesai-terverifikasi",
    terakhirDisunting: "13 Apr, 09:28",
  },
  {
    id: "4",
    rapat_id: "#RPT-015",
    tanggal: "05 Apr 2026",
    agenda: "Rakor Kesiapan Idul Fitri 1447 H",
    agendaSub: "Satgas Pangan Polres Batu & Satpol PP",
    notulis: "Siti Rahmawati, S.E.",
    status: "selesai-terverifikasi",
    terakhirDisunting: "05 Apr, 17:48",
  },
];

const risalahPreview: RisalahPreview = {
  rapat_id: "18",
  tanggal: "26 April 2026",
  title: "Rakor Inflasi Ke...",
  pemimpin: "Pj. Walikota Batu / Sekda",
  notulis: "Siti Rahmawati, S.E.",
  statusValidasi: "Selesai & Diverifikasi BPS",
  indikatorIPH: "-0.42% (Deflasi Terkendali)",
  nomor: "500.2/018/TPID/IV/2026",
  poinKesepakatan: [
    {
      no: 1,
      text: "Komoditas cabai rawit mengalami stabilitas harga setelah pasokan lokal sentra pertanian Pujon dan Bumiaji mulai memasuki siklus panen raya kedua.",
    },
    {
      no: 2,
      text: "Beras SPHP Bulog terjadwal distribusi tambahan sebanyak 20 ton langsung di Pasar Besar Kota Batu guna meredam kenaikan marjinal beras premium.",
    },
    {
      no: 3,
      text: "Operasi pasar murah tingkat kelurahan direkomendasikan pelaksanaannya pada Minggu II Mei 2026 dengan fokus komoditas minyak goreng curah dan gula pasir.",
    },
  ],
  catatanBPS:
    "IPH Kota Batu tercatat -0.42%. Rekomendasi intervensi logistik tetap berjalan untuk memastikan rantai pasok pupuk dan pakan ayam broiler tetap aman sepanjang Mei.",
  divalidasiOleh: "BPS Kota Batu",
  token: "9A81-BATU-IPH-2026",
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function VerifBadge({ status }: { status: VerifStatus }) {
  if (status === "selesai-terverifikasi") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={9} />
        Selesai &amp; Terverifikasi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
      <AlertCircle size={9} />
      Belum Diisi – Menunggu Input
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MonitoringResume() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRapat, setSelectedRapat] = useState("18");

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={14} className="text-emerald-600" />
        <span className="text-sm text-gray-500 font-medium">
          Pusat Tata Kelola Notulensi &amp; Dokumentasi Koordinasi
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          Monitoring Resume &amp; Risalah Rapat TPID
        </h1>
        <p className="text-xs text-gray-500">
          Pemantauan status notulensi, poin kesepakatan koordinasi, dan ringkasan eksekutif
          inflasi mingguan.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Selesai Diverifikasi", value: "16", icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
          { label: "Menunggu Input Notulis", value: "2",  icon: <AlertCircle  size={16} className="text-red-500"     />, cls: "border-l-2 border-l-red-400"     },
          { label: "Revisi Catatan",         value: "1",  icon: <FileText     size={16} className="text-amber-500"   />, cls: "border-l-2 border-l-amber-400"   },
        ].map(({ label, value, icon, cls }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${cls}`}>
            <div>
              <div className="text-sm text-gray-400 mb-0.5">{label}</div>
              <div className="text-3xl font-black text-gray-900">{value}</div>
            </div>
            {icon}
          </div>
        ))}
      </div>

      {/* Tabel Ikhtisar Notulensi */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FileText size={14} className="text-emerald-600" />
              <span className="text-sm font-bold text-gray-900">Tabel Ikhtisar Status Notulensi Rapat</span>
            </div>
            <p className="text-sm text-gray-400">
              Log komprehensif riwayat rapat koordinasi pengendalian inflasi Kota Batu Semester I – 2026.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Urutkan: Terbaru <ChevronDown size={10} />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal size={11} />
              Filter Status
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["ID Rapat", "Tanggal", "Agenda Rapat Koordinasi", "Petugas Notulis", "Status Verifikasi", "Terakhir Disunting", ""].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rapatRows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50/50 transition-colors ${
                  row.status === "belum-diisi" ? "bg-red-50/20" : ""
                }`}
              >
                {/* Left accent bar for active */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {row.rapat_id === "#RPT-018" && (
                      <div className="w-0.5 h-8 bg-emerald-500 rounded-full flex-shrink-0 -ml-2" />
                    )}
                    <span className="text-xs font-bold text-gray-700">{row.rapat_id}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-500 whitespace-nowrap">{row.tanggal}</span>
                </td>
                <td className="px-4 py-4 max-w-[220px]">
                  <div className="text-xs font-semibold text-gray-900 mb-0.5">{row.agenda}</div>
                  <div className="text-xs text-gray-400 leading-relaxed">{row.agendaSub}</div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-700">{row.notulis}</span>
                </td>
                <td className="px-4 py-4">
                  <VerifBadge status={row.status} />
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-400">
                    {row.terakhirDisunting ?? "–"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {row.status === "selesai-terverifikasi" && (
                    <button
                      onClick={() => setSelectedRapat(row.rapat_id.replace("#RPT-", ""))}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                    >
                      Lihat R...
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-400">
            Menampilkan 4 dari 19 Rapat Koordinasi Pengendalian Inflasi TPID
          </span>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400">
              <ChevronLeft size={12} />
            </button>
            {[1, 2].map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center ${
                  currentPage === p
                    ? "bg-emerald-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Pratinjau Risalah */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Pratinjau &amp; Lembar Risalah Terpilih</span>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Preview
            </span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Rapat ID {selectedRapat} – 26 April 2026: Rakor Inflasi Ke...
            <ChevronDown size={10} />
          </button>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Pemimpin Rapat:</div>
            <div className="text-xs font-semibold text-gray-900">{risalahPreview.pemimpin}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Petugas Notulis:</div>
            <div className="text-xs font-semibold text-gray-900">{risalahPreview.notulis}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Status Validasi:</div>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">{risalahPreview.statusValidasi}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Indikator IPH Saat Rapat:</div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {risalahPreview.indikatorIPH}
            </span>
          </div>
        </div>

        {/* Risalah document */}
        <div className="p-6 max-w-2xl mx-auto">
          {/* Kop */}
          <div className="text-center mb-5">
            <div className="text-sm text-gray-500 font-medium tracking-wide mb-0.5">
              PEMERINTAH KOTA BATU • SEKRETARIAT DAERAH
            </div>
            <div className="text-base font-black text-gray-900 tracking-wide">
              TIM PENGENDALI INFLASI DAERAH (TPID)
            </div>
            <div className="text-sm text-gray-500 font-semibold tracking-widest mt-0.5">
              RISALAH RESMI / NOMOR: {risalahPreview.nomor}
            </div>
          </div>

          {/* Pembuka */}
          <div className="text-xs text-gray-800 mb-4 space-y-1">
            <p className="font-semibold">Yth. Bapak Pj. Walikota Batu dan Anggota TPID Kota Batu,</p>
            <p className="text-gray-600 leading-relaxed">
              Melaporkan hasil Rapat Koordinasi Pengendalian Inflasi Daerah bersama Kementerian
              Dalam Negeri yang diselenggarakan pada Senin, 26 April 2026 secara virtual di
              Ruang Rapat Balai Kota Among Tani.
            </p>
          </div>

          {/* Poin Kesepakatan */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mb-4">
            <div className="text-sm font-black text-emerald-800 mb-3 tracking-wide">
              BUTIR POIN KESEPAKATAN &amp; ARAHAN STRATEGIS:
            </div>
            <ol className="space-y-2.5">
              {risalahPreview.poinKesepakatan.map(({ no, text }) => (
                <li key={no} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="font-black text-gray-900 flex-shrink-0">{no}.</span>
                  <span dangerouslySetInnerHTML={{
                    __html: text
                      .replace(/cabai rawit/gi, "<strong>cabai rawit</strong>")
                      .replace(/20 ton/gi, "<strong>20 ton</strong>")
                      .replace(/Minggu II Mei 2026/gi, "<strong>Minggu II Mei 2026</strong>"),
                  }} />
                </li>
              ))}
            </ol>
          </div>

          {/* Catatan BPS */}
          <p className="text-xs text-gray-400 italic leading-relaxed mb-6">
            {risalahPreview.catatanBPS}
          </p>

          {/* Footer */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 font-medium">
                Divalidasi Digital: {risalahPreview.divalidasiOleh}
              </div>
              <div className="text-xs text-gray-400">
                Token Keabsahan: {risalahPreview.token}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">{risalahPreview.notulis}</div>
              <div className="text-xs text-gray-400">Notulis Rapat TPID Kota Batu</div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">
            <FileText size={12} />
            Unduh PDF Resmi
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
            <Search size={12} />
            Verifikasi Token
          </button>
        </div>
      </div>
    </div>
  );
}