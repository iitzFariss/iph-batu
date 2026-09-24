import { TrendingDown, Home, ArrowLeft, AlertTriangle } from "lucide-react";

interface Error404Props {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

function BrokenChart404() {
  return (
    <svg viewBox="0 0 400 120" className="w-full max-w-md opacity-20" xmlns="http://www.w3.org/2000/svg">
      {[20, 50, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <polyline
        points="0,80 60,65 120,55 180,60 220,50"
        fill="none" stroke="#10b981" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        className="svg-draw"
      />
      <circle cx="220" cy="50" r="4" fill="#f59e0b" className="svg-pop" />
      <g className="svg-x">
        <line x1="232" y1="42" x2="252" y2="62" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="252" y1="42" x2="232" y2="62" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <line x1="270" y1="50" x2="400" y2="50" stroke="#374151" strokeWidth="1.5" className="svg-march" />
    </svg>
  );
}

export default function Error404({ onGoHome, onGoBack }: Error404Props) {
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
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={13} /> Kembali
          </button>
        )}
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-xl w-full text-center">

          {/* Big code */}
          <div className="rise-in">
            <div className="text-[180px] font-black leading-none text-amber-400 opacity-10 select-none animate-float-y">
              404
            </div>
          </div>

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 mb-6 -mt-16 relative z-10 rise-in-1 animate-icon-glow">
            <AlertTriangle size={32} className="text-amber-600 animate-wiggle" />
          </div>

          {/* Text */}
          <div className="rise-in-2">
            <h1 className="text-3xl font-black text-gray-900 mb-3">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-base font-semibold text-amber-600 mb-3">
              Data komoditas yang kamu cari tidak ada di pasar ini.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
              Halaman yang kamu tuju tidak tersedia, sudah dipindahkan, atau
              alamatnya salah. Coba periksa URL atau kembali ke dashboard.
            </p>
          </div>

          {/* Chart */}
          <div className="flex justify-center mb-10 rise-in-3">
            <BrokenChart404 />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mb-10 rise-in-3">
            <button
              onClick={onGoHome}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Home size={14} />
              Kembali ke Dashboard
            </button>
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={14} />
                Halaman Sebelumnya
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="rise-in-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
              Atau pergi ke
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { label: "Dashboard",        desc: "Beranda utama sistem"   },
                { label: "Rekapan Data",     desc: "Arsip data IPH"         },
                { label: "Visualisasi Tren", desc: "Grafik perkembangan"    },
              ].map(({ label, desc }) => (
                <button
                  key={label}
                  onClick={onGoHome}
                  className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-100 transition-all"
                >
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                  <span className="text-[10px] text-gray-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">© 2026 TPID Kota Batu • Bagian Perekonomian Setda</span>
        <span className="text-[11px] text-gray-400">Kode Error: HTTP 404</span>
      </div>
    </div>
  );
}