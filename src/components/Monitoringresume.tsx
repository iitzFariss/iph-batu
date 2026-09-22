import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  FilePlus,
  X,
  Plus,
  Trash2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type VerifStatus = "selesai-terverifikasi" | "belum-diisi" | "sedang-disunting";

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

const initialRows: RapatRow[] = [
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
    status: "belum-diisi",
    terakhirDisunting: undefined,
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

// ─── Utils ────────────────────────────────────────────────────────────────────

function nowStamp(): string {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("id-ID", { month: "short" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hh}:${mm}`;
}

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
  if (status === "sedang-disunting") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <FilePlus size={9} />
        Sedang Disunting
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
  const { user } = useAuth();
  const [rows, setRows] = useState<RapatRow[]>(initialRows);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRapat, setSelectedRapat] = useState("18");
  const [previewData, setPreviewData] = useState<RisalahPreview>(risalahPreview);

  // State untuk modal input resume rapat (notulis / petugas TPID)
  const [modalRow, setModalRow] = useState<RapatRow | null>(null);
  const [form, setForm] = useState({ pemimpin: "", indikatorIPH: "-0.42% (Deflasi Terkendali)", ringkasan: "" });
  const [poins, setPoins] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const doneCount = rows.filter((r) => r.status === "selesai-terverifikasi").length;
  const editingCount = rows.filter((r) => r.status === "sedang-disunting").length;
  const pendingCount = rows.filter((r) => r.status === "belum-diisi").length;

  const canInputResume = user?.role === "petugas";

  function openResumeModal(row: RapatRow) {
    setModalRow(row);
    setForm({ pemimpin: "", indikatorIPH: "-0.42% (Deflasi Terkendali)", ringkasan: "" });
    setPoins([""]);
  }

  function closeResumeModal() {
    if (saving) return;
    setModalRow(null);
  }

  function saveResume() {
    if (!modalRow) return;
    const validPoins = poins.map((p) => p.trim()).filter(Boolean);
    if (!form.ringkasan.trim() || validPoins.length === 0) return;
    setSaving(true);

    const rapatNo = modalRow.rapat_id.replace("#RPT-", "");
    const poinKesepakatan = validPoins.map((text, i) => ({ no: i + 1, text }));

    // Perbarui baris tabel
    setRows((prev) =>
      prev.map((r) =>
        r.id === modalRow.id
          ? { ...r, status: "selesai-terverifikasi" as VerifStatus, terakhirDisunting: nowStamp() }
          : r
      )
    );

    // Perbarui pratinjau risalah dengan hasil input
    setPreviewData({
      rapat_id: rapatNo,
      tanggal: modalRow.tanggal,
      title: modalRow.agenda,
      pemimpin: form.pemimpin.trim() || "Pj. Walikota Batu / Sekda",
      notulis: modalRow.notulis,
      statusValidasi: "Selesai & Diverifikasi BPS",
      indikatorIPH: form.indikatorIPH.trim() || "-0.42% (Deflasi Terkendali)",
      nomor: `500.2/${rapatNo}/TPID/IV/2026`,
      poinKesepakatan,
      catatanBPS: form.ringkasan.trim(),
      divalidasiOleh: "BPS Kota Batu",
      token: `9A81-BATU-IPH-2026`,
    });
    setSelectedRapat(rapatNo);
    setSaving(false);
    setModalRow(null);
  }

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
          inflasi mingguan. Petugas notulis dapat mengisi resume rapat yang menunggu input.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Selesai Diverifikasi", value: doneCount, icon: <CheckCircle2 size={16} className="text-emerald-500" />, cls: "border-l-2 border-l-emerald-400" },
          { label: "Menunggu Input Notulis", value: pendingCount, icon: <AlertCircle size={16} className="text-red-500" />, cls: "border-l-2 border-l-red-400" },
          { label: "Revisi Catatan", value: editingCount, icon: <FileText size={16} className="text-amber-500" />, cls: "border-l-2 border-l-amber-400" },
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
              {["ID Rapat", "Tanggal", "Agenda Rapat Koordinasi", "Petugas Notulis", "Status Verifikasi", "Terakhir Disunting", "Aksi"].map(
                (col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-normal text-gray-400 uppercase tracking-wide px-4 py-3"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
                  {row.status === "belum-diisi" ? (
                    canInputResume ? (
                      <button
                        onClick={() => openResumeModal(row)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600"
                      >
                        <FilePlus size={12} />
                        Isi Resume
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-400">
                        Menunggu Notulis
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => { setSelectedRapat(row.rapat_id.replace("#RPT-", "")); setPreviewData(risalahPreview); }}
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
            Menampilkan {rows.length} dari {rows.length} Rapat Koordinasi Pengendalian Inflasi TPID
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
            Rapat ID {selectedRapat} – {previewData.tanggal}: {previewData.title}
            <ChevronDown size={10} />
          </button>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-5 py-3 bg-gray-50/50 border-b border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Pemimpin Rapat:</div>
            <div className="text-xs font-semibold text-gray-900">{previewData.pemimpin}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Petugas Notulis:</div>
            <div className="text-xs font-semibold text-gray-900">{previewData.notulis}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Status Validasi:</div>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">{previewData.statusValidasi}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Indikator IPH Saat Rapat:</div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {previewData.indikatorIPH}
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
              RISALAH RESMI / NOMOR: {previewData.nomor}
            </div>
          </div>

          {/* Pembuka */}
          <div className="text-xs text-gray-800 mb-4 space-y-1">
            <p className="font-semibold">Yth. Bapak Pj. Walikota Batu dan Anggota TPID Kota Batu,</p>
            <p className="text-gray-600 leading-relaxed">
              Melaporkan hasil Rapat Koordinasi Pengendalian Inflasi Daerah bersama Kementerian
              Dalam Negeri yang diselenggarakan pada {previewData.tanggal} secara virtual di
              Ruang Rapat Balai Kota Among Tani.
            </p>
          </div>

          {/* Poin Kesepakatan */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 mb-4">
            <div className="text-sm font-black text-emerald-800 mb-3 tracking-wide">
              BUTIR POIN KESEPAKATAN &amp; ARAHAN STRATEGIS:
            </div>
            <ol className="space-y-2.5">
              {previewData.poinKesepakatan.map(({ no, text }) => (
                <li key={no} className="flex gap-2 text-xs text-gray-700 leading-relaxed">
                  <span className="font-black text-gray-900 flex-shrink-0">{no}.</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: text
                        .replace(/cabai rawit/gi, "<strong>cabai rawit</strong>")
                        .replace(/20 ton/gi, "<strong>20 ton</strong>")
                        .replace(/Minggu II Mei 2026/gi, "<strong>Minggu II Mei 2026</strong>"),
                    }}
                  />
                </li>
              ))}
            </ol>
          </div>

          {/* Catatan BPS */}
          <p className="text-xs text-gray-400 italic leading-relaxed mb-6">
            {previewData.catatanBPS}
          </p>

          {/* Footer */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 font-medium">
                Divalidasi Digital: {previewData.divalidasiOleh}
              </div>
              <div className="text-xs text-gray-400">
                Token Keabsahan: {previewData.token}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-gray-900">{previewData.notulis}</div>
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

      {/* ── Modal Input Resume Rapat (Notulis / Petugas TPID) ── */}
      {modalRow && canInputResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Isi Resume Rapat</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modalRow.rapat_id} • {modalRow.tanggal} • {modalRow.agenda}
                </p>
              </div>
              <button
                onClick={closeResumeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Pemimpin Rapat
                </label>
                <input
                  type="text"
                  value={form.pemimpin}
                  onChange={(e) => setForm((f) => ({ ...f, pemimpin: e.target.value }))}
                  placeholder="cth. Pj. Walikota Kota Batu / Sekda"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Indikator IPH Saat Rapat
                </label>
                <input
                  type="text"
                  value={form.indikatorIPH}
                  onChange={(e) => setForm((f) => ({ ...f, indikatorIPH: e.target.value }))}
                  placeholder="-0.42% (Deflasi Terkendali)"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Ringkasan / Catatan Notulensi</label>
                  {!form.ringkasan.trim() && (
                    <span className="text-[11px] text-red-400">wajib diisi</span>
                  )}
                </div>
                <textarea
                  value={form.ringkasan}
                  onChange={(e) => setForm((f) => ({ ...f, ringkasan: e.target.value }))}
                  rows={3}
                  placeholder="Tulis ringkasan jalannya rapat, catatan teknis, dan rekomendasi tindak lanjut..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300 resize-none"
                />
              </div>

              {/* Poin kesepakatan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Butir Poin Kesepakatan</label>
                  {poins.length === 0 && (
                    <span className="text-[11px] text-red-400">minimal 1 poin</span>
                  )}
                </div>
                <div className="space-y-2">
                  {poins.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400 flex-shrink-0 w-4">{i + 1}.</span>
                      <input
                        type="text"
                        value={p}
                        onChange={(e) =>
                          setPoins((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                        }
                        placeholder="Tulis poin kesepakatan / arahan strategis"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setPoins((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPoins((prev) => [...prev, ""])}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                >
                  <Plus size={12} />
                  Tambah Poin Kesepakatan
                </button>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <AlertCircle size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Resume yang disimpan akan langsung tampil pada pratinjau risalah dan mengubah
                  status rapat menjadi{" "}
                  <strong className="text-emerald-700">Selesai &amp; Terverifikasi</strong>.
                </p>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={closeResumeModal}
                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={saveResume}
                disabled={saving || !form.ringkasan.trim() || poins.every((p) => !p.trim())}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FilePlus size={12} />
                Simpan Resume Rapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}