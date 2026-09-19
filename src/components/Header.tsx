import { Search, SlidersHorizontal, Download, Bell } from "lucide-react";
import UserMenu from "./Usermenu";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-4 flex-shrink-0">
      {/* Nav tabs */}
      <nav className="flex items-center gap-1">
        {[
          { label: "TPID Kota Batu", active: false },
          { label: "Monitoring IPH", active: false },
        ].map(({ label, active }) => (
          <button
            key={label}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              active
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Search */}
      <div className="flex-1 relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari komoditas, data IPH, atau jadwal..."
          className="w-full pl-8 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-gray-400"
        />
      </div>

      {/* Right nav */}
      <nav className="flex items-center gap-1">
        <button className="px-3 py-1.5 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
          Ringkasan Eksekutif
        </button>
        {["Laporan Mingguan", "Indikator Strategis"].map((label) => (
          <button
            key={label}
            className="px-3 py-1.5 rounded text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <SlidersHorizontal size={12} />
          Filter Komoditas
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
          <Download size={12} />
          Unduh Rekap IPH
        </button>
        <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={15} className="text-gray-500" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-px h-6 bg-gray-100" />
        <UserMenu />
      </div>
    </header>
  );
}