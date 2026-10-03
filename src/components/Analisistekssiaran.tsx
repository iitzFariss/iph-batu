import { useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  TrendingDown,
  Copy,
  Pencil,
  Clock,
  Users,
  Link2,
} from "lucide-react";
import { buildPublicDashboardLink } from "../lib/publicDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Penerima {
  initials: string;
  color: string;
  name: string;
  jabatan: string;
  status: "siap" | "terhubung";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const penerimaSiaran: Penerima[] = [
  { initials: "PW", color: "bg-emerald-600", name: "Pj. Walikota Batu",  jabatan: "Akses Jalur Komando 1",    status: "siap"     },
  { initials: "SD", color: "bg-blue-600",    name: "Sekretaris Daerah",   jabatan: "Ketua Pelaksana Harian TPID", status: "siap"  },
  { initials: "KD", color: "bg-purple-600",  name: "Pusda Kemendagri",    jabatan: "Integrasi Pelaporan API",  status: "terhubung" },
];

const drafText = `// DOKUMEN DISPOSISI KEPALA DAERAH / SIARAN PERS KEMENDAGRI  ID: W3

Yth. Bapak Pj. Walikota Batu / Sekretaris Daerah Kota Batu,
Melaporkan rilis resmi Indeks Perkembangan Harga (IPH)
Kota Batu pada Minggu III April 2026:

1. Angka IPH Gabungan Kota Batu tercatat sebesar -0.42%
   (kategori Deflasi Terkendali).

2. Komoditas utama yang memberikan andil penurunan harga:
   - Beras Medium (-0.25%)
   - Daging Ayam Ras (-0.12%)

3. Komoditas yang mengalami andil kenaikan / fluktuasi:
   - Cabai Rawit (+0.18%)

4. Ketersediaan pasokan 12 bahan pokok di Pasar Besar
   dan pasar tradisional terpantau aman dan distribusi
   logistik lancar.

Demikian laporan Tim Pengendalian Inflasi Daerah (TPID)
Kota Batu.`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalisisTeksSiaran() {
  const [showPenerima, setShowPenerima] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [sendingGrafik, setSendingGrafik] = useState(false);
  const [dashboardLink] = useState(() => buildPublicDashboardLink());

  const currentDraf = drafText;

  function handleCopyTeksLink() {
    navigator.clipboard?.writeText(`${currentDraf}\n\nLink Dashboard Publik: ${dashboardLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendGrafik() {
    setSendingGrafik(true);
    setTimeout(() => setSendingGrafik(false), 2500);
  }

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      {/* Breadcrumb + badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Modul Otomasi Siaran V4
        </span>
        <span className="text-gray-300">•</span>
        <span className="text-sm text-gray-400 font-mono">KEMENDAGRI-IPH-BATU-2026-W16</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-0.5">
            Generator Siaran Pers &amp; Ringkasan Eksekutif TPID
          </h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Sintesis otomatis matriks IPH dan fluktuasi komoditas pangan menjadi draf laporan
            resmi pimpinan daerah dan siaran pers Kemendagri.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-wrap items-center gap-3">
        {[
          { label: "Tahun Anggaran", value: "2026 (Aktif)" },
          { label: "Bulan Pelaporan", value: "April" },
          { label: "Pekan Evaluasi IPH", value: "Minggu III (14 – 20 April 2026)" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100">
              {value}
              <ChevronDown size={11} />
            </button>
          </div>
        ))}
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw size={12} />
            Sinkronkan Ulang Data IPH
          </button>
        </div>
      </div>

      {/* Main 2-col */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 items-start">

        {/* Left: draf */}
        <div className="space-y-3">
          {/* Draf header */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <FileIconSVG />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Draf Siaran Resmi &amp; Notulensi Otomatis</div>
                  <div className="text-xs text-gray-400">Dokumen Terenkripsi • Standar Format Ditjen Bina Bangda</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <TrendingDown size={9} />
                  IPH: -0.42% (Deflasi Terkendali)
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={9} />
                  Diproses: 18 Apr 2026, 09:15 WIB
                </span>
              </div>
            </div>

            {/* Tab nav */}
            <div className="flex items-center gap-0 border-b border-gray-100 px-4" />

            {/* Draf content */}
            <div className="p-4">
              <pre className="text-sm text-gray-700 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-72 overflow-y-auto">
                {currentDraf}
              </pre>
            </div>

            {/* Action bar */}
            <div className="px-4 pb-4 space-y-2">
              {/* Row 1: kirim via WA + salin */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSendGrafik}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sendingGrafik
                      ? "bg-purple-400 text-white cursor-wait"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <Link2 size={12} />
                  {sendingGrafik
                    ? "Membuat Link..."
                    : "Kirim Link Dashboard + Teks via WA"}
                </button>
                <button
                  onClick={handleCopyTeksLink}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Copy size={12} />
                  {copied ? "Teks & Link Tersalin!" : "Salin Teks & Link"}
                </button>
              </div>

              {/* Row 2: edit manual */}
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <Pencil size={11} />
                  Edit Manual
                </button>
              </div>

              {/* Hint */}
              <p className="text-xs text-gray-400">
                "Salin Teks &amp; Link" menyalin draf{" "}
                <strong>Bahasa Resmi</strong> beserta link{" "}
                <span className="font-mono text-gray-500 break-all">{dashboardLink}</span> ke
                clipboard. Link dibuka sebagai dashboard publik — tampilannya sama
                seperti yang dilihat masyarakat.
              </p>
            </div>

            {/* Footer note */}
            <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-gray-50 pt-3">
              <span className="text-xs text-gray-400">
                Draf, belum dikirim
              </span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Daftar Penerima — collapsible */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowPenerima((p) => !p)}
              className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={13} className="text-gray-500" />
                <span className="text-xs font-bold text-gray-900">Daftar Penerima Siaran Cepat</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform ${showPenerima ? "rotate-180" : ""}`}
              />
            </button>
            {showPenerima && (
              <div className="border-t border-gray-100">
                {penerimaSiaran.map((p) => (
                  <div key={p.name} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${p.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.jabatan}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.status === "siap" ? "bg-emerald-500" : "bg-purple-500"}`} />
                      <span className={`text-xs font-semibold ${p.status === "siap" ? "text-emerald-600" : "text-purple-600"}`}>
                        {p.status === "siap" ? "Siap" : "Terhubung"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Tiny SVG icon ────────────────────────────────────────────────────────────

function FileIconSVG() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1H2C1.45 1 1 1.45 1 2v10c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V5L7 1z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 1v4h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}