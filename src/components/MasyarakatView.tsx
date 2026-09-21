import {
  TrendingDown,
  TrendingUp,
  Eye,
  Calendar,
  Info,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const publicCommodities = [
  { name: "Beras Medium",      price: 13200, change: -0.25, unit: "kg",    status: "Turun"  },
  { name: "Cabai Rawit",       price: 38500, change:  0.18, unit: "kg",    status: "Naik"   },
  { name: "Daging Ayam Ras",   price: 34800, change: -0.12, unit: "kg",    status: "Turun"  },
  { name: "Minyak Goreng",     price: 15700, change:  0.00, unit: "liter", status: "Stabil" },
  { name: "Telur Ayam Ras",    price: 27500, change:  0.00, unit: "kg",    status: "Stabil" },
  { name: "Bawang Merah",      price: 32000, change:  0.14, unit: "kg",    status: "Naik"   },
  { name: "Bawang Putih",      price: 24500, change:  0.04, unit: "kg",    status: "Naik"   },
  { name: "Gula Pasir",        price: 17500, change: -0.05, unit: "kg",    status: "Turun"  },
];

export default function MasyarakatView() {
  const { user, logout } = useAuth();

  const initials = (user?.name ?? "U")
    .split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <TrendingDown size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-tight">TPID Kota Batu</div>
            <div className="text-xs text-gray-400 leading-tight">Informasi Harga Publik</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-gray-900">{user?.name}</div>
              <span className="text-[11px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                Masyarakat
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-red-600 font-semibold border border-red-200 rounded-lg hover:bg-red-50"
          >
            <LogOut size={11} />
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Access notice */}
        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
          <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">Mode Tampilan Publik</p>
            <p className="text-sm text-blue-600 leading-relaxed">
              Anda masuk sebagai <strong>Masyarakat</strong>. Halaman ini menampilkan data
              harga komoditas dan tren IPH Kota Batu secara publik. Untuk akses fitur
              pengelolaan data, hubungi TPID Kota Batu.
            </p>
          </div>
        </div>

        {/* IPH Summary */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-500">Sinkronisasi BPS • Minggu III April 2026</span>
          </div>

          <h1 className="text-lg font-black text-gray-900 mb-0.5">
            Indeks Perkembangan Harga (IPH) Kota Batu
          </h1>
          <p className="text-sm text-gray-400 mb-4">
            Pemantauan mingguan harga komoditas pangan pokok di Pasar Besar &amp; Pasar Relokasi Batu
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-0.5">IPH Terkini</div>
              <div className="text-2xl font-black text-emerald-600">-0.42%</div>
              <div className="text-xs font-semibold text-emerald-600">Deflasi Aman</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Koridor Target</div>
              <div className="text-2xl font-black text-gray-900">±0.50%</div>
              <div className="text-xs text-gray-500">Batas Waspada</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-0.5">Status Pasar</div>
              <div className="text-lg font-black text-emerald-600">Terkendali</div>
              <div className="text-xs text-gray-500">18 Komoditas Normal</div>
            </div>
          </div>
        </div>

        {/* Periode info */}
        <div className="flex items-center gap-2 px-1">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-sm text-gray-400">Periode: 14 – 20 April 2026</span>
          <Eye size={12} className="text-gray-400 ml-auto" />
          <span className="text-sm text-gray-400">Data Publik</span>
        </div>

        {/* Commodity list */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Harga Komoditas Pangan Pokok</h2>
            <p className="text-xs text-gray-400">Harga rata-rata survey pasar Kota Batu pekan ini</p>
          </div>

          <div className="divide-y divide-gray-50">
            {publicCommodities.map((c) => (
              <div key={c.name} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">per {c.unit}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-black text-gray-900">
                      Rp {c.price.toLocaleString("id-ID")}
                    </div>
                    <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
                      c.change < 0 ? "text-blue-600" :
                      c.change > 0 ? "text-red-500" :
                      "text-gray-400"
                    }`}>
                      {c.change < 0 && <TrendingDown size={9} />}
                      {c.change > 0 && <TrendingUp size={9} />}
                      {c.change === 0
                        ? "Stabil"
                        : `${c.change > 0 ? "+" : ""}${c.change.toFixed(2)}%`
                      }
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.status === "Turun"  ? "bg-blue-50 text-blue-700"      :
                    c.status === "Naik"   ? "bg-red-50 text-red-600"        :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Data diperbarui setiap Jumat oleh BPS Kota Batu dan diverifikasi TPID
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-gray-400">
            © 2026 Tim Pengendali Inflasi Daerah (TPID) Kota Batu
          </p>
          <p className="text-xs text-gray-400">
            Bagian Perekonomian Setda Kota Batu • BPS Kota Batu
          </p>
        </div>
      </main>
    </div>
  );
}