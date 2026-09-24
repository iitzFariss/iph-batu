import { useState } from "react";
import { TrendingDown, Home, RefreshCw, ServerCrash } from "lucide-react";

interface Error500Props {
  onGoHome?: () => void;
  onRetry?: () => void;
}

function CrashedChart500() {
  return (
    <svg viewBox="0 0 400 120" className="w-full max-w-md opacity-20" xmlns="http://www.w3.org/2000/svg">
      {[20, 50, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {/* Normal line */}
      <polyline
        points="0,80 60,65 120,55 180,60 220,48"
        fill="none" stroke="#10b981" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Crash point */}
      <circle cx="220" cy="48" r="4" fill="#ef4444" />
      {/* Crash line going down */}
      <polyline
        points="220,48 260,90 300,108 360,104"
        fill="none" stroke="#ef4444" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="6 3"
      />
      {/* Shaded crash area */}
      <polygon
        points="220,48 260,90 300,108 360,104 360,120 220,120"
        fill="#ef4444" fillOpacity="0.08"
      />
    </svg>
  );
}

export default function Error500({ onGoHome, onRetry }: Error500Props) {
  const [errorId] = useState(() => {
    return `ERR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  });

  function handleRetry() {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top bar */}
      <nav className="border-b border-gray-200 px-8 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <TrendingDown size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black text-gray-900 leading-tight">TPID Kota Batu</div>
            <div className="text-[9px] text-gray-500 leading-tight">Sistem Pengendalian Inflasi Daerah</div>
          </div>
        </div>
        {/* Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-600 font-semibold">Sistem Terganggu</span>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-xl w-full text-center">

          {/* Big code */}
          <div className="text-[180px] font-black leading-none text-red-500 opacity-10 select-none">
            500
          </div>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 border border-red-200 mb-6 -mt-16 relative z-10">
            <ServerCrash size={32} className="text-red-500" />
          </div>

          {/* Text */}
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Terjadi Kesalahan Server
          </h1>
          <p className="text-base font-semibold text-red-600 mb-3">
            Sistem sedang mengalami gangguan. Tim teknis TPID sedang menangani.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
            Server mengalami error internal. Ini bukan kesalahan kamu — kami
            sedang bekerja untuk memperbaikinya. Coba refresh halaman dalam
            beberapa saat.
          </p>

          {/* Chart */}
          <div className="flex justify-center mb-10">
            <CrashedChart500 />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={14} />
              Coba Lagi
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Home size={14} />
              Kembali ke Dashboard
            </button>
          </div>

          {/* Status card */}
          <div className="inline-flex items-start gap-4 bg-white border border-gray-200 rounded-2xl px-6 py-5 text-left max-w-sm w-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1.5" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 mb-1">Status Sistem TPID</div>
              <div className="text-[11px] text-gray-500 leading-relaxed mb-2.5">
                Gangguan terdeteksi pada server IPH. Tim teknis telah
                dinotifikasi secara otomatis dan sedang dalam penanganan.
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">
                  {errorId}
                </span>
                <span className="text-[10px] text-gray-400">ID Laporan Error</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">© 2026 TPID Kota Batu • Bagian Perekonomian Setda</span>
        <span className="text-[11px] text-gray-400">Kode Error: HTTP 500</span>
      </div>
    </div>
  );
}