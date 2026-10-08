import { Home, RefreshCw } from "lucide-react";

interface Error500Props {
  onGoHome?: () => void;
  onRetry?: () => void;
}

export default function Error500({ onGoHome, onRetry }: Error500Props) {
  return (
    <section className="min-h-dvh bg-gray-50 text-gray-900 flex items-center justify-center px-5 py-12" aria-labelledby="error-heading">
      <div className="max-w-lg w-full">
        <p className="section-label">TPID Kota Batu / 500</p>
        <h1 id="error-heading" className="text-3xl font-semibold mb-4">Permintaan belum dapat diproses</h1>
        <p className="text-gray-600 leading-relaxed">Coba muat ulang halaman dalam beberapa saat. Jika gangguan berlanjut, hubungi administrator TPID.</p>
        <div className="flex flex-wrap gap-3 mt-7">
          <button onClick={onRetry ?? (() => window.location.reload())} className="button-primary"><RefreshCw size={17} aria-hidden="true" />Coba Lagi</button>
          {onGoHome && <button onClick={onGoHome} className="button-secondary"><Home size={17} aria-hidden="true" />Kembali ke Dashboard</button>}
        </div>
      </div>
    </section>
  );
}
