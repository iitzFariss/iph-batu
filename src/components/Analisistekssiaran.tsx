import { useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Copy,
  Send,
  Download,
  Pencil,
  ShieldCheck,
  Clock,
  ChevronRight,
  Users,
  BarChart2,
  ImageIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommodityCard {
  name: string;
  price: number;
  unit: string;
  change: number;
  andil: string;
  direction: "turun" | "naik";
  note: string;
}

interface TransmisiRow {
  waktu: string;
  periode: string;
  nilaiIPH: number;
  target: string;
  status: "terkirim";
}

interface Penerima {
  initials: string;
  color: string;
  name: string;
  jabatan: string;
  status: "siap" | "terhubung";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const commodities: CommodityCard[] = [
  {
    name: "Beras Medium",
    price: 12800,
    unit: "kg",
    change: -0.25,
    andil: "-0.25% Andil",
    direction: "turun",
    note: "Pasokan panen raya wilayah barat tersalur lancar.",
  },
  {
    name: "Daging Ayam Ras",
    price: 34500,
    unit: "kg",
    change: -0.12,
    andil: "-0.12% Andil",
    direction: "turun",
    note: "Ketersediaan pakan stabil & stok peternak melimpah.",
  },
  {
    name: "Cabai Rawit",
    price: 48000,
    unit: "kg",
    change: 0.18,
    andil: "+0.18% Andil",
    direction: "naik",
    note: "Kendala panen lokal & penurunan kiriman Kediri.",
  },
];

const transmisiRows: TransmisiRow[] = [
  { waktu: "18 Apr 2026 09:15", periode: "Minggu III Apr 2026", nilaiIPH: -0.42, target: "Pj. Walikota, Sekda, BPS Jatim", status: "terkirim" },
  { waktu: "11 Apr 2026 08:30", periode: "Minggu II Apr 2026",  nilaiIPH: -0.15, target: "Pj. Walikota, Diskoperindag",    status: "terkirim" },
  { waktu: "04 Apr 2026 09:00", periode: "Minggu I Apr 2026",   nilaiIPH:  0.31, target: "Kemendagri, Ditjen Bangda",      status: "terkirim" },
];

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

// ─── Per-tab draf texts ───────────────────────────────────────────────────────

const drafTexts: Record<string, string> = {
  "bahasa-resmi": drafText,

  "poin-ringkas":
`📊 RINGKASAN IPH KOTA BATU — Minggu III April 2026

• IPH Gabungan: -0.42% → Deflasi Terkendali ✅
• Komoditas Turun:
  ↓ Beras Medium   -0.25% (Rp 12.800/kg)
  ↓ Daging Ayam    -0.12% (Rp 34.500/kg)
• Komoditas Naik:
  ↑ Cabai Rawit    +0.18% (Rp 48.000/kg)
• Pasokan 12 bapok: AMAN ✅
• Status Validasi: BPS Terverifikasi

— TPID Kota Batu / Bagian Perekonomian Setda`,

  "siaran-media":
`🌾 *SIARAN PERS TPID KOTA BATU*
Minggu III April 2026

Harga bahan pokok di Kota Batu pekan ini *terkendali*. Indeks Perkembangan Harga (IPH) tercatat *−0,42%*, masuk kategori Deflasi Terkendali.

Harga *beras medium* turun ke Rp 12.800/kg dan *daging ayam* stabil di Rp 34.500/kg. Satu-satunya komoditas yang perlu diperhatikan adalah *cabai rawit* yang naik tipis +0,18% akibat cuaca di sentra Pujon.

Pasokan 12 bahan pokok di Pasar Besar dan Pasar Relokasi Batu dipastikan aman lebih dari 14 hari ke depan.

📌 Info: Tim Pengendalian Inflasi Daerah (TPID) Kota Batu`,
};

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "bahasa-resmi" | "poin-ringkas" | "siaran-media";

export default function AnalisisTeksSiaran() {
  const [activeTab, setActiveTab]       = useState<ActiveTab>("bahasa-resmi");
  const [showPenerima, setShowPenerima] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [sending, setSending]           = useState(false);
  const [sendingGrafik, setSendingGrafik] = useState(false);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "bahasa-resmi",  label: "Bahasa Resmi"  },
    { key: "poin-ringkas",  label: "Poin Ringkas"  },
    { key: "siaran-media",  label: "Siaran Media"  },
  ];

  const currentDraf = drafTexts[activeTab] ?? drafText;

  const tabLabel: Record<ActiveTab, string> = {
    "bahasa-resmi": "Bahasa Resmi",
    "poin-ringkas": "Poin Ringkas",
    "siaran-media": "Siaran Media",
  };

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSend() {
    setSending(true);
    setTimeout(() => setSending(false), 2000);
  }

  function handleSendGrafik() {
    setSendingGrafik(true);
    setTimeout(() => setSendingGrafik(false), 2500);
  }

  return (
    <div className="p-5 space-y-4 w-full">
      {/* Breadcrumb + badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          Modul Otomasi Siaran V4
        </span>
        <span className="text-gray-300">•</span>
        <span className="text-[11px] text-gray-400 font-mono">KEMENDAGRI-IPH-BATU-2026-W16</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">
            Generator Siaran Pers &amp; Ringkasan Eksekutif TPID
          </h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Sintesis otomatis matriks IPH dan fluktuasi komoditas pangan menjadi draf laporan
            resmi pimpinan daerah dan siaran pers Kemendagri.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex-shrink-0">
          <ShieldCheck size={13} className="text-emerald-600" />
          <div>
            <div className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wide">Status Validasi</div>
            <div className="text-[11px] font-bold text-emerald-700">Sinkronisasi Realtime BPS</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
        {[
          { label: "Tahun Anggaran", value: "2026 (Aktif)" },
          { label: "Bulan Pelaporan", value: "April" },
          { label: "Pekan Evaluasi IPH", value: "Minggu III (14 – 20 April 2026)" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
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
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">

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
                  <div className="text-[10px] text-gray-400">Dokumen Terenkripsi • Standar Format Ditjen Bina Bangda</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <TrendingDown size={9} />
                  IPH: -0.42% (Deflasi Terkendali)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Clock size={9} />
                  Diproses: 18 Apr 2026, 09:15 WIB
                </span>
              </div>
            </div>

            {/* Tab nav */}
            <div className="flex items-center gap-0 border-b border-gray-100 px-4">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
                    activeTab === key
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 py-2">
                <span className="text-[10px] text-gray-400">Mono</span>
                <span className="text-[10px] text-gray-400">↕ 100%</span>
              </div>
            </div>

            {/* Draf content */}
            <div className="p-4">
              <pre className="text-[11px] text-gray-700 leading-relaxed font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-72 overflow-y-auto">
                {currentDraf}
              </pre>
            </div>

            {/* Action bar */}
            <div className="px-4 pb-4 space-y-2">
              {/* Row 1: primary send actions */}
              <div className="flex items-center gap-2">
                {/* Kirim teks saja */}
                <button
                  onClick={handleSend}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Send size={12} />
                  {sending ? "Mengirim..." : `Kirim Teks (${tabLabel[activeTab]})`}
                </button>

                {/* Kirim grafik + teks */}
                <button
                  onClick={handleSendGrafik}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    sendingGrafik
                      ? "bg-purple-400 text-white cursor-wait"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <ImageIcon size={12} />
                  <BarChart2 size={12} />
                  {sendingGrafik
                    ? "Menyiapkan Grafik..."
                    : `Kirim Grafik + Teks (${tabLabel[activeTab]}) via WA`}
                </button>
              </div>

              {/* Row 2: secondary actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Copy size={11} />
                  {copied ? "Tersalin!" : "Salin Teks"}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <Download size={11} />
                  Unduh .txt
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                  <Pencil size={11} />
                  Edit Manual
                </button>
              </div>

              {/* Hint */}
              <p className="text-[10px] text-gray-400">
                "Kirim Grafik + Teks" akan melampirkan visualisasi matriks andil komoditas
                bersama draf teks <strong>{tabLabel[activeTab]}</strong> ke WhatsApp Dinas.
              </p>
            </div>

            {/* Footer note */}
            <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-gray-50 pt-3">
              <ShieldCheck size={10} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">
                Sesuai Standar Template Pelaporan TPID Kemendagri RI No. 500/2026. Checksum: SHA256-789a4b2c
              </span>
            </div>
          </div>

          {/* Riwayat Transmisi */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900">Riwayat Transmisi Siaran (Pekan Terakhir)</span>
              <button className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-700">
                Lihat Semua Arsip
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Waktu Rilis", "Periode", "Nilai IPH", "Target Disposisi", "Status", "Aksi"].map((col) => (
                    <th key={col} className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-2.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transmisiRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">{row.waktu}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-700">{row.periode}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-black ${row.nilaiIPH < 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        {row.nilaiIPH > 0 ? "+" : ""}{row.nilaiIPH.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500">{row.target}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Terkirim
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-700">
                        Buka Draf
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">

          {/* Catatan Pengawasan */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-amber-500">⚠</span>
              <span className="text-xs font-bold text-amber-800">Catatan Pengawasan Komoditas</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed mb-2.5">
              Meskipun IPH gabungan deflasi (−0.42%), komoditas{" "}
              <strong>Cabai Rawit</strong> mengalami tekanan kenaikan harga +0.18% di Pasar
              Relokasi Batu akibat cuaca penghujan di sentra Pujon.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-600 font-semibold">
                Rekomendasi: Operasi Pasar Terbatas
              </span>
              <button className="flex items-center gap-0.5 text-[10px] text-amber-700 font-bold hover:text-amber-900">
                Detail Pemicu <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Matriks Andil Fluktuasi */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-900">Matriks Andil Fluktuasi</span>
              <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                Minggu III
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {commodities.map((c) => (
                <div key={c.name} className="px-3.5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-800">{c.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.direction === "turun"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-red-50 text-red-600"
                    }`}>
                      {c.andil}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-gray-900">
                        Rp {c.price.toLocaleString("id-ID")}
                      </span>
                      <span className="text-[10px] text-gray-400">/{c.unit}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-semibold ${
                      c.direction === "turun" ? "text-blue-600" : "text-red-600"
                    }`}>
                      {c.direction === "turun"
                        ? <TrendingDown size={10} />
                        : <TrendingUp size={10} />}
                      {c.direction === "turun" ? "Turun" : "Naik"} Rp{" "}
                      {Math.abs(Math.round(c.price * Math.abs(c.change) / 100)).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{c.note}</p>
                </div>
              ))}
            </div>
          </div>

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
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {penerimaSiaran.map((p) => (
                  <div key={p.name} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${p.color} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
                        {p.initials}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.jabatan}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.status === "siap" ? "bg-emerald-500" : "bg-purple-500"}`} />
                      <span className={`text-[10px] font-semibold ${p.status === "siap" ? "text-emerald-600" : "text-purple-600"}`}>
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