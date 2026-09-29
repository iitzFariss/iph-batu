import { useEffect, useState } from "react";
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Presentation,
  Upload,
  X,
  Printer,
  RefreshCw,
  Plus,
  UserPlus,
} from "lucide-react";
import { api } from "../lib/api";

interface KaderPersonil {
  name: string;
  peran: string;
}

const KADER_FALLBACK: KaderPersonil[] = [
  { name: "Drs. Eko Prasetyo",      peran: "Sekretaris TPID / Notulis" },
  { name: "Siti Rahmawati, S.E.",   peran: "Analis Data BPS" },
  { name: "Budi Santoso M.Si.",     peran: "Bidang Distribusi Disperindag" },
  { name: "Agus Wibowo, S.E.",      peran: "Dinas Pertanian" },
  { name: "Rini Puspita, S.E.",     peran: "Dinas Perdagangan & UKM" },
  { name: "Hendra Gunawan, S.E.",   peran: "Sekretariat Daerah" },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function KelolaRapat() {
  const [petugas, setPetugas] = useState<string[]>([
    "Drs. Eko Prasetyo",
    "Siti Rahmawati, S.E.",
    "Budi Santoso M.Si.",
  ]);
  const [kader, setKader] = useState<KaderPersonil[]>(KADER_FALLBACK);
  const [openPicker, setOpenPicker] = useState(false);

  useEffect(() => {
    api
      .get<{ rows: KaderPersonil[] }>("/pegawai")
      .then(({ rows }) => {
        if (rows && rows.length) setKader(rows.map((p) => ({ name: p.name, peran: p.peran })));
      })
      .catch(() => {});
  }, []);

  const available = kader.filter((k) => !petugas.includes(k.name));

  function addPersonil(name: string) {
    setPetugas((p) => (p.includes(name) ? p : [...p, name]));
    setOpenPicker(false);
  }

  function removePersonil(name: string) {
    setPetugas((p) => p.filter((n) => n !== name));
  }

  return (
    <div className="p-4 sm:p-5 space-y-5 w-full">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-gray-400">
        <span className="hover:text-gray-600 cursor-pointer">Dashboard</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span className="hover:text-gray-600 cursor-pointer">Koordinasi &amp; Kegiatan</span>
        <ChevronRight size={10} className="flex-shrink-0" />
        <span className="text-gray-700 font-medium">Kelola Rapat TPID</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Kelola Jadwal &amp; Agenda Rapat TPID
          </h1>
          <p className="text-xs text-gray-500">
            Penjadwalan rapat koordinasi pengendalian inflasi daerah, penugasan aparatur
            resume, dan distribusi radiogram.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto">
          <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-1 lg:flex-none">
            <RefreshCw size={12} className="text-emerald-600" />
            <span>Sinkron Google Calendar</span>
          </button>
          <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-1 lg:flex-none">
            <Printer size={12} />
            <span>Cetak Jadwal Mingguan</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Rapat Terjadwal", value: "18", sub: "Siklus TA 2026",        icon: <Calendar size={18} className="text-gray-400" />, accent: "" },
          { label: "Menunggu Resume",       value: "2",  sub: "Perlu Tindakan Cepat",  icon: <AlertTriangle size={18} className="text-amber-500" />, accent: "border-l-2 border-l-amber-400" },
          { label: "Selesai Tervalidasi",   value: "16", sub: "88.8% Kepatuhan",       icon: <CheckCircle2 size={18} className="text-emerald-500" />, accent: "border-l-2 border-l-emerald-400" },
        ].map(({ label, value, sub, icon, accent }) => (
          <div key={label} className={`bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between ${accent}`}>
            <div>
              <div className="text-sm text-gray-400 mb-0.5">{label}</div>
              <div className="text-3xl font-black text-gray-900 leading-tight">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
            <div>{icon}</div>
          </div>
        ))}
      </div>

      {/* Form: Jadwalkan Rapat Baru */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-emerald-600" />
            <span className="text-sm font-bold text-gray-900">Jadwalkan Rapat Koordinasi Baru</span>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
            FORM-TPID-04
          </span>
        </div>

        <div className="space-y-4">
          {/* Topik */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Topik / Agenda Koordinasi{" "}
              <span className="text-red-500 font-normal">*Wajib</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Rakor Mingguan Pengendalian Pasokan Sembako"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
            />
          </div>

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Rapat</label>
              <input
                type="date"
                defaultValue="2026-10-05"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Waktu Pelaksanaan</label>
              <div className="relative">
                <input
                  type="time"
                  defaultValue="09:30"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                  WIB
                </span>
              </div>
            </div>
          </div>

          {/* Ruang Rapat */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Ruang Rapat / Tautan Virtual
            </label>
            <div className="relative">
              <FileText size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                defaultValue="Ruang Rapat Utama Lt. 2 Balaikota Among Tani / Zoom ID 892 109"
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Petugas Notulis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700">Petugas Notulis / Resume</label>
              <button
                onClick={() => setOpenPicker((v) => !v)}
                className="flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700"
              >
                <UserPlus size={12} />
                + Tambah Personil
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-2 min-h-[44px]">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {petugas.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-md"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-emerald-800 font-medium">{name}</span>
                    <button
                      onClick={() => removePersonil(name)}
                      className="ml-0.5 text-emerald-400 hover:text-emerald-700"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Pilih aparatur penugasan resume tambahan..."
                className="w-full text-xs text-gray-400 focus:outline-none"
              />
            </div>

            {/* Pick daftar personil (flip card) */}
            {openPicker && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {available.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-gray-400 text-center">
                    Semua personil sudah ditambahkan.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                    {available.map((k) => (
                      <button
                        key={k.name}
                        onClick={() => addPersonil(k.name)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Plus size={12} className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">{k.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{k.peran}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          {[
            { icon: <FileText size={12} />,        label: "Link Surat Radiogram / Undangan Resmi", placeholder: "https://tpid.batukota.go.id/arsip/radiogram-2026-05.pdf" },
            { icon: <Presentation size={12} />,    label: "Link Bahan Tayang / Materi Paparan",    placeholder: "https://drive.google.com/drive/folders/materi-rakor-inflasi" },
            { icon: <FileText size={12} />,        label: "Link / Upload Berkas Dokumentasi",      placeholder: "Tautan penyimpanan berkas dokumentasi foto/rekaman", hasUpload: true },
          ].map(({ icon, label, placeholder, hasUpload }) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                </div>
                {hasUpload && (
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex-shrink-0">
                    <Upload size={12} />
                    Upload
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Submit */}
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
            <Calendar size={15} />
            Buat Jadwal Rapat
          </button>
          <p className="text-center text-xs text-gray-400">
            Radiogram akan secara otomatis diteruskan ke WhatsApp Group TPID Kota Batu.
          </p>
        </div>
      </div>


      {/* Status Pengiriman Radiogram */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-emerald-600" />
            <span className="text-xs sm:text-sm font-bold text-gray-900">Status Pengiriman Radiogram Terakhir</span>
          </div>
          <button className="text-xs sm:text-sm text-emerald-600 font-semibold hover:text-emerald-700 self-start sm:self-auto">
            Lihat Log Transmisi
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: "Surat Undangan No. 005/142/TPID/2026",
              sub: "Terkirim ke 14 OPD Teknis & Forkopimda Kota Batu.",
              status: "DELIVERED (100%)",
              statusCls: "text-emerald-600",
              icon: <CheckCircle2 size={14} className="text-emerald-500" />,
            },
            {
              title: "Disposisi Bahan Paparan Komoditas",
              sub: "Menunggu konfirmasi penerimaan Dinas Koperasi & UMKM",
              status: "PENDING ACK (1 OPD)",
              statusCls: "text-amber-600",
              icon: <AlertCircle size={14} className="text-amber-500" />,
            },
          ].map(({ title, sub, status, statusCls, icon }) => (
            <div key={title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-shrink-0 mt-0.5">{icon}</div>
              <div>
                <div className="text-xs font-semibold text-gray-900 mb-0.5">{title}</div>
                <div className="text-xs text-gray-400 mb-1.5">{sub}</div>
                <div className={`text-xs font-bold ${statusCls}`}>Status: {status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}