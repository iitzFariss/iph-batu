import { useState } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Share2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  Building2,
  BadgeCheck,
  User,
  Mail,
  Users,
  LayoutGrid,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PegawaiStatus = "aktif" | "nonaktif" | "cuti";

interface Pegawai {
  id: string;
  initials: string;
  color: string;
  name: string;
  nip: string;
  instansi: string;
  instansiSub: string;
  peran: string;
  peranIcon: string;
  status: PegawaiStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const pegawaiList: Pegawai[] = [
  {
    id: "1",
    initials: "EP",
    color: "bg-gray-700",
    name: "Drs. Eko Prasetyo, M.Si.",
    nip: "19780410 200312 1 002",
    instansi: "Bagian Perekonomian Setda",
    instansiSub: "Sekretariat Daerah Kota Batu",
    peran: "Admin Sistem & Koordinator Teknis",
    peranIcon: "🛡️",
    status: "aktif",
  },
  {
    id: "2",
    initials: "SR",
    color: "bg-emerald-600",
    name: "Siti Rahmawati, S.E.",
    nip: "19850920 200902 2 004",
    instansi: "BPS Kota Batu",
    instansiSub: "Badan Pusat Statistik",
    peran: "Analis Data BPS & Verifikator",
    peranIcon: "📊",
    status: "aktif",
  },
  {
    id: "3",
    initials: "BS",
    color: "bg-blue-600",
    name: "Budi Santoso, M.Si.",
    nip: "19800315 200501 1 008",
    instansi: "Disperindag Kota Batu",
    instansiSub: "Dinas Perindustrian & Perdagangan",
    peran: "Satgas Pasar & Enumerator",
    peranIcon: "🏪",
    status: "aktif",
  },
  {
    id: "4",
    initials: "AR",
    color: "bg-teal-600",
    name: "Anisa Rahayu, S.P.",
    nip: "19891104 201402 2 001",
    instansi: "Dinas Pertanian",
    instansiSub: "Dinas Pertanian & Ketahanan Pangan",
    peran: "Koordinator Teknis Distribusi",
    peranIcon: "🌾",
    status: "aktif",
  },
  {
    id: "5",
    initials: "BW",
    color: "bg-purple-600",
    name: "Bambang Wijaya",
    nip: "19770808 200312 1 003",
    instansi: "Diskumperindag Kota Batu",
    instansiSub: "Dinas Koperasi & UMKM",
    peran: "Analis Pasar & Harga",
    peranIcon: "📈",
    status: "aktif",
  },
  {
    id: "6",
    initials: "DL",
    color: "bg-amber-600",
    name: "Diana Lestari, M.Si.",
    nip: "19830612 200604 2 002",
    instansi: "Bagian Perekonomian Setda",
    instansiSub: "Sekretariat Daerah Kota Batu",
    peran: "Notulis & Dokumentasi Rapat",
    peranIcon: "📝",
    status: "cuti",
  },
  {
    id: "7",
    initials: "AN",
    color: "bg-rose-600",
    name: "Achmad Nur, S.T.",
    nip: "19920214 201903 1 001",
    instansi: "Dinas Kominfo Kota Batu",
    instansiSub: "Kominfo & Persandian",
    peran: "Admin Teknis Sistem",
    peranIcon: "💻",
    status: "nonaktif",
  },
];

const instansiOptions = [
  "Semua Instansi OPD",
  "Bagian Perekonomian Setda",
  "BPS Kota Batu",
  "Disperindag Kota Batu",
  "Dinas Pertanian",
  "Diskumperindag Kota Batu",
  "Dinas Kominfo Kota Batu",
];

const statusConfig: Record<PegawaiStatus, { label: string; cls: string }> = {
  aktif:    { label: "Aktif",    cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  nonaktif: { label: "Nonaktif", cls: "bg-gray-100 text-gray-500 border border-gray-200"         },
  cuti:     { label: "Cuti",     cls: "bg-amber-50 text-amber-700 border border-amber-200"        },
};

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  mode: "add" | "edit";
  initial?: Pegawai;
  onClose: () => void;
  onSave: (p: Pegawai) => void;
}

function PegawaiModal({ mode, initial, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    name:       initial?.name       ?? "",
    nip:        initial?.nip        ?? "",
    instansi:   initial?.instansi   ?? "",
    instansiSub: initial?.instansiSub ?? "",
    peran:      initial?.peran      ?? "",
    peranIcon:  initial?.peranIcon  ?? "👤",
    status:     initial?.status     ?? "aktif" as PegawaiStatus,
    email:      "",
  });
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.name.trim())    { setError("Nama pegawai wajib diisi."); return; }
    if (!form.nip.trim())     { setError("NIP wajib diisi."); return; }
    if (!form.instansi.trim()){ setError("Instansi wajib diisi."); return; }
    if (!form.peran.trim())   { setError("Peran penugasan wajib diisi."); return; }

    const initials = form.name.split(" ").slice(0,2).map((n: string) => n[0]).join("").toUpperCase();
    const colors = ["bg-gray-700","bg-emerald-600","bg-blue-600","bg-teal-600","bg-purple-600","bg-amber-600","bg-rose-600"];
    const color  = initial?.color ?? colors[Math.floor(Math.random() * colors.length)];

    onSave({
      id:         initial?.id ?? String(Date.now()),
      initials,
      color,
      name:       form.name,
      nip:        form.nip,
      instansi:   form.instansi,
      instansiSub: form.instansiSub,
      peran:      form.peran,
      peranIcon:  form.peranIcon,
      status:     form.status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {mode === "add" ? "Tambah Pegawai Baru" : "Edit Data Pegawai"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "add" ? "Daftarkan personil baru ke direktori TPID" : "Perbarui informasi pegawai terdaftar"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <X size={11} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Nama Lengkap & Gelar <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.name}
                onChange={(e) => { setForm({...form, name: e.target.value}); setError(""); }}
                placeholder="Contoh: Drs. Eko Prasetyo, M.Si."
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* NIP */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              NIP <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <BadgeCheck size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.nip}
                onChange={(e) => { setForm({...form, nip: e.target.value}); setError(""); }}
                placeholder="18 digit NIP ASN"
                maxLength={22}
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 font-mono tracking-wider"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Email Dinas
            </label>
            <div className="relative">
              <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="nama@instansi.go.id"
                className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Instansi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Instansi / OPD <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={form.instansi}
                  onChange={(e) => { setForm({...form, instansi: e.target.value}); setError(""); }}
                  placeholder="Nama instansi"
                  className="w-full pl-8 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Sub-instansi
              </label>
              <input
                value={form.instansiSub}
                onChange={(e) => setForm({...form, instansiSub: e.target.value})}
                placeholder="Nama dinas lengkap"
                className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Peran */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Peran Penugasan TPID <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={form.peranIcon}
                onChange={(e) => setForm({...form, peranIcon: e.target.value})}
                className="px-2 py-2.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {["🛡️","📊","🏪","🌾","📈","📝","💻","📋","🔍","📦"].map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <input
                value={form.peran}
                onChange={(e) => { setForm({...form, peran: e.target.value}); setError(""); }}
                placeholder="Contoh: Analis Data BPS & Verifikator"
                className="flex-1 px-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Status Penugasan
            </label>
            <div className="flex gap-2">
              {(["aktif","nonaktif","cuti"] as PegawaiStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({...form, status: s})}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                    form.status === s
                      ? s === "aktif"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : s === "cuti"
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-gray-400 bg-gray-100 text-gray-600"
                      : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
          >
            {mode === "add" ? "Tambah Pegawai" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KelolaPegawai() {
  const [pegawai, setPegawai]         = useState<Pegawai[]>(pegawaiList);
  const [search, setSearch]           = useState("");
  const [filterInstansi, setFilter]   = useState("Semua Instansi OPD");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal]             = useState<null | { mode: "add" | "edit"; data?: Pegawai }>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const perPage = 4;

  // Filter
  const filtered = pegawai.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.nip.includes(search);
    const matchInstansi =
      filterInstansi === "Semua Instansi OPD" || p.instansi === filterInstansi;
    return matchSearch && matchInstansi;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalAktif    = pegawai.filter((p) => p.status === "aktif").length;
  const totalInstansi = new Set(pegawai.map((p) => p.instansi)).size;

  function handleSave(p: Pegawai) {
    if (modal?.mode === "add") {
      setPegawai((prev) => [p, ...prev]);
    } else {
      setPegawai((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    }
    setModal(null);
  }

  function handleDelete(id: string) {
    setPegawai((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {/* Modal */}
      {modal && (
        <PegawaiModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Hapus Pegawai?</h3>
            <p className="text-xs text-gray-500 mb-4">
              Data pegawai ini akan dihapus permanen dari direktori TPID.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Satuan Tugas Pengendalian Inflasi Daerah (TPID) Kota Batu
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Kelola Pegawai &amp; Satgas TPID
          </h1>
          <p className="text-xs text-gray-500 max-w-lg">
            Direktori resmi dan penugasan personil lintas instansi (Setda, BPS, Disperindag,
            Dinas Pertanian) dalam tim koordinasi pengendalian inflasi daerah.
          </p>
        </div>

        {/* Stat cards */}
        <div className="flex flex-col sm:flex-row items-start gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users size={16} className="text-gray-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Total Personil TPID</div>
              <div className="text-xl font-black text-gray-900">{pegawai.length} Anggota</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <LayoutGrid size={16} className="text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Instansi Terintegrasi</div>
              <div className="text-xl font-black text-emerald-700">{totalInstansi} OPD Pemkot</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-sm font-bold text-gray-900">Direktori Personil Terdaftar TPID</div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manajemen fungsional penugasan dan hak akses pengoperasian sistem IPH 2026
            </p>
          </div>

          {/* Badge */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {totalAktif} ASN / Satgas
          </span>

          {/* Search */}
          <div className="relative flex-shrink-0">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Cari nama atau NIP..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 placeholder:text-gray-300"
            />
          </div>

          {/* Instansi filter */}
          <div className="relative flex-shrink-0">
            <select
              value={filterInstansi}
              onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-gray-700 cursor-pointer"
            >
              {instansiOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
              <Share2 size={12} />
              Ekspor
            </button>
            <button
              onClick={() => setModal({ mode: "add" })}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
            >
              <Plus size={13} />
              Tambah Pegawai Baru
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Nama Pegawai & NIP", "Asal Instansi", "Peran Penugasan TPID", "Status", "Aksi"].map((col) => (
                <th
                  key={col}
                  className="text-left text-xs font-normal text-gray-400 uppercase tracking-wide px-5 py-3"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-gray-400">
                  Tidak ada pegawai ditemukan.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Nama */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${p.color} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">NIP {p.nip}</div>
                      </div>
                    </div>
                  </td>

                  {/* Instansi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={12} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{p.instansi}</div>
                        <div className="text-xs text-gray-400">{p.instansiSub}</div>
                      </div>
                    </div>
                  </td>

                  {/* Peran */}
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-100 rounded-lg max-w-[220px]">
                      <span className="text-sm">{p.peranIcon}</span>
                      <span className="text-sm font-semibold text-gray-700 truncate">{p.peran}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusConfig[p.status].cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        p.status === "aktif"    ? "bg-emerald-500" :
                        p.status === "cuti"     ? "bg-amber-500"   :
                        "bg-gray-400"
                      }`} />
                      {statusConfig[p.status].label}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setModal({ mode: "edit", data: p })}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <span className="text-sm text-gray-400">
            Menampilkan <strong>{Math.min((currentPage - 1) * perPage + 1, filtered.length)}–{Math.min(currentPage * perPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> Pegawai TPID Terdaftar
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-7 h-7 rounded text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentPage === p ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer: SK Legalitas */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-3 bg-white border border-gray-100 rounded-xl px-5 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-gray-500">
            Status Legalitas:{" "}
            <strong className="text-gray-800">SK Walikota No. 188.45/TPID/2026 terverifikasi</strong>
          </span>
          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
            Masa Berlaku: TA 2026
          </span>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
          <Share2 size={12} />
          Unduh SK TPID (PDF)
        </button>
      </div>
    </div>
  );
}