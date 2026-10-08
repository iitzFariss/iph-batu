import { Home, ArrowLeft } from "lucide-react";

interface Error404Props {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

export default function Error404({ onGoHome, onGoBack }: Error404Props) {
  return (
    <section className="min-h-dvh bg-gray-50 text-gray-900 flex items-center justify-center px-5 py-12" aria-labelledby="error-heading">
      <div className="max-w-lg w-full">
        <p className="section-label">TPID Kota Batu / 404</p>
        <h1 id="error-heading" className="text-3xl font-semibold mb-4">Halaman tidak tersedia</h1>
        <p className="text-gray-600 leading-relaxed">Halaman yang Anda tuju tidak ditemukan atau tidak dapat diakses oleh akun ini. Kembali ke dashboard untuk melanjutkan.</p>
        <div className="flex flex-wrap gap-3 mt-7">
          {onGoHome && <button onClick={onGoHome} className="button-primary"><Home size={17} aria-hidden="true" />Kembali ke Dashboard</button>}
          {onGoBack && <button onClick={onGoBack} className="button-secondary"><ArrowLeft size={17} aria-hidden="true" />Halaman Sebelumnya</button>}
        </div>
      </div>
    </section>
  );
}
